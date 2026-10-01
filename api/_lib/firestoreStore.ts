/**
 * Firestore implementation of `BotStore`.
 *
 * Retention
 * ---------
 * Every generated document carries an `expireAt` timestamp set to
 * `createdAt + RETENTION_DAYS`. Firestore's own TTL policy deletes those
 * documents once the timestamp passes, which is the correct place for expiry:
 * it happens in the database, costs nothing, and keeps running when no request
 * touches the data.
 *
 * Queries *also* filter on `expireAt > now`. That is not redundant. TTL is not
 * instant — Firestore performs the delete within roughly a day of the timestamp
 * passing — so without the filter a document could still be returned after it
 * logically expired. The filter makes the retention guarantee hold at read
 * time regardless of when the physical delete lands.
 *
 * Query shape
 * -----------
 * `where('expireAt','>',now).orderBy('expireAt','desc')` orders by the same
 * field it filters on. Firestore serves that from the automatic single-field
 * index, so the app needs no deployed composite indexes and cannot fail at
 * runtime for a missing one. Because `expireAt` is always exactly
 * `createdAt + RETENTION_DAYS`, ordering by it is the same as ordering by
 * `createdAt`.
 */

import { getAdminFirestore } from './firebase-admin.ts';
import type { BotStore } from './store.ts';
import type { BotConversation, BotMessage, BotTweet } from '../../src/config/bots.ts';

/** How long generated content is kept. Firestore TTL removes it after this. */
export const RETENTION_DAYS = 30;

const TWEETS = 'botTweets';
const CONVERSATIONS = 'botConversations';
const STATE = 'botState';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const clampLimit = (value: number): number =>
  Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), MAX_LIMIT) : DEFAULT_LIMIT;

export class FirestoreBotStore implements BotStore {
  readonly kind = 'firestore' as const;

  /** Non-null: the factory only constructs this once a connection exists. */
  private readonly db: NonNullable<ReturnType<typeof getAdminFirestore>>;

  // An explicit field rather than a constructor parameter property, because
  // `erasableSyntaxOnly` forbids the latter.
  constructor(db: NonNullable<ReturnType<typeof getAdminFirestore>>) {
    this.db = db;
  }

  private expiryFrom(date: string): Date {
    const created = Date.parse(date);
    const base = Number.isFinite(created) ? created : Date.now();
    return new Date(base + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  }
async listTweets(limit: number): Promise<BotTweet[]> {
    const { Timestamp } = await import('firebase-admin/firestore');

    const snapshot = await this.db
      .collection(TWEETS)
      // Range on the same field we sort by — served by the default index.
      .where('expireAt', '>', Timestamp.now())
      .orderBy('expireAt', 'desc')
      .limit(clampLimit(limit))
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          botId: String(data.botId ?? ''),
          topic: String(data.topic ?? ''),
          sources: Array.isArray(data.sources) ? (data.sources as string[]) : [],
          text: String(data.content ?? ''),
          createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        } satisfies BotTweet;
      })
      .filter((tweet) => tweet.text.length > 0);
  }

  async saveTweet(tweet: BotTweet): Promise<void> {
    const { FieldValue, Timestamp } = await import('firebase-admin/firestore');

    await this.db.collection(TWEETS).doc(tweet.id).set(
      {
        botId: tweet.botId,
        topic: tweet.topic,
        sources: tweet.sources,
        content: tweet.text,
        createdAt: Timestamp.fromDate(new Date(tweet.createdAt)),
        // Drives Firestore TTL; see the note at the top of this file.
        expireAt: Timestamp.fromDate(this.expiryFrom(tweet.createdAt)),
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
async listConversations(limit: number): Promise<BotConversation[]> {
    const { Timestamp } = await import('firebase-admin/firestore');

    const snapshot = await this.db
      .collection(CONVERSATIONS)
      .where('expireAt', '>', Timestamp.now())
      .orderBy('expireAt', 'desc')
      .limit(clampLimit(limit))
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const raw = Array.isArray(data.messages) ? data.messages : [];

        return {
          id: doc.id,
          botIds: Array.isArray(data.botIds) ? (data.botIds as string[]) : [],
          messages: raw.map((entry) => ({
            id: String(entry?.id ?? ''),
            botId: String(entry?.botId ?? ''),
            text: String(entry?.text ?? ''),
            createdAt: entry?.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
          })) satisfies BotMessage[],
          updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        } satisfies BotConversation;
      })
      .filter((conversation) => conversation.messages.length > 0);
  }

  async saveConversation(conversation: BotConversation): Promise<void> {
    const { FieldValue, Timestamp } = await import('firebase-admin/firestore');

    await this.db.collection(CONVERSATIONS).doc(conversation.id).set(
      {
        botIds: conversation.botIds,
        messages: conversation.messages.map((message) => ({
          ...message,
          // Firestore rejects nested `undefined`; normalise on the way in.
          createdAt: Timestamp.fromDate(new Date(message.createdAt)),
        })),
        messageCount: conversation.messages.length,
        updatedAt: Timestamp.fromDate(new Date(conversation.updatedAt)),
        expireAt: Timestamp.fromDate(this.expiryFrom(conversation.updatedAt)),
        lastTouched: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  async lastTweetAt(botId: string): Promise<number> {
    const snapshot = await this.db.collection(STATE).doc(botId).get();
    const value = snapshot.get('lastTweetAt');
    const ms = value?.toMillis?.() ?? 0;
    return Number.isFinite(ms) ? ms : 0;
  }

  async markTweeted(botId: string, at: number): Promise<void> {
    const { FieldValue, Timestamp } = await import('firebase-admin/firestore');

    // No expireAt: cooldown state must outlive content retention, otherwise a
    // bot would look "due" again the moment its older state aged out.
    await this.db
      .collection(STATE)
      .doc(botId)
      .set(
        { lastTweetAt: Timestamp.fromMillis(at), updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
  }

  async purgeExpired(limit: number): Promise<number> {
    const { Timestamp } = await import('firebase-admin/firestore');

    // botState is deliberately absent: it carries cooldown, not content.
    const targets: Array<{ collection: string; id: string }> = [];

    for (const collection of [TWEETS, CONVERSATIONS]) {
      const snapshot = await this.db
        .collection(collection)
        .where('expireAt', '<=', Timestamp.now())
        // Deterministic page size; there is no useful ordering here and a limit
        // keeps one sweep from turning into a very large delete.
        .limit(Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT))
        .get();

      for (const doc of snapshot.docs) targets.push({ collection, id: doc.id });
    }

    if (targets.length === 0) return 0;

    // Chunked because Firestore caps a batch at 500 operations.
    for (let i = 0; i < targets.length; i += 400) {
      const batch = this.db.batch();
      for (const { collection, id } of targets.slice(i, i + 400)) {
        batch.delete(this.db.collection(collection).doc(id));
      }
      await batch.commit();
    }

    return targets.length;
  }
}