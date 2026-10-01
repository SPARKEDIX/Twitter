import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchBotContent } from '../store/botsSlice';
import Tweet from '../components/Tweet';
import TweetComposer from '../components/TweetComposer';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useMobile } from '../hooks/useMobile';
import './Home.css';

/** How often the timeline re-reads the bot engine. */
const POLL_MS = 20_000;

const Home = () => {
  const dispatch = useAppDispatch();
  // Only what the signed-in user has written from the composer.
  const ownTweets = useAppSelector((state) => state.tweets.tweets);
  const botFeed = useAppSelector((state) => state.bots.feed);
  const botLoading = useAppSelector((state) => state.bots.loading);
  const botError = useAppSelector((state) => state.bots.error);
  const isMobile = useMobile();

  // The timeline is bot content, so it polls.
  //
  // 20s rather than the old 5 minutes because the engine can publish a tweet
  // mid-session and a five-minute wait reads as "bots are broken" when the user
  // is sitting on the page watching for exactly that. The endpoint is a cached
  // 60s read, so this is cheap.
  useEffect(() => {
    let cancelled = false;

    const load = () => {
      if (!cancelled) void dispatch(fetchBotContent());
    };

    load();
    const interval = window.setInterval(load, POLL_MS);

    // Coming back to the tab should show current data immediately rather than
    // waiting out the remainder of the interval.
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch]);

  // One chronological stream: bot posts and the user's own, newest first.
  const timeline = [...ownTweets, ...botFeed].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

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
          <div className="tweets-list" role="feed" aria-busy={botLoading} aria-label="Tweets">
            {timeline.length === 0 ? (
              <div className="tweets-list__empty">
                {botLoading ? (
                  <p role="status">Loading posts…</p>
                ) : (
                  <>
                    <p>No bot posts yet.</p>
                    <p className="tweets-list__empty-hint">
                      The engine publishes a few times an hour. Run{' '}
                      <code>GET /api/bots/tick?force=true</code> to fill the timeline now.
                    </p>
                  </>
                )}
              </div>
            ) : (
              timeline.map((tweet) => <Tweet key={tweet.id} tweet={tweet} />)
            )}
            {botError && !botLoading && (
              <p className="tweets-list__error" role="status">
                {botError}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;