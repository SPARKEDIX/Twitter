import { useState, useEffect } from 'react';
import { useAppDispatch } from '../hooks/useRedux';
import { hidePreloader } from '../store/uiSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { mockFollowSuggestions, mockRecommendedUsers } from '../utils/mockData';
import { formatCount } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import './Follow.css';

const Follow = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<'suggested' | 'following' | 'followers'>('suggested');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(hidePreloader());
    }, 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const tabs = [
    { id: 'suggested', label: 'Suggested' },
    { id: 'following', label: 'Following' },
    { id: 'followers', label: 'Followers' },
  ];

  const suggestedUsers = mockFollowSuggestions;
  const followingUsers = mockFollowSuggestions.slice(0, 5);
  const followersUsers = mockRecommendedUsers;

  const getUsersForTab = () => {
    switch (activeTab) {
      case 'suggested':
        return suggestedUsers;
      case 'following':
        return followingUsers;
      case 'followers':
        return followersUsers;
      default:
        return suggestedUsers;
    }
  };

  const users = getUsersForTab();
  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="follow">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`} role="main">
        <div className="main__header">
          <div className="follow__header-content">
            <h1 className="follow__title">Follow</h1>
            <div className="follow__search" role="search">
              <SearchIcon className="follow__search-icon" aria-hidden="true" />
              <input
                type="search"
                className="follow__search-input"
                placeholder="Search people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search people"
              />
            </div>
          </div>
        </div>
        <div className="main__content follow__content">
          <nav className="follow__tabs" role="tablist" aria-label="Follow categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                className={`follow__tab ${activeTab === tab.id ? 'follow__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
                {tab.id === 'suggested' && suggestedUsers.length > 0 && (
                  <span className="follow__tab-count">{suggestedUsers.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
            {filteredUsers.length === 0 ? (
              <div className="follow__empty">
                <SearchOffIcon className="follow__empty-icon" aria-hidden="true" />
                <p className="follow__empty-text">
                  {searchQuery
                    ? `No users found for "${searchQuery}"`
                    : activeTab === 'suggested'
                    ? 'No suggestions at the moment'
                    : `No ${activeTab} yet`}
                </p>
              </div>
            ) : (
              <div className="follow__users-list" role="list" aria-label={`${activeTab} users`}>
                {filteredUsers.map((user) => (
                  <FollowUserItem
                    key={user.id}
                    user={user}
                    showFollowButton={activeTab === 'suggested'}
                    showMutualFollowers={activeTab === 'suggested'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const SearchOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    <path d="M2.81 2.81L1.39 4.22 8 10.83V20h2v-9.17l6.39 6.39 1.41-1.41L4.22 1.39 2.81 2.81z" />
  </svg>
);

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followersCount: number;
  followingCount?: number;
  mutualFollowers?: string[];
  reason?: string;
}

interface FollowUserItemProps {
  user: FollowUser;
  showFollowButton?: boolean;
  showMutualFollowers?: boolean;
}

const FollowUserItem = ({
  user,
  showFollowButton = true,
  showMutualFollowers = false,
}: FollowUserItemProps) => {
  const [following, setFollowing] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowing(!following);
  };

  return (
    <div className="follow__user-item" role="listitem">
      <img src={user.avatar} alt="" className="follow__user-avatar" aria-hidden="true" />
      <div className="follow__user-info">
        <div className="follow__user-name-row">
          <span className="follow__user-display-name">{user.displayName}</span>
          {user.verified && <VerifiedBadge className="follow__verified" aria-label="Verified account" />}
          <span className="follow__user-username">@{user.username}</span>
        </div>
        <p className="follow__user-bio">{user.bio}</p>
        <div className="follow__user-meta">
          {showMutualFollowers && user.reason && (
            <span className="follow__user-reason">{user.reason}</span>
          )}
          <span className="follow__user-followers">
            {formatCount(user.followersCount)} followers
          </span>
          {user.followingCount !== undefined && (
            <>
              <span className="follow__user-separator" aria-hidden="true">·</span>
              <span className="follow__user-following">
                {formatCount(user.followingCount)} following
              </span>
            </>
          )}
        </div>
      </div>
      {showFollowButton && (
        <button
          className={`follow__follow-btn ${following ? 'follow__follow-btn--following' : ''}`}
          onClick={handleFollow}
          aria-label={following ? `Unfollow ${user.displayName}` : `Follow ${user.displayName}`}
          aria-pressed={following}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
};

const VerifiedBadge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 17c-1.75 0-2.73-1.57-2.99-3.73h-.03c-.13.45-.27.88-.27 1.35 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8v-5.42c.03-.09.03-.18.03-.28 0-.71-.3-1.35-.76-1.78-1.54-.14-2.37-1.46-2.51-2.97h-.03c-.46 1.78-1.9 3.18-3.76 3.37v.42zm7.06-8.3c-.12 1.56-.83 2.87-2.02 3.55-.87.5-1.9.77-3.02.77-1.11 0-2.14-.27-3.02-.77-1.19-.68-1.9-1.99-2.02-3.55-.02-.28-.03-.56-.03-.84 0-3.26 2.64-5.9 5.9-5.9s5.9 2.64 5.9 5.9c0 .28-.01.56-.03.84z" />
  </svg>
);

export default Follow;