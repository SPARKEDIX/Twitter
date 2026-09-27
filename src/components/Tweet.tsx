import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { likeTweet, retweet, bookmarkTweet } from '../store/tweetsSlice';
import { addNotification } from '../store/uiSlice';
import { formatDate, formatCount, classNames } from '../utils/helpers';
import type { Tweet as TweetModel } from '../types';
import './Tweet.css';

interface TweetProps {
  tweet: TweetModel;
}

const Tweet = ({ tweet }: TweetProps) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);

  // These previously did nothing when signed out - the click was swallowed
  // with no feedback at all.
  const requireAuth = (): boolean => {
    if (currentUser) return true;
    dispatch(addNotification({ type: 'error', message: 'Please log in to continue' }));
    return false;
  };

  const handleLike = () => {
    if (requireAuth()) {
      dispatch(likeTweet({ tweetId: tweet.id, userId: currentUser!.id }));
    }
  };

  const handleRetweet = () => {
    if (requireAuth()) {
      dispatch(retweet({ tweetId: tweet.id, userId: currentUser!.id }));
    }
  };

  const handleBookmark = () => {
    if (requireAuth()) {
      dispatch(bookmarkTweet(tweet.id));
    }
  };

  const handleReply = () => {
    if (!requireAuth()) return;
    // Replies are not modelled yet, so surface that instead of a dead click.
    dispatch(
      addNotification({ type: 'info', message: 'Replies are not available in this demo yet.' })
    );
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${tweet.author.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: tweet.content, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${tweet.content} ${shareUrl}`);
      dispatch(addNotification({ type: 'success', message: 'Link copied to clipboard' }));
    } catch {
      // User cancelled the share sheet - nothing to report.
    }
  };

  return (
    <article className="tweet" aria-label={`Tweet by ${tweet.author.displayName}`}>
      <div className="tweet__header">
        <img
          src={tweet.author.avatar}
          alt=""
          className="tweet__avatar"
        />
        <div className="tweet__author">
          <div className="tweet__author-name">
            <span className="tweet__display-name">{tweet.author.displayName}</span>
            {tweet.author.verified && (
              <VerifiedBadge className="tweet__verified" aria-label="Verified account" />
            )}
            <span className="tweet__username">@{tweet.author.username}</span>
          </div>
          <time className="tweet__timestamp" dateTime={tweet.createdAt}>
            {formatDate(tweet.createdAt)}
          </time>
        </div>
        <button
          className="tweet__menu-btn"
          aria-label="More options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreIcon className="tweet__menu-icon" aria-hidden="true" />
        </button>
      </div>
      {menuOpen && (
        <div className="tweet__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="tweet__menu-item"
            onClick={() => {
              navigator.clipboard
                ?.writeText(tweet.content)
                .then(() => dispatch(addNotification({ type: 'success', message: 'Copied to clipboard' })))
                .catch(() => undefined);
              setMenuOpen(false);
            }}
          >
            Copy text
          </button>
          <button
            type="button"
            role="menuitem"
            className="tweet__menu-item"
            onClick={() => {
              if (requireAuth()) {
                dispatch(bookmarkTweet(tweet.id));
                dispatch(
                  addNotification({
                    type: 'success',
                    message: tweet.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
                  })
                );
              }
              setMenuOpen(false);
            }}
          >
            {tweet.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          </button>
        </div>
      )}
      <div className="tweet__content">
        <p className="tweet__text">{tweet.content}</p>
        {tweet.images && tweet.images.length > 0 && (
          <div className="tweet__images" role="list" aria-label="Tweet images">
            {tweet.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Tweet image ${index + 1}`}
                className="tweet__image"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
      <div className="tweet__actions" role="group" aria-label="Tweet actions">
        <button
          className={classNames('tweet__action-btn', tweet.repliesCount > 0 && 'tweet__action-btn--active')}
          onClick={handleReply}
          aria-label={`Replies: ${formatCount(tweet.repliesCount)}`}
        >
          <ChatIcon className="tweet__action-icon" aria-hidden="true" />
          <span className="tweet__action-count">{formatCount(tweet.repliesCount)}</span>
        </button>
        <button
          className={classNames(
            'tweet__action-btn',
            tweet.isRetweeted && 'tweet__action-btn--active',
            tweet.isRetweeted && 'tweet__action-btn--retweeted'
          )}
          onClick={handleRetweet}
          aria-label={`Retweets: ${formatCount(tweet.retweetsCount)}`}
          aria-pressed={tweet.isRetweeted}
        >
          <RetweetIcon className="tweet__action-icon" aria-hidden="true" />
          <span className="tweet__action-count">{formatCount(tweet.retweetsCount)}</span>
        </button>
        <button
          className={classNames(
            'tweet__action-btn',
            tweet.isLiked && 'tweet__action-btn--active',
            tweet.isLiked && 'tweet__action-btn--liked'
          )}
          onClick={handleLike}
          aria-label={`Likes: ${formatCount(tweet.likesCount)}`}
          aria-pressed={tweet.isLiked}
        >
          <HeartIcon className="tweet__action-icon" aria-hidden="true" />
          <span className="tweet__action-count">{formatCount(tweet.likesCount)}</span>
        </button>
        <button
          className={classNames(
            'tweet__action-btn',
            tweet.isBookmarked && 'tweet__action-btn--active',
            tweet.isBookmarked && 'tweet__action-btn--bookmarked'
          )}
          onClick={handleBookmark}
          aria-label={tweet.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          aria-pressed={tweet.isBookmarked}
        >
          <BookmarkIcon className="tweet__action-icon" aria-hidden="true" />
        </button>
        <button className="tweet__action-btn" onClick={handleShare} aria-label="Share">
          <ShareIcon className="tweet__action-icon" aria-hidden="true" />
        </button>
      </div>
      <div className="tweet__divider" aria-hidden="true" />
    </article>
  );
};

// Icons
const VerifiedBadge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 17c-1.75 0-2.73-1.57-2.99-3.73h-.03c-.13.45-.27.88-.27 1.35 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8v-5.42c.03-.09.03-.18.03-.28 0-.71-.3-1.35-.76-1.78-1.54-.14-2.37-1.46-2.51-2.97h-.03c-.46 1.78-1.9 3.18-3.76 3.37v.42zm7.06-8.3c-.12 1.56-.83 2.87-2.02 3.55-.87.5-1.9.77-3.02.77-1.11 0-2.14-.27-3.02-.77-1.19-.68-1.9-1.99-2.02-3.55-.02-.28-.03-.56-.03-.84 0-3.26 2.64-5.9 5.9-5.9s5.9 2.64 5.9 5.9c0 .28-.01.56-.03.84z" />
  </svg>
);

const MoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

const RetweetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M16 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-2 14H5V5h9v5l4 4v9h-7v-5z" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
  </svg>
);

export default Tweet;