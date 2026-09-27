import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState, AppNotification } from '../types';
import { generateId } from '../utils/helpers';

const THEME_STORAGE_KEY = 'twitter-clone:theme';

const readInitialTheme = (): UIState['theme'] => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const initialState: UIState = {
  sidebarOpen: false,
  preloaderVisible: true,
  theme: readInitialTheme(),
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    /** Called on every route change so the next navigation shows the preloader again. */
    showPreloader: (state) => {
      state.preloaderVisible = true;
    },
    hidePreloader: (state) => {
      state.preloaderVisible = false;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      persistTheme(state.theme);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      persistTheme(action.payload);
    },
    addNotification: (
      state,
      action: PayloadAction<Omit<AppNotification, 'id' | 'read' | 'createdAt'>>
    ) => {
      const notification: AppNotification = {
        ...action.payload,
        // generateId avoids the Date.now() collisions the old code had.
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(notification);
      // Cap the stack so spamming "Post" can't grow memory forever.
      if (state.notifications.length > 20) {
        state.notifications.length = 20;
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) notification.read = true;
    },
    /** Needed by the Toaster so a toast can actually be dismissed. */
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

function persistTheme(theme: 'light' | 'dark') {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode) - theme simply won't persist */
  }
}

export const {
  toggleSidebar,
  setSidebarOpen,
  hidePreloader,
  showPreloader,
  toggleTheme,
  setTheme,
  addNotification,
  markNotificationRead,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
