/**
 * Local smoke test for the bot engine.
 *
 * Runs the real pipeline — DuckDuckGo search, then the provider, then the
 * store — against the live configuration in `.env`. This is a manual check,
 * not a unit test: it needs `BOT_API_KEY` and spends a token or two per run.
 *
 *   node --experimental-strip-types scripts/bot-smoke.ts
 *
 * Set `BOT_SMOKE_TWEET=false` to skip the tweet half and only exercise the
 * conversation generator.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads `.env` into `process.env`.
 *
 * Vite loads `.env` for the browser bundle, but nothing does it for a plain
 * `node scripts/...` run, and the engine reads `process.env`. Values already
 * present win, so real environment variables are not clobbered by the file.
 */
function loadDotEnv(): void {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator < 0) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn('[smoke] No .env found — relying on real environment variables.\n');
  }
}

loadDotEnv();

const { search } = await import('../api/_lib/ddg.js');
const { generateTweet, generateConversation, sanitiseTweet } = await import(
  '../api/_lib/engine.ts'
);
const { isLlmConfigured } = await import('../api/_lib/llm.js');
const { BOTS } = await import('../src/config/bots.js');

console.log(`Bot roster: ${BOTS.length} accounts`);
console.log(`Provider configured: ${isLlmConfigured()}\n`);

if (!isLlmConfigured()) {
  console.error(
    'Cannot continue: set BOT_API_KEY, BOT_BASE_URL and BOT_MODEL_ID in .env first.\n' +
      'See the bot section of .env.example.'
  );
  process.exit(1);
}

/* ---- 1. DuckDuckGo, on its own, so a search failure is visible ---- */

console.log('--- DuckDuckGo search ---');
const query = 'ISRO latest launch';
const results = await search(query);

if (results.length === 0) {
  console.warn(`No results for "${query}". Tweets will fall back to model knowledge.`);
} else {
  for (const result of results) {
    console.log(`  * ${result.title}`);
    if (result.snippet) console.log(`    ${result.snippet.slice(0, 110)}…`);
  }
}
console.log('');

/* ---- 2. Sanitiser, which needs no network ---- */

console.log('--- Tweet sanitiser ---');
const messy = 'Tweet: "Here is your post — launch windows are brutal." #ISRO #space';
const cleaned = sanitiseTweet(messy);
console.log(`  in:   ${messy}`);
console.log(`  out:  ${cleaned}`);
console.log(`  ${cleaned.includes('Tweet:') ? 'FAIL: label survived' : 'ok: label stripped'}`);
console.log(`  ${cleaned.includes('#') ? 'FAIL: hashtag survived' : 'ok: hashtags stripped'}\n`);

/* ---- 3. A real tweet ---- */

if (process.env.BOT_SMOKE_TWEET !== 'false') {
  console.log('--- Tweet generation ---');
  const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
  const tweet = await generateTweet(bot);

  if (!tweet) {
    console.error('  FAILED — check BOT_API_KEY / BOT_MODEL_ID and the provider response.');
    process.exitCode = 1;
  } else {
    console.log(`  @${bot.username}: ${tweet.text}`);
    console.log(`  topic:   ${tweet.topic}`);
    console.log(`  sources: ${tweet.sources.join(' | ') || '(none — search failed)'}`);
    console.log(`  length:  ${tweet.text.length} chars`);
  }
  console.log('');
}

/* ---- 4. A real bot-to-bot thread ---- */

console.log('--- Bot-to-bot conversation ---');
const conversation = await generateConversation();

if (!conversation) {
  console.error('  FAILED — the provider produced no usable exchange.');
  process.exitCode = 1;
} else {
  for (const message of conversation.messages) {
    const speaker = BOTS.find((b) => b.id === message.botId);
    console.log(`  @${speaker?.username ?? '?'}: ${message.text}`);
  }
  console.log(`\n  ${conversation.messages.length} messages across ${conversation.botIds.length} bots.`);
}

console.log('\nSmoke test finished.');
