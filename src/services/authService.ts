import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
  type AuthProvider,
} from 'firebase/auth';
import { auth, firebaseApp } from '../lib/firebase';
import type { User } from '../types';

/**
 * Firestore is loaded lazily.
 *
 * `firebase/firestore` is ~300 kB of the bundle and the profile read is
 * strictly best-effort (see `loadUserProfile`), so keeping it out of the
 * critical path means a first paint does not have to download it. A static
 * import pushed the main chunk from 399 kB to 951 kB.
 */
type FirestoreModule = typeof import('firebase/firestore');
let firestorePromise: Promise<FirestoreModule> | null = null;

const loadFirestore = (): Promise<FirestoreModule> => {
  firestorePromise ??= import('firebase/firestore');
  return firestorePromise;
};

/** Social providers wired up on the sign-in screen. */
export type SocialProviderId = 'google' | 'github' | 'apple';

export interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

/* ------------------------------------------------------------------ *
 * Firebase error -> human-readable message
 *
 * The SDK throws codes like "auth/wrong-password", which mean nothing to
 * a user. Passing the raw code through was the most confusing part of the
 * previous mock login.
 * ------------------------------------------------------------------ */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'That email and password combination does not match an account.',
  'auth/user-not-found': 'No account exists with that email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account already exists with that email. Try signing in instead.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'Another sign-in window is already open.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/operation-not-allowed': 'That sign-in provider is not enabled in the Firebase console.',
  'auth/unauthorized-domain': 'This domain is not authorised in the Firebase console.',
  'auth/requires-recent-login': 'Please sign in again to complete that action.',
};

export const toAuthErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return error instanceof Error ? error.message : fallback;
  }
  const code = String((error as { code: unknown }).code);
  return AUTH_ERROR_MESSAGES[code] ?? fallback;
};

/* ------------------------------------------------------------------ *
 * Firebase user -> app User
 *
 * Firebase has no notion of a username, so one is derived from the
 * email local-part (or the OAuth display name) and sanitised to the
 * `a-z0-9_` alphabet the profile routes expect.
 * ------------------------------------------------------------------ */
export const sanitizeUsername = (seed: string): string => {
  const cleaned = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 15);
  return cleaned || 'user';
};

const deriveUsername = (fbUser: FirebaseUser): string => {
  const emailName = fbUser.email?.split('@')[0];
  const seed = emailName || fbUser.displayName || fbUser.uid;
  // Suffixing the uid stem keeps two "john@..." addresses from colliding.
  return sanitizeUsername(`${seed}_${fbUser.uid.slice(0, 4)}`);
};

/** Shape stored in Firestore at `users/{uid}`. */
export interface UserProfileRecord {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  verified: boolean;
}

const FALLBACK_AVATAR = 'https://via.placeholder.com/150';

const profileToAppUser = (fbUser: FirebaseUser, profile: UserProfileRecord): User => ({
  id: fbUser.uid,
  username: profile.username,
  displayName: profile.displayName,
  avatar: profile.avatar || fbUser.photoURL || FALLBACK_AVATAR,
  verified: profile.verified,
  bio: profile.bio,
  // Real counters belong to the backend; zero is honest until then.
  followersCount: 0,
  followingCount: 0,
});

/**
 * Reads (or creates on first sign-in) the Firestore profile document.
 *
 * Firestore is best-effort: if the rules reject the read, or no database has
 * been created yet, auth must still work. In that case the profile is derived
 * purely from the Firebase user object.
 */
export const loadUserProfile = async (fbUser: FirebaseUser): Promise<User> => {
  const derived: UserProfileRecord = {
    username: deriveUsername(fbUser),
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'New user',
    bio: '',
    avatar: fbUser.photoURL || FALLBACK_AVATAR,
    verified: false,
  };

  try {
    // Imported here rather than at module scope to keep Firestore (~300 kB)
    // out of the critical bundle. getFirestore is resolved inside the same
    // try, so a project with no Firestore database degrades gracefully.
    const { doc, getDoc, serverTimestamp, setDoc, getFirestore } = await loadFirestore();

    const ref = doc(getFirestore(firebaseApp), 'users', fbUser.uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      return profileToAppUser(fbUser, { ...derived, ...snapshot.data() } as UserProfileRecord);
    }

    // First sign-in for this uid: seed the document so later features have a
    // stable username to read from.
    const seeded: UserProfileRecord = { ...derived };
    await setDoc(
      ref,
      { ...seeded, email: fbUser.email ?? null, createdAt: serverTimestamp() },
      { merge: true }
    );
    return profileToAppUser(fbUser, seeded);
  } catch (error) {
    console.warn(
      '[auth] Firestore profile unavailable; falling back to the Firebase user record. ' +
        'Create a Firestore database and publish rules allowing a signed-in user to read/write /users/{uid}.',
      error
    );
    return profileToAppUser(fbUser, derived);
  }
};

/* ------------------------------------------------------------------ *
 * Sign-in / sign-up / sign-out
 * ------------------------------------------------------------------ */

/** Reloads so displayName/photoURL set moments ago are readable. */
const reloadUser = (fbUser: FirebaseUser): Promise<void> =>
  fbUser.reload().then(
    () => undefined,
    () => undefined
  );

const resolveUser = async (credential: { user: FirebaseUser }): Promise<User> => {
  await reloadUser(credential.user);
  return loadUserProfile(credential.user);
};

export const signInWithEmail = async ({ email, password }: SignInPayload): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return resolveUser(credential);
};

export const signUpWithEmail = async ({ email, password, displayName }: SignUpPayload): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const name = displayName.trim();
  if (name) {
    // Without this the account has no displayName and the UI falls back to
    // showing the email local-part as the user's name.
    await updateProfile(credential.user, { displayName: name }).catch(() => undefined);
  }
  return resolveUser(credential);
};

const getSocialProvider = (providerId: SocialProviderId): AuthProvider => {
  switch (providerId) {
    case 'google':
      return new GoogleAuthProvider();
    case 'github':
      return new GithubAuthProvider();
    case 'apple':
      return new OAuthProvider('apple.com');
    default: {
      // Exhaustiveness guard: adding a provider to the union without wiring
      // it here becomes a compile error rather than a runtime crash.
      const exhaustive: never = providerId;
      throw new Error(`Unsupported provider: ${String(exhaustive)}`);
    }
  }
};

export const signInWithSocialProvider = async (providerId: SocialProviderId): Promise<User> => {
  const credential = await signInWithPopup(auth, getSocialProvider(providerId));
  return resolveUser(credential);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const firebaseSignOut = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Subscribes to Firebase auth state, resolving the Firestore profile for each
 * change. Used to re-hydrate the session on reload and to react to a sign-out
 * performed in another tab.
 */
export const observeAuthState = (
  onResolved: (user: User | null) => void,
  onError?: (error: unknown) => void
): (() => void) =>
  onAuthStateChanged(
    auth,
    async (fbUser) => {
      if (!fbUser) {
        onResolved(null);
        return;
      }
      try {
        onResolved(await loadUserProfile(fbUser));
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => onError?.(error)
  );
