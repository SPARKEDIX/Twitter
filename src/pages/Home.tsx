import { useEffect, useState, useLayoutEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchTweetsStart, fetchTweetsSuccess } from '../store/tweetsSlice';
import { hidePreloader } from '../store/uiSlice';
import Tweet from '../components/Tweet';
import TweetComposer from '../components/TweetComposer';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Preloader from '../components/Preloader';
import { mockTweets } from '../utils/mockData';
import './Home.css';

const Home = () => {
  const dispatch = useAppDispatch();
  const tweets = useAppSelector((state) => state.tweets.tweets);
  const loading = useAppSelector((state) => state.tweets.loading);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(hidePreloader());
      dispatch(fetchTweetsStart());
      setTimeout(() => {
        dispatch(fetchTweetsSuccess({ tweets: mockTweets, cursor: null, hasMore: false }));
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <div className="home">
      <Preloader />
      <Sidebar />
      <Header />
      <main className={`main ${!isMobile && sidebarOpen ? 'main--sidebar-open' : ''}`} role="main">
        <div className="main__header">
          <h1 className="main__title">Home</h1>
        </div>
        <div className="main__content">
          <TweetComposer />
          <div className="tweets-list" role="feed" aria-label="Tweets">
            {tweets.length === 0 && !loading ? (
              <div className="tweets-list__empty">
                <p>No tweets yet. Follow people to see their tweets here.</p>
              </div>
            ) : (
              tweets.map((tweet: import('../types').Tweet) => <Tweet key={tweet.id} tweet={tweet} />)
            )}
            {loading && <div className="tweets-list__loading" role="status" aria-label="Loading more tweets">Loading...</div>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;