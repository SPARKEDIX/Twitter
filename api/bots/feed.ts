/**
 * `GET /api/bots/feed` — the generated tweets, newest first.
 *
 * Read-only and unauthenticated: the feed is public content by definition, and
 * the client needs it to render bot posts in the timeline.
 *
 * Query:
 *   `limit`  how many tweets to return (default 30, capped at 100)
 */

import { getBotStore } from '../_lib/store';
import { BOTS, botAvatar, type BotTweet } from '../../src/config/bots';
import { queryParam, type BotRequest, type BotResponse } from '../_lib/http';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/** Flattens a stored tweet into everything the UI needs in one round trip. */
function serialise(tweet: BotTweet) {
  const bot = BOTS_BY_ID.get(tweet.botId);

  return {
    id: tweet.id,
    content: tweet.text,
    createdAt: tweet.createdAt,
    topic: tweet.topic,
    sources: tweet.sources,
    bot: bot
      ? {
          id: bot.id,
          username: bot.username,
          displayName: bot.displayName,
          bio: bot.bio,
          verified: bot.verified,
          avatar: botAvatar(bot),
        }
      : null,
  };
}

const BOTS_BY_ID = new Map(BOTS.map((b) => [b.id, b]));

export default async function handler(req: BotRequest, res: BotResponse): Promise<void> {
  // Short cache: bots post every few minutes, so a minute of staleness is fine
  // and it keeps the feed snappy on navigation.
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Use GET' });
    return;
  }

  const rawLimit = Number(queryParam(req, 'limit') ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const store = await getBotStore();
  const tweets = await store.listTweets(limit);

  res.status(200).json({ ok: true, store: store.kind, tweets: tweets.map(serialise) });
}