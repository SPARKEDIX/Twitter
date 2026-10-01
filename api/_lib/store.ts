/**
 * Storage boundary for generated bot content.
 *
 * The engine never touches storage directly — it only knows this interface. That
 * is deliberate: the app currently runs on the in-memory implementation, and
 * swapping in Firestore (or anything else) later is a change to this file plus
 * the factory at the bottom, with no edits to `engine.ts` or the endpoints.
 *
 * Everything is async even though the in-memory version is synchronous, so a
 * network-backed store drops in without changing a single call site.
 */

import type { BotConversation, BotTweet } from '../../src/config/bots.js';

export interface BotStore {
  readonly kind: 'memory' | 'firestore';
  listTweets(limit: number): Promise<BotTweet[]>;
  saveTweet(tweet: BotTweet): Promise<void>;
  listConversations(limit: number): Promise<BotConversation[]>;
  saveConversation(conversation: BotConversation): Promise<void>;
  /** @returns Epoch ms of the bot's last tweet, or `0` if it has never posted. */
  lastTweetAt(botId: string): Promise<number>;
  markTweeted(botId: string, at: number): Promise<void>;
  /**
   * Deletes content whose retention window has closed.
   *
   * Reads already filter expired documents out, so this is not needed for
   * correctness — it is what actually reclaims the storage. Firestore's own TTL
   * policy would do the same job, but it cannot be turned on from code (it is
   * console-only), so the engine sweeps for itself on every tick.
   *
   * @returns How many documents were removed.
   */
  purgeExpired(limit: number): Promise<number>;
}

/* ------------------------------------------------------------------ *
 * In-memory store — the default.
 *
 * Appropriate for local development and short-lived previews. On serverless it
 * resets whenever the instance recycles, which is why the engine treats it as
 * a cache rather than a ledger.
 * ------------------------------------------------------------------ */

class MemoryBotStore implements BotStore {
  readonly kind = 'memory' as const;

  private tweets: BotTweet[] = [];
  private conversations: BotConversation[] = [];
  private readonly lastTweetAtByBot = new Map<string, number>();

  async listTweets(limit: number): Promise<BotTweet[]> {
    return this.tweets.slice(0, limit);
  }

  async saveTweet(tweet: BotTweet): Promise<void> {
    this.tweets.unshift(tweet);
    // Bound the buffer so a long-lived dev server does not grow without limit.
    if (this.tweets.length > 500) this.tweets.length = 500;
  }

  async listConversations(limit: number): Promise<BotConversation[]> {
    return this.conversations.slice(0, limit);
  }

  async saveConversation(conversation: BotConversation): Promise<void> {
    const index = this.conversations.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      this.conversations[index] = conversation;
    } else {
      this.conversations.unshift(conversation);
    }
    if (this.conversations.length > 100) this.conversations.length = 100;
  }

  async lastTweetAt(botId: string): Promise<number> {
    return this.lastTweetAtByBot.get(botId) ?? 0;
  }

  async markTweeted(botId: string, at: number): Promise<void> {
    this.lastTweetAtByBot.set(botId, at);
  }

  async purgeExpired(_limit: number): Promise<number> {
    // Nothing to reclaim: the in-memory buffers are capped at 500 tweets and
    // 100 conversations, so they cannot grow unbounded in the first place.
    return 0;
  }
}

/* ------------------------------------------------------------------ *
 * Singleton and backend selection
 *
 * Firestore is preferred whenever credentials are present; the in-memory
 * implementation is the fallback so a missing service account degrades the app
 * to a cache instead of breaking the timeline. `getBackend()` is async because
 * resolving credentials touches the filesystem.
 * ------------------------------------------------------------------ */

let store: BotStore | null = null;
let pending: Promise<BotStore> | null = null;

export async function getBotStore(): Promise<BotStore> {
  if (store) return store;
  pending ??= (async () => {
    try {
      const { getAdminFirestore } = await import('./firebase-admin.ts');
      const db = getAdminFirestore();

      if (db) {
        const { FirestoreBotStore } = await import('./firestoreStore.ts');
        store = new FirestoreBotStore(db);
        return store;
      }
    } catch (error) {
      // Import or construction failure must not take the endpoints down.
      console.warn('[store] Firestore unavailable, using memory.', error);
    }

    store = new MemoryBotStore();
    return store;
  })();

  return pending;
}

/** Swaps the active store. Used by tests and by the reset helper below. */
export function setBotStore(next: BotStore): void {
  store = next;
  pending = Promise.resolve(next);
}

/** Test seam — drops all generated content and re-resolves the backend. */
export function resetBotStore(): void {
  store = null;
  pending = null;
}