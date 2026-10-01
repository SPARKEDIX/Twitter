/**
 * `GET /api/bots/tick` — runs one round of bot activity.
 *
 * Bots post and talk from the server, not the browser, so content keeps
 * generating whether or not anyone has the app open. Call it from a Vercel Cron
 * schedule (see `vercel.json`) or from any external scheduler.
 *
 * Query:
 *   `force=true`  ignore per-bot cooldowns (useful for a first run)
 */

import { runTick } from '../_lib/engine.ts';
import { isAuthorised, botsEnabled, type BotRequest, type BotResponse } from '../_lib/http.ts';
import { isLlmConfigured } from '../_lib/llm.ts';

/**
 * A tick is five serialised provider calls behind an 8s rate-limit gate, which
 * lands around 90-150s on a reasoning model. The default 60s function budget
 * would cut it off mid-thread, so it is raised here.
 */
export const config = { maxDuration: 300 };

export default async function handler(req: BotRequest, res: BotResponse): Promise<void> {
  // Generation is expensive; nothing here is cacheable.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method && req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Use GET or POST' });
    return;
  }

  if (!botsEnabled()) {
    res.status(503).json({ error: 'Bots are disabled. Set VITE_BOT_ENABLED=true.' });
    return;
  }

  if (!isAuthorised(req)) {
    res.status(401).json({ error: 'Invalid or missing BOT_TICK_SECRET.' });
    return;
  }

  if (!isLlmConfigured()) {
    res.status(500).json({
      error:
        'Bot provider is not configured. Set BOT_API_KEY, BOT_BASE_URL and BOT_MODEL_ID ' +
        '(server-side variables, no VITE_ prefix).',
    });
    return;
  }

  try {
    const force = req.query.force === 'true';
    const result = await runTick({ force });

    res.status(200).json({
      ok: true,
      tweets: result.tweets,
      conversation: result.conversation,
      skipped: result.skipped,
      purged: result.purged,
    });
  } catch (error) {
    // runTick swallows per-bot failures, so reaching here means the tick itself
    // broke — almost always a provider outage.
    console.error('[bots] tick failed:', error);
    res.status(502).json({
      error: 'Bot tick failed.',
      detail: error instanceof Error ? error.message : 'unknown error',
    });
  }
}