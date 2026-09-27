import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { hidePreloader } from '../store/uiSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Tweet from '../components/Tweet';
import TweetComposer from '../components/TweetComposer';
import {
  mockProfileUser,
  mockProfileTweets,
  mockProfileMedia,
  mockProfileLikes,
} from '../utils/mockData';
import { formatCount, formatDate } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import './Profile.css';

const Profile = () => {
  useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['posts', 'replies', 'media', 'likes'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(hidePreloader());
    }, 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // For demo, always use mockProfileUser regardless of username param
  const profileUser = mockProfileUser;
  const isOwnProfile = currentUser?.username === profileUser.username;

  const tabs = [
    { id: 'posts', label: 'Posts', count: profileUser.tweetsCount },
    { id: 'replies', label: 'Replies', count: mockProfileTweets.filter(t => t.isReply).length },
    { id: 'media', label: 'Media', count: profileUser.mediaCount },
    { id: 'likes', label: 'Likes', count: profileUser.likesCount },
  ];

  const getContentForTab = () => {
    switch (activeTab) {
      case 'posts':
        return mockProfileTweets.filter(t => !t.isReply);
      case 'replies':
        return mockProfileTweets.filter(t => t.isReply);
      case 'media':
        return mockProfileTweets.filter(t => t.images && t.images.length > 0);
      case 'likes':
        return mockProfileLikes;
      default:
        return mockProfileTweets;
    }
  };

  const content = getContentForTab();

  return (
    <div className="profile">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`} role="main">
        <div className="profile__banner" style={{ backgroundImage: `url(${profileUser.banner})` }} aria-hidden="true">
          <div className="profile__banner-gradient" />
        </div>

        <div className="profile__content">
          <div className="profile__avatar-wrapper">
            <img
              src={profileUser.avatar}
              alt={`${profileUser.displayName}'s profile picture`}
              className="profile__avatar"
            />
          </div>

          <div className="profile__info">
            <div className="profile__name-row">
              <h1 className="profile__display-name">{profileUser.displayName}</h1>
              {profileUser.verified && (
                <VerifiedBadge className="profile__verified" aria-label="Verified account" />
              )}
            </div>
            <span className="profile__username">@{profileUser.username}</span>

            <p className="profile__bio">{profileUser.bio}</p>

            <div className="profile__details">
              <span className="profile__detail">
                <LocationIcon className="profile__detail-icon" aria-hidden="true" />
                <span>{profileUser.location}</span>
              </span>
              <a href={profileUser.website} className="profile__detail" target="_blank" rel="noopener noreferrer">
                <LinkIcon className="profile__detail-icon" aria-hidden="true" />
                <span>{profileUser.website.replace('https://', '')}</span>
              </a>
              <span className="profile__detail">
                <CalendarIcon className="profile__detail-icon" aria-hidden="true" />
                <span>Joined {profileUser.joinDate}</span>
              </span>
            </div>

            <div className="profile__stats">
              <a href="#" className="profile__stat" aria-label={`${formatCount(profileUser.followingCount)} Following`}>
                <span className="profile__stat-count">{formatCount(profileUser.followingCount)}</span>
                <span className="profile__stat-label">Following</span>
              </a>
              <a href="#" className="profile__stat" aria-label={`${formatCount(profileUser.followersCount)} Followers`}>
                <span className="profile__stat-count">{formatCount(profileUser.followersCount)}</span>
                <span className="profile__stat-label">Followers</span>
              </a>
            </div>

            <div className="profile__actions">
              {isOwnProfile ? (
                <button className="profile__edit-btn" aria-label="Edit profile">
                  Edit profile
                </button>
              ) : (
                <>
                  <button className="profile__follow-btn" aria-label={`Follow ${profileUser.displayName}`}>
                    Follow
                  </button>
                  <button className="profile__more-btn" aria-label="More options">
                    <MoreIcon className="profile__more-icon" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="profile__tabs" role="tablist" aria-label="Profile tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              className={`profile__tab ${activeTab === tab.id ? 'profile__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="profile__tab-count">{formatCount(tab.count)}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="profile__tab-content">
          <div
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {activeTab === 'media' ? (
              <div className="profile__media-grid" role="list" aria-label="Media">
                {mockProfileMedia.map((image, index) => (
                  <div key={index} className="profile__media-item" role="listitem">
                    <img
                      src={image}
                      alt={`Media ${index + 1}`}
                      className="profile__media-image"
                      loading="lazy"
                    />
                  </div>
                ))}
                {mockProfileMedia.length === 0 && (
                  <div className="profile__empty">
                    <PhotoIcon className="profile__empty-icon" aria-hidden="true" />
                    <p>No media yet</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'likes' ? (
              <div className="profile__likes-list" role="list" aria-label="Liked posts">
                {mockProfileLikes.map((tweet) => (
                  <ProfileLikeItem key={tweet.id} tweet={tweet} />
                ))}
                {mockProfileLikes.length === 0 && (
                  <div className="profile__empty">
                    <HeartIcon className="profile__empty-icon" aria-hidden="true" />
                    <p>No likes yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile__tweets-list" role="feed" aria-label={`${activeTab} posts`}>
                {content.length === 0 ? (
                  <div className="profile__empty">
                    <PostIcon className="profile__empty-icon" aria-hidden="true" />
                    <p>
                      {activeTab === 'posts'
                        ? 'No posts yet'
                        : activeTab === 'replies'
                        ? 'No replies yet'
                        : 'No posts yet'}
                    </p>
                    {activeTab === 'posts' && isOwnProfile && (
                      <p className="profile__empty-subtext">Post something to get started!</p>
                    )}
                  </div>
                ) : (
                  <>
                    {activeTab === 'posts' && isOwnProfile && <TweetComposer />}
                    {content.map((tweet) => (
                      <Tweet key={tweet.id} tweet={tweet} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Icons
const VerifiedBadge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 17c-1.75 0-2.73-1.57-2.99-3.73h-.03c-.13.45-.27.88-.27 1.35 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8v-5.42c.03-.09.03-.18.03-.28 0-.71-.3-1.35-.76-1.78-1.54-.14-2.37-1.46-2.51-2.97h-.03c-.46 1.78-1.9 3.18-3.76 3.37v.42zm7.06-8.3c-.12 1.56-.83 2.87-2.02 3.55-.87.5-1.9.77-3.02.77-1.11 0-2.14-.27-3.02-.77-1.19-.68-1.9-1.99-2.02-3.55-.02-.28-.03-.56-.03-.84 0-3.26 2.64-5.9 5.9-5.9s5.9 2.64 5.9 5.9c0 .28-.01.56-.03.84z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
  </svg>
);

const MoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const PhotoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const PostIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

interface ProfileLikeItemProps {
  tweet: {
    id: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatar: string;
      verified: boolean;
    };
    content: string;
    createdAt: string;
    likesCount: number;
    retweetsCount: number;
    repliesCount: number;
  };
}

const ProfileLikeItem = ({ tweet }: ProfileLikeItemProps) => (
  <article className="profile__like-item" aria-label={`Tweet by ${tweet.author.displayName}`}>
    <div className="profile__like-item-header">
      <img
        src={tweet.author.avatar}
        alt=""
        className="profile__like-item-avatar"
        aria-hidden="true"
      />
      <div className="profile__like-item-author">
        <div className="profile__like-item-name">
          <span className="profile__like-item-display-name">{tweet.author.displayName}</span>
          {tweet.author.verified && (
            <VerifiedBadge className="profile__like-item-verified" aria-label="Verified account" />
          )}
          <span className="profile__like-item-username">@{tweet.author.username}</span>
        </div>
        <time className="profile__like-item-time" dateTime={tweet.createdAt}>
          {formatDate(tweet.createdAt)}
        </time>
      </div>
    </div>
    <p className="profile__like-item-text">{tweet.content}</p>
    <div className="profile__like-item-actions">
      <button className="profile__like-action" aria-label={`Replies: ${formatCount(tweet.repliesCount)}`}>
        <ChatIcon className="profile__like-action-icon" aria-hidden="true" />
        <span>{formatCount(tweet.repliesCount)}</span>
      </button>
      <button className="profile__like-action" aria-label={`Retweets: ${formatCount(tweet.retweetsCount)}`}>
        <RetweetIcon className="profile__like-action-icon" aria-hidden="true" />
        <span>{formatCount(tweet.retweetsCount)}</span>
      </button>
      <button className="profile__like-action" aria-label={`Likes: ${formatCount(tweet.likesCount)}`}>
        <HeartIconSmall className="profile__like-action-icon" aria-hidden="true" />
        <span>{formatCount(tweet.likesCount)}</span>
      </button>
    </div>
  </article>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

const RetweetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M16 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-2 14H5V5h9v5l4 4v9h-7v-5z" />
  </svg>
);

const HeartIconSmall = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export default Profile;