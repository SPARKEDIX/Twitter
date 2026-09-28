import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Follow from './pages/Follow';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Preloader from './components/Preloader';
import Toaster from './components/Toaster';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useThemeSync } from './hooks/useTheme';
import { showPreloader } from './store/uiSlice';
import { sessionResolved, sessionResolutionFailed } from './store/authSlice';
import { useAppDispatch } from './hooks/useRedux';
import { observeAuthState } from './services/authService';
import { firebasePersistenceReady } from './lib/firebase';
import './index.css';

/**
 * Bridges Firebase auth into Redux.
 *
 * Firebase is the single source of truth for the session. This observer
 * mirrors it into the store on first load, on sign-in/sign-out, and when the
 * user signs out in another tab. Nothing else is allowed to decide whether
 * someone is authenticated.
 */
const AuthObserver = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // `persistenceReady` resolves once localStorage-backed persistence is
    // applied. Subscribing after it guarantees the first `onAuthStateChanged`
    // callback reflects the persisted session rather than a null intermediate.
    let unsubscribe = () => {};

    firebasePersistenceReady
      .then(() => {
        unsubscribe = observeAuthState(
          (user) => dispatch(sessionResolved(user)),
          (error) => {
            console.error('[auth] Failed to resolve the Firebase session.', error);
            dispatch(sessionResolutionFailed());
          }
        );
      })
      .catch((error: unknown) => {
        console.error('[auth] Could not initialise the auth observer.', error);
        dispatch(sessionResolutionFailed());
      });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
};

/** Re-arms the preloader on every navigation, not just the first load. */
const RouteChangeEffects = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  useThemeSync();

  useEffect(() => {
    dispatch(showPreloader());
  }, [dispatch, location.pathname]);

  return null;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      }
    />
    <Route
      path="/explore"
      element={
        <ProtectedRoute>
          <Explore />
        </ProtectedRoute>
      }
    />
    <Route
      path="/follow"
      element={
        <ProtectedRoute>
          <Follow />
        </ProtectedRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/messages"
      element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile/:username"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route path="/bookmarks" element={<Navigate to="/" replace />} />
    <Route path="/lists" element={<Navigate to="/" replace />} />
    <Route path="/more" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthObserver />
          <RouteChangeEffects />
          {/* Rendered once here. It used to also be mounted inside Home,
              producing two competing preloader overlays and timers. */}
          <Preloader />
          <Toaster />
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
