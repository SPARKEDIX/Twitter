import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../types';

const initialState: UIState = {
  sidebarOpen: true,
  preloaderVisible: true,
  theme: 'dark',
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
    hidePreloader: (state) => {
      state.preloaderVisible = false;
    },
    showPreloader: (state) => {
      state.preloaderVisible = true;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'read' | 'createdAt'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(notification);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) notification.read = true;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  hidePreloader,
  showPreloader,
  toggleTheme,
  setTheme,
  addNotification,
  markNotificationRead,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;