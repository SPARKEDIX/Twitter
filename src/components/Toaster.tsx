import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { removeNotification } from '../store/uiSlice';
import { classNames } from '../utils/helpers';
import type { AppNotification } from '../types';
import './Toaster.css';

const AUTO_DISMISS_MS = 4000;

const Toast = ({ notification }: { notification: AppNotification }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeNotification(notification.id));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dispatch, notification.id]);

  return (
    <div
      className={classNames('toast', `toast--${notification.type}`)}
      role={notification.type === 'error' ? 'alert' : 'status'}
    >
      <span className="toast__message">{notification.message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => dispatch(removeNotification(notification.id))}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
};

/**
 * Renders `ui.notifications`.
 *
 * `addNotification` was dispatched from the composer ("Your post has been
 * sent!", "Image must be less than 5MB", ...) but nothing ever read
 * `state.ui.notifications`, so every toast was silently discarded.
 */
const Toaster = () => {
  const notifications = useAppSelector((state) => state.ui.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="toaster" aria-label="Notifications">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default Toaster;
