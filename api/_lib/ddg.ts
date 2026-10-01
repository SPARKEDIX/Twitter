/**
 * DuckDuckGo search for real-time grounding.
 *
 * Uses the Instant Answer JSON API first and falls back to scraping the
 * `html.duckduckgo.com` results page. That ordering is deliberate: the JSON API
 * is fast and structured, but it returns an empty `AbstractText` for most
 * non-encyclopedia queries (which is most news), so the HTML fallback is what
 * actually makes bots able to talk about today's news.
 *
 * Both endpoints are unauthenticated and rate-limit aggressively, so every call
 * is time-boxed and every failure degrades to "no sources" rather than throwing.
 */

const JSON_ENDPOINT = 'https://api.duckduckgo.com/';
const HTML_ENDPOINT = 'https://html.duckduckgo.com/html/';
const TIMEOUT_MS = 8_000;

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/** Strips tags and collapses whitespace. */
function clean(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A desktop-browser User-Agent.
 *
 * Required, not cosmetic. With a generic agent `html.duckduckgo.com` answers
 * the POST form with a 202 anti-bot interstitial containing zero results, which
 * is indistinguishable from "no news today" if you are not checking the status
 * code. With this header the same request returns the real results page.
 */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Fetches with a hard timeout so a hanging DDG cannot stall a bot tick.
 *
 * Returns `''` for a throttled response rather than throwing: DuckDuckGo
 * answers 202 with a challenge page when it has seen too many requests. That
 * page is a valid HTTP success as far as `response.ok` is concerned, so it is
 * checked explicitly — otherwise it gets parsed as "searched, found nothing",
 * which silently downgrades every tweet to ungrounded.
 */
/** Minimum gap between outbound DDG requests from one instance. */
const MIN_REQUEST_GAP_MS = 1_200;

let lastRequestAt = 0;

/** Serialises requests with a gap so a parallel tick cannot trip the limit. */
async function waitForSlot(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

async function fetchText(url: string, init: RequestInit): Promise<string> {
  await waitForSlot();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        ...init.headers,
      },
    });
    if (!response.ok) return '';
    // 202 is DuckDuckGo's anti-bot / rate-limit response.
    if (response.status === 202) {
      console.warn(`[ddg] throttled (202) for "${new URL(url).searchParams.get('q') ?? ''}"`);
      return '';
    }
    return await response.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

/** Structured API path. Good for entities, useless for breaking news. */
async function searchInstantAnswer(query: string): Promise<SearchResult[]> {
  const body = await fetchText(
    `${JSON_ENDPOINT}?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
    {}
  );
  if (!body) return [];

  try {
    const json = JSON.parse(body) as {
      AbstractText?: string;
      Heading?: string;
      AbstractURL?: string;
      Results?: Array<{ Text?: string; FirstURL?: string }>;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const results: SearchResult[] = [];
    if (json.AbstractText?.trim()) {
      results.push({
        title: json.Heading?.trim() || query,
        snippet: json.AbstractText.trim().slice(0, 400),
        url: json.AbstractURL || '',
      });
    }
    for (const item of [...(json.Results ?? []), ...(json.RelatedTopics ?? [])].slice(0, 4)) {
      const snippet = item.Text?.trim();
      if (snippet) {
        results.push({ title: query, snippet: snippet.slice(0, 300), url: item.FirstURL || '' });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * HTML fallback. Pulls the organic results out of the no-JS endpoint with a
 * regex rather than a DOM parser — the markup is stable enough for the handful
 * of fields we want, and this keeps the dependency list at zero.
 *
 * GET, not POST. The endpoint accepts a form body, but a plain GET is what
 * actually returns results; a POST comes back as an anti-bot page.
 */
async function searchHtml(query: string): Promise<SearchResult[]> {
  const body = await fetchText(`${HTML_ENDPOINT}?q=${encodeURIComponent(query)}`, {});
  if (!body) return [];

  const results: SearchResult[] = [];

  // Split on the title anchors and parse each result as its own block, rather
  // than reading a fixed character window ahead of the title. A fixed window
  // silently truncates on rows with long `uddg` redirect URLs and drops the
  // snippet, which leaves the model with titles but nothing to ground on.
  const rowPattern =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const matches: Array<{ href: string; title: string; end: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(body)) !== null) {
    const title = clean(match[2]);
    if (title) matches.push({ href: match[1], title, end: matchPatternEnd(match) });
  }

  for (const [index, row] of matches.entries()) {
    if (results.length >= 5) break;

    // This row's text runs until the next row's title begins.
    const blockStart = row.end;
    const blockEnd = matches[index + 1]?.end ?? Math.min(body.length, row.end + 3000);
    const block = body.slice(blockStart, blockEnd + (matches[index + 1] ? 400 : 0));

    // The snippet is an <a> on this page, but a <div> on some variants, so the
    // closing tag is matched loosely rather than assuming one shape.
    const snippetMatch = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/.exec(block);
    const snippet = snippetMatch ? clean(snippetMatch[1]).slice(0, 400) : '';

    results.push({ title: row.title, snippet, url: unwrapDuckDuckGoUrl(row.href) });
  }

  return results;
}

/** End offset of a regex match. Kept separate so the row parse stays readable. */
function matchPatternEnd(match: RegExpExecArray): number {
  return match.index + match[0].length;
}

/**
 * Unwraps DuckDuckGo's outbound redirect.
 *
 * Result links are `//duckduckgo.com/l/?uddg=<encoded target>&rut=...`; the
 * real destination is percent-encoded inside `uddg`.
 */
function unwrapDuckDuckGoUrl(href: string): string {
  const uddg = /[?&]uddg=([^&]+)/.exec(href);
  if (!uddg) return href;

  try {
    return decodeURIComponent(uddg[1]);
  } catch {
    // Not valid percent-encoding; the wrapped URL is still better than nothing.
    return href;
  }
}

/**
 * Searches DuckDuckGo and returns up to `limit` results.
 *
 * Never throws and never rejects: a bot with no sources still produces a tweet
 * from its own knowledge, which is a better outcome than a failed tick.
 */
export async function search(query: string, limit = 4): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const instant = await searchInstantAnswer(trimmed);
  // The instant-answer endpoint answers instantly for entities, so if it
  // produced anything substantial there is no reason to pay for the HTML scrape.
  const hasRealContent = instant.some((r) => r.snippet.length > 80);
  const results = hasRealContent ? instant : (await searchHtml(trimmed)) || instant;

  return results.slice(0, limit);
}

/**
 * Flattens results into the compact context block that goes into the prompt.
 *
 * @returns Bullet lines, or an empty string when there is nothing usable.
 */
export function formatContext(results: SearchResult[]): string {
  const lines = results
    .filter((r) => r.snippet.trim())
    .map((r) => `- ${r.title}: ${r.snippet}`)
    .filter((line) => line.length > 15)
    .slice(0, 4);

  return lines.join('\n');
}