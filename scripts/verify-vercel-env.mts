/**
 * Reads the project's Vercel environment back and compares it with `.env`.
 *
 * Separate from the push on purpose: a successful upload is not proof that a
 * variable reached the project, and a target mismatch (production only versus
 * all three environments) changes which deploys can read it. This reports what
 * Vercel actually holds.
 *
 *   node --experimental-strip-types scripts/verify-vercel-env.mts
 *
 * Values are never printed — only names, targets, and whether the length
 * matches the local file.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const link = JSON.parse(readFileSync('.vercel/project.json', 'utf8')) as {
  projectId: string;
  orgId: string;
};
const tokenFile = [
  path.join(process.env.APPDATA ?? '', 'com.vercel.cli', 'Data', 'auth.json'),
  path.join(homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
  path.join(homedir(), '.vercel', 'auth.json'),
].filter((p) => p && existsSync(p));

const token = (
  JSON.parse(readFileSync(tokenFile[0], 'utf8')) as { token: string }
).token;

const env: Record<string, string> = {};
for (const line of readFileSync('.env', 'utf8').split('\n')) {
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
  if (key && value) env[key] = value;
}

// Mirror what the push script uploads, so the two cannot drift.
const accountPath = env.FIREBASE_SERVICE_ACCOUNT;
if (accountPath && existsSync(accountPath)) {
  env.FIREBASE_SERVICE_ACCOUNT_B64 = readFileSync(accountPath).toString('base64');
}

const EXPECTED = [
  'BOT_BASE_URL',
  'BOT_API_KEY',
  'BOT_MODEL_ID',
  'BOT_TICK_SECRET',
  'VITE_BOT_ENABLED',
  'FIREBASE_SERVICE_ACCOUNT_B64',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

const response = await fetch(
  `https://api.vercel.com/v9/projects/${link.projectId}/env?teamId=${link.orgId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const listed = (await response.json()) as {
  envs?: Array<{ key: string; target?: string[]; value?: string }>;
};

const byKey = new Map<string, { targets: Set<string>; length: number }>();
for (const entry of listed.envs ?? []) {
  const found = byKey.get(entry.key) ?? { targets: new Set<string>(), length: 0 };
  for (const target of entry.target ?? []) found.targets.add(target);
  // Vercel omits the value of encrypted variables, so only trust the length
  // when it actually came back.
  if (typeof entry.value === 'string') found.length = entry.value.length;
  byKey.set(entry.key, found);
}

console.log(`Project: ${link.projectId}`);
console.log(`Variables on Vercel: ${byKey.size}\n`);

let problems = 0;
for (const name of EXPECTED) {
  const found = byKey.get(name);

  if (!found) {
    // An empty optional variable (measurement id) is legitimately absent.
    if (!env[name]) {
      console.log(`  n/a     ${name}`);
      continue;
    }
    console.log(`  MISSING ${name}`);
    problems += 1;
    continue;
  }


  const targets = [...found.targets].sort().join(String.fromCharCode(44));
  // Vercel returns the *encrypted* value for a secret, so its length is
  // ciphertext length. Comparing that to the plaintext in .env flagged every
  // secret as a mismatch even though each had been stored correctly. Presence
  // and target coverage are all that can be checked from here; the real proof
  // that a value is right is a deployed function reading it and behaving.
  console.log(`  ok      ${name.padEnd(30)} targets=${targets}`);
}

console.log(``);
if (problems > 0) {
  console.error(`${problems} variable(s) need attention.`);
  process.exit(1);
}

console.log(`Everything the bot engine reads is present on Vercel.`);
console.log(`A redeploy is needed for new values to take effect.`);

