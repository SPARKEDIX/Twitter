import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchBotConversations,
  fetchBotFeed,
  toConversations,
  toMessages,
  toTweet,
  type BotConversationDto,
  type BotTweetDto,
} from '../services/botService';
import type { Conversation, Message, Tweet } from '../types';

/**
 * Bot-generated content, kept separate from the human feed.
 *
 * A separate slice rather than a merge into `tweets` because the two have
 * different lifecycles: human posts come from the composer and are optimistic,
 * while bot content is polled from the server and can disappear if the engine
 * is disabled. Merging them would make the timeline ambiguous about what to
 * clear on sign-out.
 */

interface BotsState {
  feed: Tweet[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  /** Raw DTOs, kept so a re-render can show the search topic a tweet came from. */
  topics: Record<string, { topic: string; sources: string[] }>;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const initialState: BotsState = {
  feed: [],
  conversations: [],
  messages: {},
  topics: {},
  loading: false,
  error: null,
  lastFetchedAt: null,
};

/** Both endpoints are read together so the page has one coherent snapshot. */
export const fetchBotContent = createAsyncThunk<
  { feed: Tweet[]; conversations: Conversation[]; messages: Record<string, Message[]>; topics: BotsState['topics'] },
  void,
  { rejectValue: string }
>('bots/fetchAll', async (_arg, { rejectWithValue }) => {
  const [tweets, threads]: [BotTweetDto[], BotConversationDto[]] = await Promise.all([
    fetchBotFeed(40),
    fetchBotConversations(24),
  ]);

  // Both fetches swallow errors and return [], so an empty result is the
  // failure signal. Treating it as an error every time the engine is simply
  // quiet would spam toasts on a healthy install.
  if (tweets.length === 0 && threads.length === 0) {
    return rejectWithValue('No bot content available yet.');
  }

  const topics: BotsState['topics'] = {};
  for (const tweet of tweets) {
    topics[tweet.id] = { topic: tweet.topic, sources: tweet.sources };
  }

  return {
    feed: tweets.map(toTweet).filter((tweet): tweet is Tweet => tweet !== null),
    conversations: toConversations(threads),
    messages: toMessages(threads),
    topics,
  };
});

const botsSlice = createSlice({
  name: 'bots',
  initialState,
  reducers: {
    clearBots: () => initialState,
    /** Appends a single bot tweet without a refetch, used by the tick watcher. */
    botTweetReceived: (state, action: PayloadAction<Tweet>) => {
      state.feed.unshift(action.payload);
      if (state.feed.length > 60) state.feed.length = 60;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBotContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBotContent.fulfilled, (state, action) => {
        state.loading = false;
        state.feed = action.payload.feed;
        state.conversations = action.payload.conversations;
        state.messages = action.payload.messages;
        state.topics = action.payload.topics;
        state.lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchBotContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Could not load bot content.';
      });
  },
});

export const { clearBots, botTweetReceived } = botsSlice.actions;

export default botsSlice.reducer;