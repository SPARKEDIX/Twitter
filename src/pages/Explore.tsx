import { useState, useEffect } from 'react';
import { useAppDispatch } from '../hooks/useRedux';
import { hidePreloader } from '../store/uiSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { mockTrendingTopics, mockCategories, mockRecommendedUsers } from '../utils/mockData';
import { formatCount } from '../utils/helpers';
import { useMobile } from '../hooks/useMobile';
import './Explore.css';

const Explore = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('for-you');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(hidePreloader());
    }, 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const tabs = [
    { id: 'for-you', label: 'For you' },
    { id: 'trending', label: 'Trending' },
    { id: 'news', label: 'News' },
    { id: 'sports', label: 'Sports' },
    { id: 'entertainment', label: 'Entertainment' },
  ];

  return (
    <div className="explore">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`} role="main">
        <div className="main__header">
          <div className="explore__search" role="search">
            <SearchIcon className="explore__search-icon" aria-hidden="true" />
            <input
              type="search"
              className="explore__search-input"
              placeholder="Search on X"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search on X"
              autoFocus
            />
          </div>
        </div>
        <div className="main__content explore__content">
          <nav className="explore__tabs" role="tablist" aria-label="Explore categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                className={`explore__tab ${activeTab === tab.id ? 'explore__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
            {activeTab === 'for-you' && (
              <div className="explore__section">
                <div className="explore__section-header">
                  <h2 className="explore__section-title">Trending now</h2>
                </div>
                <div className="explore__trending-list" role="list" aria-label="Trending topics">
                  {mockTrendingTopics.map((topic, index) => (
                    <TrendingItem key={topic.id} topic={topic} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'trending' && (
              <div className="explore__section">
                <div className="explore__section-header">
                  <h2 className="explore__section-title">Trending topics</h2>
                </div>
                <div className="explore__trending-list" role="list" aria-label="All trending topics">
                  {mockTrendingTopics.map((topic, index) => (
                    <TrendingItem key={topic.id} topic={topic} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {['news', 'sports', 'entertainment'].includes(activeTab) && (
              <div className="explore__section">
                <div className="explore__section-header">
                  <h2 className="explore__section-title">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h2>
                </div>
                <div className="explore__category-topics" role="list" aria-label={`${activeTab} topics`}>
                  {mockCategories[activeTab]?.map((topic) => (
                    <CategoryTopicItem key={topic.id} topic={topic} />
                  ))}
                </div>
              </div>
            )}

            <div className="explore__section">
              <div className="explore__section-header">
                <h2 className="explore__section-title">Who to follow</h2>
              </div>
              <div className="explore__users-list" role="list" aria-label="Recommended users">
                {mockRecommendedUsers.map((user) => (
                  <RecommendedUserItem key={user.id} user={user} />
                ))}
              </div>
            </div>
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

interface TrendingTopic {
  id: string;
  topic: string;
  description: string;
  tweetCount: number;
  category?: string;
}

interface TrendingItemProps {
  topic: TrendingTopic;
  rank: number;
}

const TrendingItem = ({ topic, rank }: TrendingItemProps) => (
  <div className="explore__trending-item" role="listitem">
    <span className="explore__trending-rank" aria-hidden="true">{rank}</span>
    <div className="explore__trending-content">
      <div className="explore__trending-topic">
        <span className="explore__trending-hashtag">{topic.topic}</span>
        {topic.category && <span className="explore__trending-category">{topic.category}</span>}
      </div>
      <p className="explore__trending-description">{topic.description}</p>
      <span className="explore__trending-count">{formatCount(topic.tweetCount)} posts</span>
    </div>
  </div>
);

interface CategoryTopic {
  id: string;
  name: string;
  description: string;
  tweetCount: number;
}

interface CategoryTopicItemProps {
  topic: CategoryTopic;
}

const CategoryTopicItem = ({ topic }: CategoryTopicItemProps) => (
  <button className="explore__category-item" role="listitem" aria-label={`${topic.name}: ${topic.description}`}>
    <div className="explore__category-item-info">
      <h3 className="explore__category-item-name">{topic.name}</h3>
      <p className="explore__category-item-description">{topic.description}</p>
    </div>
    <span className="explore__category-item-count">{formatCount(topic.tweetCount)} posts</span>
  </button>
);

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followersCount: number;
}

interface RecommendedUserItemProps {
  user: User;
}

const RecommendedUserItem = ({ user }: RecommendedUserItemProps) => (
  <div className="explore__user-item" role="listitem">
    <img src={user.avatar} alt="" className="explore__user-avatar" aria-hidden="true" />
    <div className="explore__user-info">
      <div className="explore__user-name-row">
        <span className="explore__user-display-name">{user.displayName}</span>
        {user.verified && <VerifiedBadge className="explore__verified" aria-label="Verified account" />}
        <span className="explore__user-username">@{user.username}</span>
      </div>
      <p className="explore__user-bio">{user.bio}</p>
      <span className="explore__user-followers">{formatCount(user.followersCount)} followers</span>
    </div>
    <button className="explore__follow-btn" aria-label={`Follow ${user.displayName}`}>
      Follow
    </button>
  </div>
);

const VerifiedBadge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 17c-1.75 0-2.73-1.57-2.99-3.73h-.03c-.13.45-.27.88-.27 1.35 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8v-5.42c.03-.09.03-.18.03-.28 0-.71-.3-1.35-.76-1.78-1.54-.14-2.37-1.46-2.51-2.97h-.03c-.46 1.78-1.9 3.18-3.76 3.37v.42zm7.06-8.3c-.12 1.56-.83 2.87-2.02 3.55-.87.5-1.9.77-3.02.77-1.11 0-2.14-.27-3.02-.77-1.19-.68-1.9-1.99-2.02-3.55-.02-.28-.03-.56-.03-.84 0-3.26 2.64-5.9 5.9-5.9s5.9 2.64 5.9 5.9c0 .28-.01.56-.03.84z" />
  </svg>
);

export default Explore;