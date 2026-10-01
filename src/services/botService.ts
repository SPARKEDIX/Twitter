/**
 * Client for the bot engine.
 *
 * The engine itself lives in `api/` and runs server-side, so this module only
 * reads what the bots produced. That split is deliberate:
 *
 *   - The provider key never enters the browser bundle.
 *   - Content keeps generating when no user has the app open.
 *   - `BOTS` (the roster) is still imported from shared config because the UI
 *     needs to render avatars and names for any tweet or thread it receives.
 *
 * Every call degrades quietly: bots are background colour, and a failed request
 * must never break the timeline or the messages page.
 */

import { BOTS, getBot } from '../config/bots';
import type { Conversation, Message, User } from '../types';

/** A bot tweet as returned by `/api/bots/feed`. */
export interface BotTweetDto {
  id: string;
  content: string;
  createdAt: string;
  topic: string;
  sources: string[];
  bot: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    verified: boolean;
    avatar: string;
  } | null;
}

/** A bot thread as returned by `/api/bots/conversations`. */
export interface BotConversationDto {
  id: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  }>;
  messages: Array<{ id: string; botId: string; text: string; createdAt: string }>;
}

/** Read timeout for the read-only endpoints. */
const READ_TIMEOUT_MS = 10_000;

/** GETs JSON with a timeout. @returns `null` on any failure. */
async function getJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetches the latest bot tweets, newest first. */
export async function fetchBotFeed(limit = 30): Promise<BotTweetDto[]> {
  const payload = await getJson<{ tweets?: BotTweetDto[] }>(`/api/bots/feed?limit=${limit}`);
  return payload?.tweets ?? [];
}

/** Fetches the latest bot-to-bot threads. */
export async function fetchBotConversations(limit = 20): Promise<BotConversationDto[]> {
  const payload = await getJson<{ conversations?: BotConversationDto[] }>(
    `/api/bots/conversations?limit=${limit}`
  );
  return payload?.conversations ?? [];
}

/** Builds the UI `User` for a bot. */
function toUser(bot: NonNullable<BotTweetDto['bot']> | BotConversationDto['participants'][number]): User {
  return {
    id: bot.id,
    username: bot.username,
    displayName: bot.displayName,
    avatar: bot.avatar,
    verified: bot.verified,
    bio: getBot(bot.id)?.bio,
    followersCount: 0,
    followingCount: 0,
  };
}

/**
 * Converts a bot tweet into the app's `Tweet` shape so it can drop straight
 * into the timeline without the `Tweet` component needing to know about bots.
 *
 * @returns `null` if the DTO has no author, which means the roster changed out
 * from under it and the tweet should be skipped rather than rendered broken.
 */
export function toTweet(dto: BotTweetDto) {
  if (!dto.bot) return null;

  return {
    id: dto.id,
    author: toUser(dto.bot),
    content: dto.content,
    createdAt: dto.createdAt,
    likesCount: 0,
    retweetsCount: 0,
    repliesCount: 0,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false,
  };
}

/**
 * Converts bot threads into the app's `Conversation` + `Message` shapes so the
 * existing Chat page can render them with no bot-specific code.
 *
 * A thread becomes a conversation titled after its participants, and each bot
 * message becomes a `Message` whose `senderId` is the bot's id — which is
 * already how `Chat.tsx` decides left-vs-right alignment.
 */
export function toConversations(dtos: BotConversationDto[]): Conversation[] {
  return dtos.map((dto) => {
    const last = dto.messages[dto.messages.length - 1];

    return {
      id: dto.id,
      participants: dto.participants.map(toUser),
      lastMessage: {
        content: last?.text ?? '',
        senderId: last?.botId ?? '',
        createdAt: last?.createdAt ?? dto.updatedAt,
      },
      unreadCount: 0,
    };
  });
}

/** Flattens every thread's messages, keyed by conversation id. */
export function toMessages(dtos: BotConversationDto[]): Record<string, Message[]> {
  const result: Record<string, Message[]> = {};

  for (const dto of dtos) {
    result[dto.id] = dto.messages.map((message) => ({
      id: message.id,
      conversationId: dto.id,
      senderId: message.botId,
      content: message.text,
      createdAt: message.createdAt,
      read: true,
    }));
  }

  return result;
}

/** The roster, for rendering bot suggestion cards and profile views. */
export { BOTS };