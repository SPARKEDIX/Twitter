/**
 * Token-bucket rate limiter (client-side friction).
 *
 * NOTE: client limits never replace server enforcement. Firebase Auth already
 * returns auth/too-many-requests. For real abuse protection enable App Check
 * + Auth blocking functions. This only stops casual brute-force / double-clicks.
 */

export interface BucketOpts {
  capacity: number;
  refillIntervalMs: number;
  cost?: number;
}

export interface BucketResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

type Stored = { tokens: number; updatedAt: number };
const mem = new Map<string, Stored>();

function readStored(key: string): Stored | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return mem.get(key) ?? null;
    const p = JSON.parse(raw) as Stored;
    if (typeof p.tokens !== 'number' || typeof p.updatedAt !== 'number') return null;
    return p;
  } catch {
    return mem.get(key) ?? null;
  }
}

function writeStored(key: string, s: Stored): void {
  mem.set(key, s);
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    /* private mode: memory only */
  }
}

export function consumeBucket(key: string, opts: BucketOpts): BucketResult {
  const cost = opts.cost ?? 1;
  const now = Date.now();
  const prev = readStored(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsed = Math.max(0, now - prev.updatedAt);
  const refilled = Math.min(opts.capacity, prev.tokens + elapsed / opts.refillIntervalMs);
  if (refilled >= cost) {
    const next = { tokens: refilled - cost, updatedAt: now };
    writeStored(key, next);
    return { allowed: true, remaining: Math.floor(next.tokens), retryAfterSec: 0 };
  }
  const need = cost - refilled;
  const retryAfterSec = Math.ceil((need * opts.refillIntervalMs) / 1000);
  writeStored(key, { tokens: refilled, updatedAt: prev.updatedAt });
  return { allowed: false, remaining: Math.floor(refilled), retryAfterSec };
}

/** Avoid raw PII in storage keys: lowercase + djb2 hash. */
export function emailKey(prefix: string, email: string): string {
  const norm = email.trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) >>> 0;
  return prefix + h.toString(36);
}

export const LOGIN_BUCKET = { capacity: 5, refillIntervalMs: 3 * 60 * 1000 };
export const SIGNUP_BUCKET = { capacity: 3, refillIntervalMs: 20 * 60 * 1000 };
export const SOCIAL_BUCKET = { capacity: 5, refillIntervalMs: 3 * 60 * 1000 };
export const RESET_BUCKET = { capacity: 3, refillIntervalMs: 20 * 60 * 1000 };
export const GLOBAL_AUTH_BUCKET = { capacity: 20, refillIntervalMs: 3 * 60 * 1000 };

export function rateLimitMessage(retryAfterSec: number): string {
  const s = Math.max(1, retryAfterSec);
  return s < 60
    ? 'Too many attempts. Try again in ' + s + 's.'
    : 'Too many attempts. Try again in ' + Math.ceil(s / 60) + ' min.';
}
