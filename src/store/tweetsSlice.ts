import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tweet } from '../types';

interface TweetsState {
  tweets: Tweet[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  /** Prevents the initial feed from being appended a second time on re-entry. */
  initialised: boolean;
}

const initialState: TweetsState = {
  tweets: [],
  loading: false,
  error: null,
  hasMore: true,
  cursor: null,
  initialised: false,
};

const tweetsSlice = createSlice({
  name: 'tweets',
  initialState,
  reducers: {
    fetchTweetsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTweetsSuccess: (state, action: PayloadAction<{ tweets: Tweet[]; cursor: string | null; hasMore: boolean }>) => {
      state.loading = false;
      // First page replaces, later pages append. Without this the whole
      // timeline was duplicated every time the user navigated back to "/".
      if (state.initialised) {
        const existingIds = new Set(state.tweets.map((t) => t.id));
        state.tweets.push(...action.payload.tweets.filter((t) => !existingIds.has(t.id)));
      } else {
        state.tweets = action.payload.tweets;
        state.initialised = true;
      }
      state.cursor = action.payload.cursor;
      state.hasMore = action.payload.hasMore;
    },
    fetchTweetsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addTweet: (state, action: PayloadAction<Tweet>) => {
      state.tweets.unshift(action.payload);
    },
    likeTweet: (state, action: PayloadAction<{ tweetId: string; userId: string }>) => {
      const tweet = state.tweets.find((t) => t.id === action.payload.tweetId);
      if (!tweet) return;
      // Guard against a negative counter if state ever desyncs.
      if (tweet.isLiked && tweet.likesCount === 0) {
        tweet.isLiked = false;
        return;
      }
      tweet.isLiked = !tweet.isLiked;
      tweet.likesCount += tweet.isLiked ? 1 : -1;
    },
    retweet: (state, action: PayloadAction<{ tweetId: string; userId: string }>) => {
      const tweet = state.tweets.find((t) => t.id === action.payload.tweetId);
      if (!tweet) return;
      if (tweet.isRetweeted && tweet.retweetsCount === 0) {
        tweet.isRetweeted = false;
        return;
      }
      tweet.isRetweeted = !tweet.isRetweeted;
      tweet.retweetsCount += tweet.isRetweeted ? 1 : -1;
    },
    bookmarkTweet: (state, action: PayloadAction<string>) => {
      const tweet = state.tweets.find((t) => t.id === action.payload);
      if (tweet) {
        tweet.isBookmarked = !tweet.isBookmarked;
      }
    },
    deleteTweet: (state, action: PayloadAction<string>) => {
      state.tweets = state.tweets.filter((t) => t.id !== action.payload);
    },
    clearTweets: (state) => {
      state.tweets = [];
      state.cursor = null;
      state.hasMore = true;
      state.initialised = false;
    },
  },
});

export const {
  fetchTweetsStart,
  fetchTweetsSuccess,
  fetchTweetsFailure,
  addTweet,
  likeTweet,
  retweet,
  bookmarkTweet,
  deleteTweet,
  clearTweets,
} = tweetsSlice.actions;

export default tweetsSlice.reducer;