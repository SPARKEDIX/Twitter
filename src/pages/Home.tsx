import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchTweetsStart, fetchTweetsSuccess } from '../store/tweetsSlice';
import Tweet from '../components/Tweet';
import TweetComposer from '../components/TweetComposer';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { mockTweets } from '../utils/mockData';
import { useMobile } from '../hooks/useMobile';
import './Home.css';

const Home = () => {
  const dispatch = useAppDispatch();
  const tweets = useAppSelector((state) => state.tweets.tweets);
  const loading = useAppSelector((state) => state.tweets.loading);
  const isMobile = useMobile();

  useEffect(() => {
    // Both timers must be tracked. Previously only the outer one was
    // cleared, so unmounting during the 500ms window still dispatched
    // fetchTweetsSuccess against an unmounted tree.
    let innerTimer: ReturnType<typeof setTimeout> | undefined;

    const outerTimer = setTimeout(() => {
      dispatch(fetchTweetsStart());
      innerTimer = setTimeout(() => {
        dispatch(fetchTweetsSuccess({ tweets: mockTweets, cursor: null, hasMore: false }));
      }, 500);
    }, 2000);

    return () => {
      clearTimeout(outerTimer);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, [dispatch]);

  return (
    <div className="home">
      <Sidebar />
      <Header />
      <main className={`main ${isMobile ? 'main--mobile' : ''}`}>
        <div className="main__header">
          <h1 className="main__title">Home</h1>
        </div>
        <div className="main__content">
          <TweetComposer />
          <div className="tweets-list" role="feed" aria-busy={loading} aria-label="Tweets">
            {tweets.length === 0 && !loading ? (
              <div className="tweets-list__empty">
                <p>No tweets yet. Follow people to see their tweets here.</p>
              </div>
            ) : (
              tweets.map((tweet) => <Tweet key={tweet.id} tweet={tweet} />)
            )}
            {loading && (
              <div className="tweets-list__loading" role="status" aria-label="Loading more tweets">
                Loading...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;