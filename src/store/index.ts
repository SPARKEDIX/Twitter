import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import authReducer from './authSlice';
import tweetsReducer from './tweetsSlice';
import activityReducer from './activitySlice';
import consentReducer from './consentSlice';
import botsReducer from './botsSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    tweets: tweetsReducer,
    activity: activityReducer,
    consent: consentReducer,
    bots: botsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;