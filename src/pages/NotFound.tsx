import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import { APP_ROUTES, REDIRECTED_PATHS, type AppRoute } from '../config/routes';
import './NotFound.css';

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 10h-1V7a5 5 0 0 0-10 0v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-8-3a2 2 0 0 1 4 0v3h-4z" />
  </svg>
);

/** Dynamic routes need a concrete href; static ones already are one. */
const hrefFor = (route: AppRoute): string => route.examplePath ?? route.path;

/**
 * 404 as a diagnostic readout.
 *
 * The useful part of a dead end is not an apology, it is knowing where you can
 * actually go - so the page lists the real route table and links every entry.
 * That list is read from `config/routes.ts`, the same source the router and
 * the sidebar use, so it cannot list a route that does not exist.
 */
const NotFound = () => {
  const { pathname, search } = useLocation();
  const isAuthenticated = useAppSelector((state) => state.auth.status === 'authenticated');

  // `/bookmarks` and friends resolve via redirect, so a visitor who saw them
  // in a cached copy of the nav deserves to be told why they landed here.
  const isLegacyPath = REDIRECTED_PATHS.includes(pathname);

  const lockedCount = APP_ROUTES.filter((r) => r.requiresAuth && !isAuthenticated).length;

  return (
    <div className="nf">
      <div className="nf__rail">
        <Link to="/" className="nf__back">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
          </svg>
          Timeline
        </Link>
        <span className="nf__status">404 · Not Found</span>
      </div>

      <main className="nf__main">
        <p className="nf__request">
          <span className="nf__method">GET</span>
          <span className="nf__path">
            {pathname}
            {search}
          </span>
        </p>

        <p className="nf__lede">
          {isLegacyPath
            ? 'This path used to be a page. It now forwards to your timeline rather than 404-ing, so you may be seeing a cached copy of an older build.'
            : 'No route in this app matches that path. It was either mistyped, or it belonged to a version of the site that no longer exists.'}
        </p>

        <dl className="nf__fields">
          <div className="nf__field">
            <dt>Status</dt>
            <dd>
              <span className="nf__code">404 Not Found</span>
            </dd>
          </div>
          <div className="nf__field">
            <dt>Reason</dt>
            <dd>
              {isLegacyPath
                ? 'Legacy path, redirected to the timeline'
                : 'No matching route in the client-side route table'}
            </dd>
          </div>
          <div className="nf__field">
            <dt>Session</dt>
            <dd>
              {isAuthenticated
                ? 'Signed in — every route below is reachable'
                : `Signed out — ${lockedCount} of the ${APP_ROUTES.length} routes below will send you to sign in first`}
            </dd>
          </div>
        </dl>

        <h2 className="nf__section-title">Routes that exist</h2>
        <div className="nf__routes">
          {APP_ROUTES.map((route) => (
            <Link key={route.path} to={hrefFor(route)} className="nf__route">
              <span className="nf__route-path">{hrefFor(route)}</span>
              <span className="nf__route-label">
                {route.label}
                {route.requiresAuth && !isAuthenticated && (
                  <span className="nf__lock">
                    <LockIcon />
                    Sign in
                  </span>
                )}
              </span>
              <span className="nf__route-desc">{route.description}</span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="nf__foot">
        <span>Route table: {APP_ROUTES.length} entries</span>
        <Link to="/" className="nf__home">
          Go to the timeline
        </Link>
      </footer>
    </div>
  );
};

export default NotFound;
