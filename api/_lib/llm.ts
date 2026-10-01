/**
 * Server-only LLM client.
 *
 * Reads its configuration from `process.env`, never `import.meta.env`, because
 * this file only ever runs inside a serverless function. That distinction is
 * the whole point of keeping the bot engine in `api/`: anything reaching the
 * browser gets inlined into the public bundle, so the API key must never be
 * read from `import.meta.env`.
 *
 * Uses `BOT_*` (not `VITE_BOT_*`) for exactly that reason — the `VITE_` prefix
 * is a public-bundle opt-in in Vite, and a secret must not carry it.
 */

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Thrown when the provider is missing config, rate-limits, or returns junk. */
export class LlmError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
  }
}

/**
 * Reads and validates the bot provider config.
 *
 * @throws {LlmError} with a 500 when anything is missing. Failing loudly beats a
 * silent fallback that quietly produces zero tweets.
 */
export function readLlmConfig(): LlmConfig {
  const apiKey = process.env.BOT_API_KEY?.trim();
  const model = process.env.BOT_MODEL_ID?.trim();
  const rawBase = process.env.BOT_BASE_URL?.trim();

  const missing: string[] = [];
  if (!apiKey) missing.push('BOT_API_KEY');
  if (!model) missing.push('BOT_MODEL_ID');
  if (!rawBase) missing.push('BOT_BASE_URL');

  if (missing.length > 0) {
    throw new LlmError(
      `Missing bot provider variable(s): ${missing.join(', ')}. ` +
        'Set them in .env for local dev, or in Project Settings -> Environment Variables on Vercel. ' +
        'These are server-side variables and must NOT be prefixed with VITE_.',
      500
    );
  }

  return { apiKey: apiKey!, model: model!, baseUrl: rawBase!.replace(/\/+$/, '') };
}

/** @returns `true` when every required variable is present. Never throws. */
export function isLlmConfigured(): boolean {
  try {
    readLlmConfig();
    return true;
  } catch {
    return false;
  }
}

interface CompletionResponse {
  choices?: Array<{
    message?: { content?: string | null; reasoning_content?: string | null };
  }>;
  error?: { message?: string };
}

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Token budgets.
 *
 * Reasoning models (deepseek-r1, o1, anything with a "thinking" phase) spend
 * most of their budget on hidden reasoning and return an *empty* completion
 * when the cap is low — which looks exactly like a provider failure. The floor
 * is deliberately generous so a reasoning model still has room to finish
 * thinking and then answer. Non-reasoning models simply stop early and cost
 * less.
 */
const MIN_MAX_TOKENS = 2_000;
const DEFAULT_MAX_TOKENS = 2_500;

/**
 * Minimum gap between two provider requests from one instance.
 *
 * Free-tier gateways rate-limit per account, not per connection: LiteRouter
 * answers 403 "rate limit exceeded for your tier (7 seconds between messages)"
 * when requests arrive back to back. That makes concurrency actively harmful —
 * parallel requests do not finish sooner, they just fail. Every call is
 * therefore serialised behind this gate.
 *
 * Defaults to 8s (comfortably above the 7s LiteRouter asks for). Override with
 * `BOT_MIN_REQUEST_GAP_MS` for a gateway with a shorter or longer window.
 */
const MIN_REQUEST_GAP_MS = Number(process.env.BOT_MIN_REQUEST_GAP_MS ?? 8_000);

/** When the next request is allowed to start, as epoch ms. */
let nextSlotAt = 0;

/**
 * Waits for the provider slot, then claims it.
 *
 * `nextSlotAt` is set optimistically *before* awaiting so two callers that
 * arrive in the same tick queue up behind each other instead of both reading
 * the same free slot and colliding again.
 */
async function waitForProviderSlot(): Promise<void> {
  const now = Date.now();
  const start = Math.max(now, nextSlotAt);
  nextSlotAt = start + MIN_REQUEST_GAP_MS;

  const wait = start - now;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

/**
 * Calls an OpenAI-compatible `/chat/completions` endpoint.
 *
 * Works with OpenRouter, LiteLLM, Groq, Together, OpenAI itself, and anything
 * else that speaks the same shape — which is why the base URL is configuration
 * rather than a constant.
 *
 * @throws {LlmError} on non-2xx, on timeout, or on a body with no usable text.
 */
export async function complete(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const config = readLlmConfig();
  const { temperature = 0.9 } = options;
  // Clamp rather than trust the caller: anything below the floor starves a
  // reasoning model of the budget it needs to produce an answer at all.
  const maxTokens = Math.max(options.maxTokens ?? DEFAULT_MAX_TOKENS, MIN_MAX_TOKENS);

  // One attempt is enough for most providers. The retry exists for the specific
  // case of a model that produced no content because it ran out of room mid
  // thought, which one larger budget reliably fixes.
  let lastError: LlmError | null = null;

  for (const budget of [maxTokens, maxTokens * 2]) {
    try {
      const text = await requestCompletion(config, messages, budget, temperature);
      if (text) return text;
      lastError = new LlmError(
        `Provider ${config.model} returned an empty completion at ${budget} max_tokens. ` +
          'If this model is a reasoning model, pick a non-reasoning id ' +
          '(e.g. deepseek-v3-0324:free) or raise BOT_MODEL_ID.',
        502
      );
    } catch (error) {
      if (error instanceof LlmError) {
        // 429 and 403 are both how gateways signal "too fast" on a free tier,
        // and both clear on their own once the gap elapses, so they are worth a
        // second attempt. 500/504 are not retried here because the outer loop
        // already doubles the token budget for those.
        const retriable = error.status === 429 || error.status === 403 || error.status === 502;
        if (!retriable) throw error;
        lastError = error;
      } else {
        throw error;
      }
    }
  }

  throw lastError ?? new LlmError('Provider returned an empty completion.');
}

/** One HTTP round trip. Resolves to `''` when the model produced no text. */
async function requestCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  await waitForProviderSlot();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new LlmError(
        `Provider ${config.model} responded ${response.status}. ${detail.slice(0, 200)}`,
        response.status === 429 ? 429 : 502
      );
    }

    const payload = (await response.json()) as CompletionResponse;

    if (payload.error?.message) {
      throw new LlmError(`Provider error: ${payload.error.message.slice(0, 200)}`);
    }

    return payload.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmError(`Provider timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`, 504);
    }
    throw new LlmError(
      `Could not reach the bot provider: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  } finally {
    clearTimeout(timeout);
  }
}