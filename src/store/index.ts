import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import authReducer from './authSlice';
import tweetsReducer from './tweetsSlice';
import activityReducer from './activitySlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    tweets: tweetsReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;