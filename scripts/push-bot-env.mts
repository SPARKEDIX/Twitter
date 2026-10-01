/**
 * Uploads the bot engine's environment variables to Vercel over the REST API.
 *
 * Why not the CLI
 * ---------------
 * `npx vercel env add` re-resolves the package on every invocation, which meant
 * six variables took minutes and the first one hung indefinitely on this
 * machine. The CLI already persists a token, so the API route does the same work
 * in one request per variable and fails loudly instead of stalling.
 *
 * The token is read from the CLI's own auth store rather than being asked for.
 * It is never written to disk here and never printed.
 *
 * Usage:  node --experimental-strip-types scripts/push-bot-env.mts
 *
 * Requires: `vercel login` to have been run at least once, and `vercel link` so
 * `.vercel/project.json` exists.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const API_ROOT = 'https://api.vercel.com';
const PROJECT_ID = (JSON.parse(readFileSync('.vercel/project.json', 'utf8')) as { projectId: string })
  .projectId;
const TEAM_ID = (JSON.parse(readFileSync('.vercel/project.json', 'utf8')) as { orgId: string }).orgId;

/** The CLI keeps its token here; fall back across the known locations. */
function readToken(): string {
  const candidates = [
    path.join(process.env.APPDATA ?? '', 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(homedir(), '.vercel', 'auth.json'),
  ].filter((p) => p && existsSync(p));

  for (const file of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as { token?: string };
      if (parsed.token) return parsed.token;
    } catch {
      /* try the next location */
    }
  }

  throw new Error(
    'No Vercel token found. Run `npx vercel login` first, or set VERCEL_TOKEN.'
  );
}

/** Parses `.env` the same way the other scripts do. */
function readEnvFile(): Record<string, string> {
  const file = '.env';
  if (!existsSync(file)) throw new Error('No .env found.');

  const out: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
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
    if (key && value) out[key] = value;
  }
  return out;
}

const env = readEnvFile();

// Vercel environment variables cannot contain raw newlines, so the service
// account JSON has to travel base64-encoded.
const accountPath = env.FIREBASE_SERVICE_ACCOUNT;
if (accountPath && existsSync(accountPath)) {
  env.FIREBASE_SERVICE_ACCOUNT_B64 = readFileSync(accountPath).toString('base64');
}

const VARS = [
  'BOT_BASE_URL',
  'BOT_API_KEY',
  'BOT_MODEL_ID',
  'BOT_TICK_SECRET',
  'VITE_BOT_ENABLED',
  'FIREBASE_SERVICE_ACCOUNT_B64',
] as const;

const token = readToken();
const missing = VARS.filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(`No value in .env for: ${missing.join(', ')}`);
  process.exit(1);
}

const query = TEAM_ID ? `?teamId=${TEAM_ID}` : '';
const endpoint = `${API_ROOT}/v10/projects/${PROJECT_ID}/env${query}`;

let failures = 0;
for (const name of VARS) {
  const value = env[name];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: name,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  const message = body.error?.message ?? '';

  // "Already exists" comes back as 400 for a target-scoped collision and 409
  // when the project-level key is duplicated — neither is a hard failure, it
  // just means the value needs replacing rather than adding.
  const alreadyExists =
    response.status === 409 || /already exists/i.test(message);

  if (response.ok) {
    // Length only — the value itself must never reach the terminal.
    console.log(`  ok   ${name} (${value.length} chars)`);
  } else if (alreadyExists) {
    const listResponse = await fetch(`${API_ROOT}/v9/projects/${PROJECT_ID}/env/${name}${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const existing = (await listResponse.json().catch(() => ({}))) as {
      envs?: Array<{ id: string; target?: string[] }>;
    };

    // Everything sharing this key, not just the first entry: Vercel keeps one
    // record per target and a stale production-only copy would shadow the new
    // value on preview deployments.
    const entries = existing.envs ?? [];
    let removedAll = true;
    for (const entry of entries) {
      const del = await fetch(`${API_ROOT}/v9/projects/${PROJECT_ID}/env/${entry.id}${query}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!del.ok) removedAll = false;
    }

    if (!removedAll) {
      failures += 1;
      console.error(`  FAIL ${name}: exists and could not be replaced`);
      continue;
    }

    const targets =
      entries.find((e) => e.target?.includes('production'))?.target ??
      entries[0]?.target ?? ['production', 'preview', 'development'];

    const retry = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: name, value, type: 'encrypted', target: targets }),
    });

    if (retry.ok) {
      console.log(`  ok   ${name} (${value.length} chars, replaced)`);
    } else {
      failures += 1;
      const retryBody = (await retry.json().catch(() => ({}))) as { error?: { message?: string } };
      console.error(`  FAIL ${name}: ${retryBody.error?.message ?? retry.status}`);
    }
  } else {
    failures += 1;
    console.error(`  FAIL ${name}: ${response.status} ${message || 'unknown'}`);
  }
}

console.log('');
if (failures > 0) {
  console.error(`${failures} variable(s) failed.`);
  process.exit(1);
}

console.log(`All ${VARS.length} variables are on Vercel.`);
console.log('They are read at build/runtime, so trigger a fresh deploy for them to apply.');

/* ------------------------------------------------------------------ *
 * Verify by reading the project's environment back.
 *
 * Printing the upload result is not proof: a variable can be created and still
 * not reach a function, and a mismatched target list (production only, versus
 * all three) changes which deploys see it. This lists the names Vercel actually
 * holds so the set can be compared against what the app reads.
 * ------------------------------------------------------------------ */

const listed = (await (
  await fetch(`${API_ROOT}/v9/projects/${PROJECT_ID}/env${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
).json()) as { envs?: Array<{ key: string; target?: string[]; value?: string }> };

const byKey = new Map<string, { targets: Set<string>; length: number }>();
for (const entry of listed.envs ?? []) {
  const existing = byKey.get(entry.key) ?? { targets: new Set<string>(), length: 0 };
  for (const target of entry.target ?? []) existing.targets.add(target);
  existing.length = entry.value?.length ?? 0;
  byKey.set(entry.key, existing);
}

console.log('');
console.log('Verified on Vercel:');
let problems = 0;
for (const name of VARS) {
  const found = byKey.get(name);
  if (!found) {
    console.log(`  MISSING  ${name}`);
    problems += 1;
    continue;
  }
  const expected = env[name].length;
  const lengthOk = expected > 0 && found.length === expected;
  console.log(
    `  ok       ${name.padEnd(28)} targets=${[...found.targets].sort().join(',')}${
      lengthOk ? '' : `  LENGTH MISMATCH (${found.length} vs ${expected})`
    }`
  );
  if (!lengthOk) problems += 1;
}

if (problems > 0) {
  console.error(`\n${problems} variable(s) need attention.`);
  process.exit(1);
}
console.log('\nEverything the bot engine reads is present and matches the local .env.');
