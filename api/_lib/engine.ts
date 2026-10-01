/**
 * The bot brain.
 *
 * Two jobs, both grounded in a fresh DuckDuckGo search:
 *   1. `generateTweet` — one grounded tweet per bot.
 *   2. `generateConversation` — a thread where two or three bots talk to each
 *      other, each message conditioned on the ones before it.
 *
 * Everything degrades rather than throws: a failed search still produces a
 * tweet from the bot's own knowledge, and a failed completion is surfaced to
 * the caller as `null` so one bad bot cannot abort a whole tick.
 */

import { formatContext, search, type SearchResult } from './ddg';
import { complete, LlmError } from './llm';
import { getBotStore } from './store';
import {
  BOTS,
  type BotConversation,
  type BotMessage,
  type BotProfile,
  type BotTweet,
} from '../../src/config/bots';

export const TWEET_MAX_LENGTH = 260;

/** Minimum gap between posts from the same bot. */
export const TWEET_COOLDOWN_MS = 45 * 60 * 1000;

/** Pick one element at random. */
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Strips the wrappers models like to add — quotes, "Tweet:", leading labels,
 * trailing hashtags — and enforces the length cap.
 *
 * Models routinely ignore "return only the tweet" and emit `Here is a tweet: …`
 * or a block-quoted body. Cleaning here means every downstream consumer (feed,
 * rules, UI) can assume plain text.
 */
export function sanitiseTweet(raw: string): string {
  let text = raw.trim();

  // Unwrap ``` blocks, both fenced and blockquoted.
  text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
  text = text.replace(/^>\s?/, '');
  text = text.replace(/^\s*["“”']+/, '').replace(/["“”']+\s*$/, '');

  // Drop a leading label like "Tweet:" / "Post:" / "Here is a tweet:".
  text = text.replace(/^\s*(here(\s+is|'s)\s+(a|the)\s+)?(tweet|post|thread|message)\s*[:\-–]\s*/i, '');

  // Collapse whitespace so no stray newlines reach the UI.
  text = text.replace(/\s+/g, ' ').trim();

  // Hashtags read as spam when every bot uses them.
  text = text.replace(/(^|\s)#\w+/g, '').replace(/\s{2,}/g, ' ').trim();

  if (text.length > TWEET_MAX_LENGTH) {
    text = `${text.slice(0, TWEET_MAX_LENGTH - 1).trimEnd()}…`;
  }

  return text;
}

/** Similar cleanup for chat messages, which have no hard cap but no junk either. */
function sanitiseMessage(raw: string): string {
  return raw
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/^\s*["“”']+/, '')
    .replace(/["“”']+\s*$/, '')
    .replace(/^\s*\w+:\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

/** Monotonic-ish unique id. Good enough for content ids, not for primary keys. */
function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Prompt for a single grounded tweet. */
function tweetPrompt(bot: BotProfile, topic: string, context: string): string {
  const grounding = context
    ? `Here is what a web search just turned up about "${topic}":\n${context}\n\nUse these facts. Mention at least one specific detail (a number, a name, a date). Do not invent facts that are not here.`
    : `A web search for "${topic}" returned nothing usable. Write from general knowledge and do not claim it is breaking news or cite anything specific you cannot support.`;

  return [
    `You are @${bot.username} (${bot.displayName}) on Twitter.`,
    `Your beat: ${bot.niche}.`,
    `Voice: ${bot.voice}.`,
    '',
    grounding,
    '',
    'Rules:',
    '- Reply with ONLY the tweet text. No preamble, no "Tweet:", no quotes, no hashtags.',
    '- Maximum 260 characters.',
    '- No @mentions of other people.',
    '- Sound like a person with an opinion, not a news aggregator.',
  ].join('\n');
}

/**
 * Generates one grounded tweet for a bot.
 *
 * @returns The stored tweet, or `null` if the provider failed. Never throws.
 */
export async function generateTweet(bot: BotProfile): Promise<BotTweet | null> {
  const topic = pick(bot.tweetTopics);

  let context = '';
  let sources: string[] = [];
  try {
    const results: SearchResult[] = await search(topic);
    context = formatContext(results);
    sources = results.map((r) => r.title).slice(0, 3);
  } catch {
    // Search is best-effort. The prompt already handles an empty context.
    context = '';
  }

  try {
    const raw = await complete([{ role: 'user', content: tweetPrompt(bot, topic, context) }], {
      maxTokens: 200,
      temperature: 0.95,
    });

    const text = sanitiseTweet(raw);
    if (text.length < 12) return null;

    const tweet: BotTweet = {
      id: makeId('tw'),
      botId: bot.id,
      topic,
      sources,
      text,
      createdAt: new Date().toISOString(),
    };

    await (await getBotStore()).saveTweet(tweet);
    return tweet;
  } catch (error) {
    if (error instanceof LlmError) {
      console.error(`[bots] tweet failed for ${bot.id}: ${error.message}`);
    } else {
      console.error(`[bots] unexpected tweet error for ${bot.id}:`, error);
    }
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Bot-to-bot conversations
 * ------------------------------------------------------------------ */

/** How many messages a fresh thread gets. Enough to read as a real exchange. */
const THREAD_LENGTH = 4;

/** Stable id so a resumed thread keeps the same conversation document. */
function conversationId(botIds: string[]): string {
  return `conv_${[...botIds].sort().join('_')}`;
}

/**
 * Picks the cast for a thread: two bots, or three roughly 1 in 4 times so the
 * feed is not all two-hander duets.
 */
function pickCast(): BotProfile[] {
  const count = Math.random() < 0.25 ? 3 : 2;
  const pool = [...BOTS];
  const cast: BotProfile[] = [];

  while (cast.length < count && pool.length > 0) {
    // Bias toward nearby niches so the thread is about something: two space bots
    // argue better than a space bot and a food bot. The anchor only exists once
    // the first bot has been picked, so the first draw is always unconstrained.
    const anchor = cast[0];
    const preferred =
      anchor !== undefined && Math.random() < 0.55
        ? pool.findIndex((b) => nearby(b.niche, anchor.niche))
        : -1;
    const index = preferred >= 0 ? preferred : Math.floor(Math.random() * pool.length);

    const [chosen] = pool.splice(index, 1);
    if (chosen) cast.push(chosen);
  }

  return cast;
}

/** Crude topic affinity — enough to make duos feel intentional. */
function nearby(a: string, b: string): boolean {
  const words = (text: string) => new Set(text.toLowerCase().split(/[^a-z]+/).filter(Boolean));
  const left = words(a);
  let shared = 0;
  for (const word of words(b)) {
    if (left.has(word)) shared += 1;
  }
  return shared >= 2;
}

/** Renders the thread so far as a transcript for the next speaker. */
function transcript(messages: BotMessage[]): string {
  return messages
    .map((m) => `${getName(m.botId)}: ${m.text}`)
    .join('\n');
}

function getName(botId: string): string {
  return BOTS.find((b) => b.id === botId)?.displayName ?? 'Someone';
}

/** System prompt for whoever is speaking next. */
function chatPrompt(bot: BotProfile, cast: BotProfile[], topic: string, context: string): string {
  const others = cast
    .filter((c) => c.id !== bot.id)
    .map((c) => `@${c.username} (${c.displayName})`)
    .join(', ');

  const grounding = context
    ? `Facts from a live web search on "${topic}":\n${context}\n\nReference these naturally where it fits.`
    : `No live search results for "${topic}". Keep it to opinion and banter.`;

  return [
    `You are @${bot.username} (${bot.displayName}), posting in a Twitter DM.`,
    `Your beat: ${bot.niche}.`,
    `How you talk: ${bot.chatStyle}.`,
    `Voice: ${bot.voice}.`,
    `You are chatting with ${others}.`,
    '',
    `Conversation topic: ${topic}`,
    grounding,
    '',
    'Rules:',
    '- Reply with ONLY your message. No name prefix, no quotes, no "Message:".',
    '- 1-3 sentences. This is a DM, not a tweet.',
    '- React to what the others actually said. Do not monologue.',
    '- No hashtags, no @mentions, no emoji spam.',
  ].join('\n');
}

/**
 * Generates a fresh bot-to-bot thread and stores it.
 *
 * Every message is conditioned on the full transcript so far, which is what
 * makes the exchange read as a conversation instead of four unrelated lines
 * about the same topic.
 *
 * @returns The stored conversation, or `null` if the first completion failed.
 */
export async function generateConversation(): Promise<BotConversation | null> {
  const cast = pickCast();
  if (cast.length < 2) return null;

  const lead = cast[0];
  const topic = pick(lead.chatSeeds);

  let context = '';
  try {
    context = formatContext(await search(topic, 3));
  } catch {
    context = '';
  }

  const messages: BotMessage[] = [];

  for (let turn = 0; turn < THREAD_LENGTH; turn += 1) {
    const speaker = cast[turn % cast.length];

    try {
      const raw = await complete(
        [
          {
            role: 'user',
            content:
              (turn === 0 ? 'Start the conversation.' : 'Reply to the conversation.') +
              `\n\nTopic: ${topic}\n\nSo far:\n${transcript(messages) || '(nothing yet)'}\n\n` +
              chatPrompt(speaker, cast, topic, context),
          },
        ],
        { maxTokens: 180, temperature: 0.95 }
      );

      const text = sanitiseMessage(raw);
      if (text.length < 4) continue;

      // Back-to-back repeats mean the model looped; stop rather than store junk.
      if (messages.length > 0 && messages[messages.length - 1].text === text) continue;

      messages.push({
        id: makeId('msg'),
        botId: speaker.id,
        text,
        createdAt: new Date(Date.now() + turn * 45_000).toISOString(),
      });
    } catch (error) {
      if (error instanceof LlmError) {
        console.error(`[bots] chat turn failed for ${speaker.id}: ${error.message}`);
      }
      // A partial thread is still a valid conversation, so only bail if nothing
      // at all was produced.
      if (messages.length === 0) return null;
      break;
    }
  }

  if (messages.length < 2) return null;

  const conversation: BotConversation = {
    id: conversationId(cast.map((b) => b.id)),
    botIds: cast.map((b) => b.id),
    messages,
    updatedAt: new Date().toISOString(),
  };

  await (await getBotStore()).saveConversation(conversation);
  return conversation;
}

/* ------------------------------------------------------------------ *
 * The tick
 * ------------------------------------------------------------------ */

/**
 * Tweets generated per tick.
 *
 * One, not three. Every provider call is serialised behind an 8s rate-limit
 * gate (see `waitForProviderSlot` in llm.ts), so three tweets would triple the
 * wall-clock cost of a tick and risk the function timeout without finishing any
 * more work per request. Throughput comes from running the tick more often
 * instead.
 */
const MAX_TWEETS_PER_TICK = 1;

/** Cooldown before the same bot pair starts another thread. */
const CONVERSATION_COOLDOWN_MS = 20 * 60 * 1000;

/** How many expired documents one tick may delete. */
const PURGE_BATCH = 200;

export interface TickResult {
  tweets: BotTweet[];
  conversation: BotConversation | null;
  /** Bot ids skipped because they posted too recently. */
  skipped: string[];
  /** Expired documents reclaimed at the start of this tick. */
  purged: number;
  reason?: string;
}

/**
 * Runs one round of bot activity: a handful of tweets plus one conversation.
 *
 * Bot tweets run concurrently rather than in sequence — each is an independent
 * search + completion, and serialising twelve of them would blow past the
 * serverless timeout.
 */
export async function runTick(options: { force?: boolean } = {}): Promise<TickResult> {
  const store = await getBotStore();
  const now = Date.now();

  // Reclaim retention-expired content before generating anything. Runs first so
  // a purge failure cannot be confused with a generation failure, and is capped
  // so one tick never spends its whole budget on deletes. Non-fatal: a failed
  // purge must not stop the tick from posting.
  let purged = 0;
  try {
    purged = await store.purgeExpired(PURGE_BATCH);
    if (purged > 0) console.log(`[bots] purged ${purged} expired document(s)`);
  } catch (error) {
    console.warn('[bots] purge failed; continuing.', error);
  }

  // Cooldown is per-bot and persisted, so bots do not all post on boot.
  // `readonly BotProfile[]` is not writable, so the accumulator is its own type.
  const due: BotProfile[] = [];
  const skipped: string[] = [];

  for (const bot of BOTS) {
    const last = await store.lastTweetAt(bot.id);
    if (options.force || now - last >= TWEET_COOLDOWN_MS) {
      due.push(bot);
    } else {
      skipped.push(bot.id);
    }
  }

  const chosen = due
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_TWEETS_PER_TICK);

  // Cap concurrency so three providers do not all retry at once on a 429.
  const settled = await Promise.allSettled(chosen.map((bot) => generateTweet(bot)));
  const tweets = settled
    .filter((r): r is PromiseFulfilledResult<BotTweet | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((tweet): tweet is BotTweet => tweet !== null);

  await Promise.all(tweets.map((tweet) => store.markTweeted(tweet.botId, now)));

  // One conversation per tick, unless the last one is still fresh.
  const existing = await store.listConversations(1);
  const lastConversation = existing[0];
  const conversationReady =
    options.force || !lastConversation || now - Date.parse(lastConversation.updatedAt) >= CONVERSATION_COOLDOWN_MS;

  const conversation = conversationReady ? await generateConversation() : null;

  return { tweets, conversation, skipped, purged };
}
