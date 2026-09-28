import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setSidebarOpen, addNotification } from '../store/uiSlice';
import { signOutUser } from '../store/authSlice';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery, MOBILE_BREAKPOINT } from '../hooks/useMobile';
import { mockUser } from '../utils/mockData';
import { classNames } from '../utils/helpers';
import './Sidebar.css';
import GatedImage from '../components/GatedImage'

// SVG Icons - defined before use
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M10.09 18.27L3.44 11.73c-.39-.39-.39-1.03 0-1.41l.71-.71c.39-.39 1.03-.39 1.41 0L11 15.17l7.29-7.3c.39-.39 1.03-.39 1.41 0l.71.71c.39.39.39 1.03 0 1.41l-7.29 7.29c-.2.2-.51.2-.71 0z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const EnvelopeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const PeopleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const FeatherIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
  </svg>
);

const navigationItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/explore', label: 'Explore', icon: SearchIcon },
  // /follow existed as a route but had no nav entry, making it unreachable.
  { path: '/follow', label: 'Follow', icon: PeopleIcon },
  { path: '/notifications', label: 'Notifications', icon: BellIcon },
  { path: '/messages', label: 'Messages', icon: EnvelopeIcon },
  { path: '/profile', label: 'Profile', icon: PersonIcon, dynamic: true },
];

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const currentUser = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);

  const closeOnMobile = () => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  // Single source of truth; previously hardcoded as '/profile/rankmandi'.
  const profilePath = `/profile/${currentUser?.username ?? mockUser.username}`;

  const isProfileActive = () => location.pathname.startsWith('/profile/');

  const handleLogout = () => {
    // Async: Firebase clears the session, then the auth observer resolves the
    // store. `unwrap()` is deliberately not used here - a failed sign-out still
    // force-logs-out locally, so there is nothing useful to surface.
    void dispatch(signOutUser());
    dispatch(setSidebarOpen(false));
    dispatch(addNotification({ type: 'info', message: 'You have been logged out.' }));
    navigate('/login', { replace: true });
  };

  const handleCompose = () => {
    closeOnMobile();
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }
    dispatch(
      addNotification({ type: 'info', message: 'Jump to the composer at the top of your timeline.' })
    );
  };

  return (
    <>
      {/* Rendered as a real button so it is keyboard reachable. */}
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="sidebar__backdrop"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-label="Close navigation menu"
        />
      )}
      <aside
        id="main-sidebar"
        className={classNames('sidebar', sidebarOpen && 'sidebar--open')}
        aria-label="Main navigation"
      >
        <nav className="sidebar__nav" aria-label="Primary">
          <ul className="sidebar__list" role="list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isDynamicProfile = item.dynamic === true && item.path === '/profile';
              const itemPath = isDynamicProfile ? profilePath : item.path;
              const isActive = isDynamicProfile
                ? isProfileActive()
                : location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

              return (
                <li key={item.path} className="sidebar__item">
                  <NavLink
                    to={itemPath}
                    className={classNames('sidebar__link', isActive && 'sidebar__link--active')}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={closeOnMobile}
                  >
                    <Icon className="sidebar__icon" aria-hidden="true" />
                    <span className="sidebar__label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sidebar__bottom">
          <button
            type="button"
            className="sidebar__tweet-btn"
            aria-label="Create new post"
            onClick={handleCompose}
          >
            <FeatherIcon className="sidebar__tweet-icon" aria-hidden="true" />
            <span className="sidebar__tweet-text">Post</span>
          </button>
          <div className="sidebar__user">
            <GatedImage
              src={currentUser?.avatar ?? mockUser.avatar}
              alt=""
              className="sidebar__avatar"
            />
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{currentUser?.displayName ?? mockUser.displayName}</span>
              <span className="sidebar__user-handle">@{currentUser?.username ?? mockUser.username}</span>
            </div>
            <button
              type="button"
              className="sidebar__logout"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon className="sidebar__logout-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
