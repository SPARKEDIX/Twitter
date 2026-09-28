import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';

/**
 * Firebase client bootstrap.
 *
 * Everything is read from `import.meta.env` so no credential is hard-coded in
 * the bundle. Vite inlines `VITE_*` at build time, which is exactly what makes
 * the same source work locally and on Vercel (where the variables are set in
 * Project Settings -> Environment Variables).
 */

type FirebaseConfigKeys = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const ENV_MAP: Record<keyof FirebaseConfigKeys, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
};

/**
 * Fail loudly and specifically instead of letting Firebase throw
 * "auth/invalid-api-key" at the first sign-in attempt.
 *
 * `measurementId` is optional (analytics is not used), everything else is
 * required. Failing at module scope is intentional: a misconfigured deploy is
 * a developer error and should be visible in the console on first load, not
 * surface later as an opaque auth failure.
 */
const readConfig = (): FirebaseConfigKeys => {
  const source = import.meta.env as Record<string, string | undefined>;
  const missing: string[] = [];

  const read = (key: keyof FirebaseConfigKeys): string | undefined => {
    const value = source[ENV_MAP[key]]?.trim();
    if (!value && key !== 'measurementId') {
      missing.push(ENV_MAP[key]);
    }
    return value || undefined;
  };

  const config: FirebaseConfigKeys = {
    apiKey: read('apiKey') ?? '',
    authDomain: read('authDomain') ?? '',
    projectId: read('projectId') ?? '',
    storageBucket: read('storageBucket') ?? '',
    messagingSenderId: read('messagingSenderId') ?? '',
    appId: read('appId') ?? '',
    measurementId: read('measurementId'),
  };

  if (missing.length > 0) {
    throw new Error(
      `[firebase] Missing required environment variable(s): ${missing.join(', ')}.\n` +
        'Copy `.env.example` to `.env` and fill in the values, then restart the dev server.\n' +
        'On Vercel, add the same variables under Project Settings -> Environment Variables.'
    );
  }

  return config;
};

const firebaseConfig = readConfig();

/** Reuse the existing instance on HMR re-evaluation instead of double-init. */
export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);

/**
 * `local` persistence keeps the Firebase session alive across reloads, which is
 * what "Remember me" means here. `onAuthStateChanged` then re-resolves the user
 * on boot, so `auth.isAuthenticated` is correct on the very first render after
 * a refresh (the old implementation read a hand-rolled localStorage blob).
 *
 * The call returns a promise because persistence must be applied before any
 * sign-in/read happens. It is deliberately not awaited at module scope: doing
 * so would block the entire bundle behind IndexedDB. Rejections are swallowed
 * because a failure here degrades to in-memory-only auth, not a broken app.
 */
export const firebasePersistenceReady: Promise<void> = setPersistence(auth, browserLocalPersistence)
  .then(() => undefined)
  .catch((error: unknown) => {
    console.warn(
      '[firebase] Could not enable local auth persistence; the session will not survive a refresh.',
      error
    );
  });
