import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types';

const AUTH_STORAGE_KEY = 'twitter-clone:auth';

interface AuthStorage {
  user: User;
  token: string;
}

/** Rehydrate the session so a page refresh doesn't log the user out. */
const readInitialState = (): AuthState => {
  const base: AuthState = { isAuthenticated: false, user: null, token: null };
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as AuthStorage;
    if (!parsed?.user?.id || !parsed?.token) return base;
    return { isAuthenticated: true, user: parsed.user, token: parsed.token };
  } catch {
    return base;
  }
};

const initialState: AuthState = readInitialState();

function persist(state: AuthState) {
  try {
    if (state.isAuthenticated && state.user && state.token) {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: state.user, token: state.token } satisfies AuthStorage)
      );
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable - session simply won't survive a refresh */
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      persist(state);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      persist(state);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        persist(state);
      }
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
