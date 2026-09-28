import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types';
import {
  signInWithEmail as signInWithEmailService,
  signUpWithEmail as signUpWithEmailService,
  signInWithSocialProvider as signInWithSocialProviderService,
  sendPasswordReset as sendPasswordResetService,
  firebaseSignOut,
  toAuthErrorMessage,
  type SignInPayload,
  type SignUpPayload,
  type SocialProviderId,
} from '../services/authService';

/**
 * Auth state is owned by Firebase, not by Redux.
 *
 * The previous slice hand-rolled a localStorage session blob, which meant two
 * sources of truth: Firebase (now) has no idea the app is signed in, and
 * `onAuthStateChanged` is the only thing allowed to decide who is logged in.
 * These thunks are thin - they call the service, then let the observer in
 * `App.tsx` reconcile the store.
 */
const initialState: AuthState = {
  status: 'initializing',
  user: null,
  pending: false,
  error: null,
  resetEmailSent: false,
};

export const signInWithEmail = createAsyncThunk<User, SignInPayload, { rejectValue: string }>(
  'auth/signInWithEmail',
  async (payload, { rejectWithValue }) => {
    try {
      return await signInWithEmailService(payload);
    } catch (error) {
      return rejectWithValue(toAuthErrorMessage(error, 'Unable to sign in. Please try again.'));
    }
  }
);

export const signUpWithEmail = createAsyncThunk<User, SignUpPayload, { rejectValue: string }>(
  'auth/signUpWithEmail',
  async (payload, { rejectWithValue }) => {
    try {
      return await signUpWithEmailService(payload);
    } catch (error) {
      return rejectWithValue(toAuthErrorMessage(error, 'Unable to create your account. Please try again.'));
    }
  }
);

export const signInWithSocialProvider = createAsyncThunk<User, SocialProviderId, { rejectValue: string }>(
  'auth/signInWithSocialProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      return await signInWithSocialProviderService(providerId);
    } catch (error) {
      return rejectWithValue(toAuthErrorMessage(error, 'Unable to sign in with that provider.'));
    }
  }
);

export const sendPasswordReset = createAsyncThunk<void, string, { rejectValue: string }>(
  'auth/sendPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      await sendPasswordResetService(email);
    } catch (error) {
      return rejectWithValue(toAuthErrorMessage(error, 'Unable to send the reset email. Please try again.'));
    }
  }
);

export const signOutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut();
    } catch (error) {
      return rejectWithValue(toAuthErrorMessage(error, 'Unable to sign out. Please try again.'));
    }
  }
);

/** Locally patches the signed-in user (e.g. an edited profile). */
const patchUser = (state: AuthState, user: User | null) => {
  state.user = user;
  state.status = user ? 'authenticated' : 'unauthenticated';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Emitted by the auth observer in `App.tsx` whenever Firebase resolves
     * the session (initial load, sign-in, sign-out, cross-tab change).
     */
    sessionResolved: (state, action: PayloadAction<User | null>) => {
      patchUser(state, action.payload);
      state.error = null;
    },
    /** The observer itself failed; treat as signed out rather than hanging. */
    sessionResolutionFailed: (state) => {
      patchUser(state, null);
    },
    clearAuthError: (state) => {
      state.error = null;
      state.resetEmailSent = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Every auth request follows the same pending/error lifecycle.
    const pending = (state: AuthState) => {
      state.pending = true;
      state.error = null;
    };
    const settled = (state: AuthState, action: PayloadAction<User>) => {
      state.pending = false;
      patchUser(state, action.payload);
    };

    builder
      .addCase(signInWithEmail.pending, pending)
      .addCase(signInWithEmail.fulfilled, settled)
      .addCase(signUpWithEmail.pending, pending)
      .addCase(signUpWithEmail.fulfilled, settled)
      .addCase(signInWithSocialProvider.pending, pending)
      .addCase(signInWithSocialProvider.fulfilled, settled)
      .addCase(sendPasswordReset.pending, pending)
      .addCase(sendPasswordReset.fulfilled, (state) => {
        state.pending = false;
        state.resetEmailSent = true;
      })
      .addCase(signOutUser.pending, (state) => {
        state.pending = true;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.pending = false;
        patchUser(state, null);
      });

    // A rejected *request* surfaces a message. A failed sign-out is the one
    // case where we still force a local sign-out: leaving a half-signed-in
    // UI behind is worse than a slightly wrong store.
    const rejected = (state: AuthState, action: { payload?: string }) => {
      state.pending = false;
      state.error = action.payload ?? 'Something went wrong. Please try again.';
    };

    builder
      .addCase(signInWithEmail.rejected, rejected)
      .addCase(signUpWithEmail.rejected, rejected)
      .addCase(signInWithSocialProvider.rejected, rejected)
      .addCase(sendPasswordReset.rejected, rejected)
      .addCase(signOutUser.rejected, (state, action) => {
        rejected(state, action);
        patchUser(state, null);
      });
  },
});

export const { sessionResolved, sessionResolutionFailed, clearAuthError, updateUser } = authSlice.actions;
export default authSlice.reducer;
