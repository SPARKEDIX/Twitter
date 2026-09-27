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
import { useAppDispatch } from './hooks/useRedux';
import './index.css';

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
