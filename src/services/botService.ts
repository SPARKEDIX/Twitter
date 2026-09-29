/**
 * Bot filler until 500 real users exist.
 * Keys NEVER hard-coded: read from env (Vite: import.meta.env, Vercel env).
 * Required: BOT_API_KEY (sensitive), BOT_MODEL_ID, BOT_BASE_URL, VITE_BOT_ENABLED.
 * Production: proxy via Cloud Function so key never ships to browser.
 */

const REAL_USER_TARGET = 500;

export function botEnabled(): boolean {
  try {
    return (import.meta.env.VITE_BOT_ENABLED as string | undefined) === 'true';
  } catch { return false; }
}

export function shouldUseBot(realUserCount: number | null): boolean {
  if (!botEnabled()) return false;
  if (realUserCount == null) return false;
  return realUserCount < REAL_USER_TARGET;
}

function botConfig(): { apiKey: string; modelId: string; baseUrl: string } | null {
  const apiKey = (import.meta.env.BOT_API_KEY as string | undefined)?.trim();
  const modelId = (import.meta.env.BOT_MODEL_ID as string | undefined)?.trim();
  const baseUrl = (import.meta.env.BOT_BASE_URL as string | undefined)?.trim();
  if (!apiKey || !modelId || !baseUrl) return null;
  return { apiKey, modelId, baseUrl };
}

export async function generateBotTweet(prompt: string): Promise<string | null> {
  const cfg = botConfig();
  if (!cfg) return null;
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(cfg.baseUrl.replace(/\/$/, '') + '/generate', {
      method: 'POST',
      signal: c.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.modelId, prompt: prompt.slice(0, 2000) }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = (await r.json()) as { text?: unknown };
    return typeof j.text === 'string' ? j.text.slice(0, 280) : null;
  } catch {
    return null;
  }
}
