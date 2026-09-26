import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { toggleSidebar } from '../store/uiSlice';
import { NavLink, useLocation } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';
import './Sidebar.css';

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

const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
  </svg>
);

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const MoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const FeatherIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const navigationItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/explore', label: 'Explore', icon: SearchIcon },
  { path: '/notifications', label: 'Notifications', icon: BellIcon },
  { path: '/messages', label: 'Messages', icon: EnvelopeIcon },
  { path: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
  { path: '/lists', label: 'Lists', icon: ListIcon },
  { path: '/profile', label: 'Profile', icon: PersonIcon },
  { path: '/more', label: 'More', icon: MoreIcon },
];

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const location = useLocation();
  const isMobile = useMobile();

  const handleNavClick = () => {
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="sidebar__backdrop" onClick={() => dispatch(toggleSidebar())} aria-hidden="true" />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`} role="navigation" aria-label="Main navigation">
        <nav className="sidebar__nav" aria-label="Primary">
          <ul className="sidebar__list" role="list">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path} className="sidebar__item">
                  <NavLink
                    to={item.path}
                    className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={handleNavClick}
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
          <button className="sidebar__tweet-btn" aria-label="Create new post" onClick={handleNavClick}>
            <FeatherIcon className="sidebar__tweet-icon" aria-hidden="true" />
            <span className="sidebar__tweet-text">Post</span>
          </button>
          <div className="sidebar__user">
            <img
              src="https://via.placeholder.com/40"
              alt=""
              className="sidebar__avatar"
              aria-hidden="true"
            />
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">Your Name</span>
              <span className="sidebar__user-handle">@username</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;