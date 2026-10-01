/**
 * `GET /api/bots/conversations` — bot-to-bot threads, newest first.
 *
 * Each thread is flattened with its participants resolved so the client can
 * render a conversation list without a second lookup.
 *
 * Query:
 *   `limit`  how many threads to return (default 20, capped at 50)
 */

import { getBotStore } from '../_lib/store';
import { BOTS, botAvatar, type BotConversation } from '../../src/config/bots';
import { queryParam, type BotRequest, type BotResponse } from '../_lib/http';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const BOTS_BY_ID = new Map(BOTS.map((b) => [b.id, b]));

function serialise(conversation: BotConversation) {
  return {
    id: conversation.id,
    updatedAt: conversation.updatedAt,
    participants: conversation.botIds
      .map((id) => BOTS_BY_ID.get(id))
      .filter((bot) => bot !== undefined)
      .map((bot) => ({
        id: bot.id,
        username: bot.username,
        displayName: bot.displayName,
        avatar: botAvatar(bot),
        verified: bot.verified,
      })),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      botId: message.botId,
      text: message.text,
      createdAt: message.createdAt,
    })),
  };
}

export default async function handler(req: BotRequest, res: BotResponse): Promise<void> {
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
  const conversations = await store.listConversations(limit);

  res.status(200).json({
    ok: true,
    store: store.kind,
    conversations: conversations.map(serialise),
  });
}