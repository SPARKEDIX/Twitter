/**
 * Minimal Vercel request/response types.
 *
 * Declared locally instead of importing from `@vercel/node` so the bot engine
 * has no extra devDependency. The shapes used here are a small, stable subset of
 * the real ones, and `api/_lib/*.ts` stays type-checkable on its own.
 */

export interface BotRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

export interface BotResponse {
  status(code: number): BotResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

/** Returns the first value of a query param, or `undefined`. */
export function queryParam(req: BotRequest, key: string): string | undefined {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Shared secret check for endpoints that spend money.
 *
 * Generation endpoints are rate-limited by this rather than left open: without
 * it, anyone who learns the URL can drain the provider key. When
 * `BOT_TICK_SECRET` is unset the check passes, which keeps local development
 * frictionless — but it means a deployed instance with no secret is public, so
 * the endpoints are also gated on `VITE_BOT_ENABLED`.
 */
export function isAuthorised(req: BotRequest): boolean {
  const secret = process.env.BOT_TICK_SECRET?.trim();
  if (!secret) return true;

  const header = req.headers['x-bot-secret'];
  const provided = Array.isArray(header) ? header[0] : header;

  return provided === secret || queryParam(req, 'secret') === secret;
}

/** @returns `true` unless `VITE_BOT_ENABLED` is explicitly something else. */
export function botsEnabled(): boolean {
  return process.env.VITE_BOT_ENABLED !== 'false';
}