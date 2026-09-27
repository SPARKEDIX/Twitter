import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { toggleSidebar, toggleTheme } from '../store/uiSlice';
import { logout } from '../store/authSlice';
import { mockUser } from '../utils/mockData';
import { NavLink, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const theme = useAppSelector((state) => state.ui.theme);
  const currentUser = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector((state) => state.activity.items.filter((n) => !n.read).length);
  const [query, setQuery] = useState('');

  // Single source of truth. This was hardcoded as '/profile/rankmandi' in
  // two places and never matched mockProfileUser.username.
  const profilePath = `/profile/${currentUser?.username ?? mockUser.username}`;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : '/explore');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    // Each page renders its own <Header>, and the document already has an
    // implicit banner landmark. role="banner" here created duplicates.
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
          aria-controls="main-sidebar"
        >
          <MenuIcon className="header__icon" aria-hidden="true" />
        </button>
        <div className="header__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.658 0 .364.042.718.12 1.06-3.873-.195-7.306-2.05-9.602-4.867-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.202 0-.403-.006-.606.91-.658 1.7-1.477 2.323-2.41z" />
          </svg>
        </div>
      </div>
      <div className="header__center">
        {/* Was an uncontrolled input with no submit handler - typing did nothing. */}
        <form className="header__search" role="search" onSubmit={handleSearch}>
          <SearchIcon className="header__search-icon" aria-hidden="true" />
          <input
            type="search"
            className="header__search-input"
            placeholder="Search on X"
            aria-label="Search on X"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
      <div className="header__right">
        <button
          className="header__icon-btn"
          onClick={() => dispatch(toggleTheme())}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={theme === 'light'}
        >
          {theme === 'dark' ? <SunIcon className="header__icon" aria-hidden="true" /> : <MoonIcon className="header__icon" aria-hidden="true" />}
        </button>
        <button
          className="header__icon-btn header__icon-btn--badge"
          onClick={() => navigate('/notifications')}
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Open notifications'
          }
        >
          <BellIcon className="header__icon" aria-hidden="true" />
          {unreadCount > 0 && <span className="header__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <button
          className="header__icon-btn"
          onClick={() => navigate('/messages')}
          aria-label="Open messages"
        >
          <EnvelopeIcon className="header__icon" aria-hidden="true" />
        </button>
        <button
          className="header__icon-btn"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogoutIcon className="header__icon" aria-hidden="true" />
        </button>
        <NavLink to={profilePath} className="header__profile" aria-label="View your profile">
          <img
            src={currentUser?.avatar ?? mockUser.avatar}
            alt=""
            className="header__avatar"
          />
        </NavLink>
      </div>
    </header>
  );
};

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
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

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
  </svg>
);

export default Header;