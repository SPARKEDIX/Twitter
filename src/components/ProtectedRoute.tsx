import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';

/**
 * Gate for authenticated-only routes.
 *
 * `auth.status` starts as `initializing` because Firebase needs a moment to
 * re-hydrate the session. Redirecting during that window would bounce a
 * signed-in user to /login on every hard refresh, so we render nothing and
 * wait for the observer in `App.tsx` to resolve instead. The app-level
 * `<Preloader />` is already covering the viewport at that point - mounting a
 * second one here would recreate the competing-overlay bug it was fixed for.
 *
 * The attempted path is preserved in `?redirect=` so the user lands back where
 * they intended after logging in.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const status = useAppSelector((state) => state.auth.status);
  const location = useLocation();

  if (status === 'initializing') {
    return null;
  }

  if (status !== 'authenticated') {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
