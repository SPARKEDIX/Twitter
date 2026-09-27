import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';

/**
 * Gate for authenticated-only routes.
 *
 * `auth.isAuthenticated` was previously never read anywhere, so every
 * route was reachable while logged out. The attempted redirect path is
 * preserved in `?redirect=` so the user lands back where they intended
 * after logging in.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
