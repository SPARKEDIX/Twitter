import { useState, useMemo, type ReactElement, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { markRead, markAllRead, clearAll } from '../store/activitySlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { formatDate } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import type { ActivityType, Notification } from '../types';
import './Notifications.css';

type Filter = 'all' | 'mentions' | 'verified';

const Notifications = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobile();
  // Read from Redux (seeded from the same mock data) instead of the static
  // array, so "mark as read" and "clear all" actually change what renders.
  const notifications = useAppSelector((state) => state.activity.items);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'verified', label: 'Verified' },
  ];

  const displayNotifications = useMemo(() => {
    let result = notifications;

    if (activeFilter === 'mentions') {
      result = result.filter((n) => n.type === 'mention' || n.type === 'reply');
    } else if (activeFilter === 'verified') {
      result = result.filter((n) => n.actor.verified);
    }

    if (showOnlyUnread) {
      result = result.filter((n) => !n.read);
    }

    return result;
  }, [notifications, activeFilter, showOnlyUnread]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    dispatch(markRead(id));
  };

  const handleClearAll = () => {
    dispatch(clearAll());
  };

  const getNotificationIcon = (type: ActivityType): ReactElement => {
    switch (type) {
      case 'like':
        return <LikeIcon className="notification__icon notification__icon--like" aria-hidden="true" />;
      case 'retweet':
        return <RetweetIcon className="notification__icon notification__icon--retweet" aria-hidden="true" />;
      case 'reply':
      case 'mention':
        return <ReplyIcon className="notification__icon notification__icon--reply" aria-hidden="true" />;
      case 'follow':
        return <FollowIcon className="notification__icon notification__icon--follow" aria-hidden="true" />;
      case 'quote':
        return <QuoteIcon className="notification__icon notification__icon--quote" aria-hidden="true" />;
      default:
        return <BellIcon className="notification__icon" aria-hidden="true" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const { actor, type } = notification;
    const actorName = actor.displayName;
    const actorHandle = `@${actor.username}`;

    switch (type) {
      case 'like':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} liked your post
          </>
        );
      case 'retweet':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} reposted your post
          </>
        );
      case 'reply':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} replied to your post
          </>
        );
      case 'follow':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} started following you
          </>
        );
      case 'mention':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} mentioned you in a post
          </>
        );
      case 'quote':
        return (
          <>
            <strong>{actorName}</strong> {actorHandle} quoted your post
          </>
        );
      default:
        return <span>New notification</span>;
    }
  };

  return (
    <div className="notifications">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`}>
        <div className="main__header">
          <div className="notifications__header-content">
            <h1 className="notifications__title">
              Notifications
              {unreadCount > 0 && (
                <span className="notifications__unread-badge" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h1>
            <div className="notifications__header-actions">
              <label className="notifications__filter-toggle">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="notifications__filter-checkbox"
                />
                <span className="notifications__filter-label">Unread only</span>
              </label>
              {unreadCount > 0 && (
                <button
                  className="notifications__clear-btn"
                  onClick={() => dispatch(markAllRead())}
                  aria-label="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notifications__clear-btn"
                  onClick={handleClearAll}
                  aria-label="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="main__content notifications__content">
          <nav className="notifications__filters" role="tablist" aria-label="Notification filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                role="tab"
                aria-selected={activeFilter === filter.id}
                aria-controls={`${filter.id}-panel`}
                id={`${filter.id}-tab`}
                className={`notifications__filter ${activeFilter === filter.id ? 'notifications__filter--active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </nav>

          <div role="tabpanel" id={`${activeFilter}-panel`} aria-labelledby={`${activeFilter}-tab`}>
            {displayNotifications.length === 0 ? (
              <div className="notifications__empty">
                <BellOffIcon className="notifications__empty-icon" aria-hidden="true" />
                <p className="notifications__empty-text">
                  {showOnlyUnread
                    ? 'No unread notifications'
                    : activeFilter === 'verified'
                    ? 'No notifications from verified accounts'
                    : activeFilter === 'mentions'
                    ? 'No mentions yet'
                    : 'No notifications yet'}
                </p>
                <p className="notifications__empty-subtext">
                  When you get notifications, they&apos;ll show up here.
                </p>
              </div>
            ) : (
              <ul className="notifications__list" aria-label="Notifications">
                {displayNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    getIcon={getNotificationIcon}
                    getText={getNotificationText}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const BellOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zM10 6v.68c0 .41-.13.8-.36 1.12L5.13 4.75c-.62-.62-.62-1.63 0-2.25.62-.63 1.63-.63 2.26 0l2.87 2.87 1.53-1.53c.62-.62 1.63-.62 2.26 0 .62.62.62 1.63 0 2.25l-1.53 1.53 2.87 2.87c.62.63.62 1.63 0 2.25-.62.62-1.63.62-2.25 0L9.87 7.55V14h2v8h2v-8h2v-2h-2v-2h2V6h-2V4h-2v2h-2zm10 2l-2.28 2.28" />
  </svg>
);

const LikeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const RetweetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M16 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-2 14H5V5h9v5l4 4v9h-7v-5z" />
  </svg>
);

const ReplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

const FollowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M15 16v-3.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16h4v2h-4v3.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V18H9v-2h4zm-2 3c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  getIcon: (type: ActivityType) => ReactElement;
  getText: (notification: Notification) => ReactNode;
}

const NotificationItem = ({
  notification,
  onMarkRead,
  getIcon,
  getText,
}: NotificationItemProps) => {
  const isUnread = !notification.read;

  const markRead = () => {
    if (!notification.read) onMarkRead(notification.id);
  };

  return (
    // The <li> keeps the list semantics; the inner <button> provides real
    // keyboard/AT support that a bare onClick div never had.
    <li className="notification__item" role="listitem">
      <button
        type="button"
        className={`notification ${isUnread ? 'notification--unread' : ''}`}
        onClick={markRead}
        aria-pressed={isUnread}
        aria-label={
          isUnread
            ? `Mark notification from ${notification.actor.displayName} as read`
            : `Notification from ${notification.actor.displayName}`
        }
      >
        <img
          src={notification.actor.avatar}
          alt=""
          className="notification__avatar"
        />
        <div className="notification__content">
          <div className="notification__header">
            <div className="notification__icon-wrapper">
              {getIcon(notification.type)}
            </div>
            <div className="notification__text">{getText(notification)}</div>
          </div>
          {notification.tweet && (
            <div className="notification__tweet-preview">
              <span className="notification__tweet-author">
                @{notification.tweet.author.username}
              </span>
              <span className="notification__tweet-content">
                {notification.tweet.content}
              </span>
            </div>
          )}
          <time className="notification__timestamp" dateTime={notification.createdAt}>
            {formatDate(notification.createdAt)}
          </time>
        </div>
        {isUnread && (
          <span className="notification__unread-indicator" aria-hidden="true" />
        )}
      </button>
    </li>
  );
};

export default Notifications;