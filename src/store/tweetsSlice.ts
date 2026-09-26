import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tweet } from '../types';

interface TweetsState {
  tweets: Tweet[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
}

const initialState: TweetsState = {
  tweets: [],
  loading: false,
  error: null,
  hasMore: true,
  cursor: null,
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
      state.tweets = [...state.tweets, ...action.payload.tweets];
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
      if (tweet) {
        tweet.isLiked = !tweet.isLiked;
        tweet.likesCount += tweet.isLiked ? 1 : -1;
      }
    },
    retweet: (state, action: PayloadAction<{ tweetId: string; userId: string }>) => {
      const tweet = state.tweets.find((t) => t.id === action.payload.tweetId);
      if (tweet) {
        tweet.isRetweeted = !tweet.isRetweeted;
        tweet.retweetsCount += tweet.isRetweeted ? 1 : -1;
      }
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