import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../types';
// Real-only mode: no seeded notifications.

/**
 * Activity notifications (likes, follows, mentions, ...).
 *
 * These used to be dispatched into `ui.notifications` while the
 * Notifications page rendered the static `mockNotifications` array, so
 * "mark as read" and "clear all" mutated state nothing was reading from
 * and both buttons were no-ops. They now live in their own slice, seeded
 * from the same mock data the page displays.
 */
interface ActivityState {
  items: Notification[];
}

const initialState: ActivityState = {
  items: [],
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllRead: (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    clearAll: (state) => {
      state.items = [];
    },
  },
});

export const { markRead, markAllRead, clearAll } = activitySlice.actions;
export default activitySlice.reducer;
