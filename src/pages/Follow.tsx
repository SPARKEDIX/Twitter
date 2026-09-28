import { useState, useMemo, type MouseEvent } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { mockFollowSuggestions, mockRecommendedUsers } from '../utils/mockData';
import { formatCount } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import type { FollowSuggestion, SuggestedUser } from '../types';
import './Follow.css';
import GatedImage from '../components/GatedImage'

type FollowTab = 'suggested' | 'following' | 'followers';

const Follow = () => {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<FollowTab>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  // Lifted from FollowUserItem's local useState. Per-item state was wiped
  // every time the user switched tabs or the list re-filtered.
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const tabs: { id: FollowTab; label: string }[] = [
    { id: 'suggested', label: 'Suggested' },
    { id: 'following', label: 'Following' },
    { id: 'followers', label: 'Followers' },
  ];

  const suggestedUsers = mockFollowSuggestions;
  const followingUsers = mockFollowSuggestions.slice(0, 5);
  const followersUsers = mockRecommendedUsers;

  const getUsersForTab = (): (FollowSuggestion | SuggestedUser)[] => {
    switch (activeTab) {
      case 'following':
        return followingUsers;
      case 'followers':
        return followersUsers;
      case 'suggested':
      default:
        return suggestedUsers;
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return getUsersForTab().filter(
      (user) =>
        user.displayName.toLowerCase().includes(q) || user.username.toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery]);

  const toggleFollow = (userId: string) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="follow">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`}>
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
                onClick={() => setActiveTab(tab.id)}
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
              <ul className="follow__users-list" aria-label={`${activeTab} users`}>
                {filteredUsers.map((user) => (
                  <li key={user.id} role="listitem">
                    <FollowUserItem
                      user={user}
                      isFollowing={followingIds.has(user.id)}
                      onToggleFollow={() => toggleFollow(user.id)}
                      showFollowButton={activeTab === 'suggested'}
                      showMutualFollowers={activeTab === 'suggested'}
                    />
                  </li>
                ))}
              </ul>
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

interface FollowUserItemProps {
  user: FollowSuggestion | SuggestedUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  showFollowButton?: boolean;
  showMutualFollowers?: boolean;
}

const FollowUserItem = ({
  user,
  isFollowing,
  onToggleFollow,
  showFollowButton = true,
  showMutualFollowers = false,
}: FollowUserItemProps) => {
  const suggestion = user as Partial<FollowSuggestion>;

  const handleFollow = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFollow();
  };

  return (
    <div className="follow__user-item">
      <GatedImage src={user.avatar} alt="" className="follow__user-avatar" />
      <div className="follow__user-info">
        <div className="follow__user-name-row">
          <span className="follow__user-display-name">{user.displayName}</span>
          {user.verified && <VerifiedBadge className="follow__verified" aria-label="Verified account" />}
          <span className="follow__user-username">@{user.username}</span>
        </div>
        <p className="follow__user-bio">{user.bio}</p>
        <div className="follow__user-meta">
          {/* showMutualFollowers used to gate `user.reason`, so the actual
              mutualFollowers data was declared but never rendered. */}
          {showMutualFollowers && suggestion.mutualFollowers && suggestion.mutualFollowers.length > 0 && (
            <span className="follow__user-reason">
              Followed by {suggestion.mutualFollowers.slice(0, 2).join(', ')}
            </span>
          )}
          <span className="follow__user-followers">
            {formatCount(user.followersCount)} followers
          </span>
          {suggestion.followingCount !== undefined && (
            <>
              <span className="follow__user-separator" aria-hidden="true">Â·</span>
              <span className="follow__user-following">
                {formatCount(suggestion.followingCount)} following
              </span>
            </>
          )}
        </div>
      </div>
      {showFollowButton && (
        <button
          type="button"
          className={`follow__follow-btn ${isFollowing ? 'follow__follow-btn--following' : ''}`}
          onClick={handleFollow}
          aria-label={isFollowing ? `Unfollow ${user.displayName}` : `Follow ${user.displayName}`}
          aria-pressed={isFollowing}
        >
          {isFollowing ? 'Following' : 'Follow'}
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
