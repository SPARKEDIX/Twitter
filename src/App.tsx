import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Follow from './pages/Follow';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import BotChat from './pages/BotChat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import NotFound from './pages/NotFound';
import Preloader from './components/Preloader';
import Toaster from './components/Toaster';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import { useThemeSync } from './hooks/useTheme';
import { showPreloader } from './store/uiSlice';
import { sessionResolved, sessionResolutionFailed } from './store/authSlice';
import { useAppDispatch } from './hooks/useRedux';
import { observeAuthState } from './services/authService';
import { firebasePersistenceReady } from './lib/firebase';
import { APP_ROUTES, REDIRECTED_PATHS } from './config/routes';
import './index.css';

/**
 * Literal union of every route path, derived from the table itself.
 *
 * `Record<RoutePath, ReactNode>` is the guard that matters: add a route
 * without a component (or remove one) and the build fails, instead of the
 * router silently matching a path and rendering nothing.
 */
type RoutePath = (typeof APP_ROUTES)[number]['path'];

const ROUTE_ELEMENTS: Record<RoutePath, ReactNode> = {
  '/': <Home />,
  '/explore': <Explore />,
  '/follow': <Follow />,
  '/notifications': <Notifications />,
  '/messages': <Chat />,
  '/bot-chat': <BotChat />,
  '/profile': <Profile />,
  '/login': <Login />,
  '/privacy': <Privacy />,
  '/cookies': <Cookies />,
};

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
    {/* Built from APP_ROUTES so the route table, the sidebar and the 404
        ledger can never drift apart. `pattern` differs from `path` only for
        the dynamic profile route. */}
    {APP_ROUTES.map(({ path, pattern, requiresAuth }) => {
      const element = ROUTE_ELEMENTS[path];
      return (
        <Route
          key={path}
          path={pattern}
          element={requiresAuth ? <ProtectedRoute>{element}</ProtectedRoute> : element}
        />
      );
    })}

    {/* Legacy paths kept alive as redirects rather than dead ends. */}
    {REDIRECTED_PATHS.map((path) => (
      <Route key={path} path={path} element={<Navigate to="/" replace />} />
    ))}

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
          {/* Last, so it paints over the app rather than under it, and is
              suppressed on the two legal pages where it would be noise. */}
          <CookieConsent />
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
