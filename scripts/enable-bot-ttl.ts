/**
 * Enables Firestore TTL on the bot collections.
 *
 * The store already writes an `expireAt` timestamp on every generated document
 * (see `RETENTION_DAYS` in api/_lib/firestoreStore.ts). This script turns on the
 * Firestore policy that actually deletes documents once that timestamp passes,
 * so retention needs no cron job and no request traffic to be enforced.
 *
 * Enabling TTL is a one-time database-level setting; Firestore then deletes
 * expired documents on its own schedule (within about a day of expiry).
 *
 * TTL is a convenience, not the mechanism. Reads already filter expired documents
 * out, and every tick sweeps and deletes them itself (purgeExpired), so retention is
 * enforced with or without this policy. TTL only means the database also reclaims
 * storage while nothing is running.
 *
 * Note: the Firestore REST API exposes no method for this in v1, v1beta1 or
 * v1beta2, and neither firebase-admin nor gcloud is guaranteed to be present, so
 * the console path below is the reliable one.
 *
 * Usage:
 *   npm run bots:ttl
 *
 * Reads the same credentials as the engine — see api/_lib/firebase-admin.ts.
 * With no credentials present it prints the console steps and exits 0, so it is
 * safe to run before the service account is in place.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

/**
 * Loads `.env` into `process.env`.
 *
 * Without this the project id is unknown and the console fallback cannot be
 * printed with a link to the right Firebase project.
 */
function loadDotEnv(): void {
  const file = path.resolve(process.cwd(), '.env');
  if (!existsSync(file)) return;

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

    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

/** Mirrors the loader in api/_lib/firebase-admin.ts for standalone use. */
function readCredential(): Record<string, unknown> | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      return JSON.parse(inline) as Record<string, unknown>;
    } catch {
      /* fall through to the next source */
    }
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();
  if (encoded) {
    try {
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      /* fall through to the next source */
    }
  }

  const file = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (file) {
    const absolute = path.resolve(process.cwd(), file);
    if (existsSync(absolute)) {
      return JSON.parse(readFileSync(absolute, 'utf8')) as Record<string, unknown>;
    }
  }

  return null;
}

/** Collection groups whose `expireAt` field should drive deletion. */
const COLLECTIONS = ['botTweets', 'botConversations'] as const;

function printManualSteps(projectId: string): void {
  console.log('No service account credentials found. Enable TTL by hand instead:\n');
  console.log('  1. https://console.firebase.google.com/project/' + projectId + '/firestore/databases/(default)/indexes');
  console.log('  2. Click the Indexes tab');
  console.log('  3. Under TTL, click Enable TTL');
  console.log('  4. Add one entry per field below, with a start date far in the past\n');
  for (const collection of COLLECTIONS) {
    console.log(`       collection group : ${collection}`);
    console.log('       field           : expireAt');
    console.log('       TTL             : On');
    console.log('');
  }
  console.log('A start date in the past means already-expired documents get deleted on');
  console.log('the first sweep, which is what you want for the very first run.');
}


type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

/**
 * Exchanges the service account key for a short-lived OAuth access token.
 *
 * `firebase-admin` 14.x does not expose Firestore's TTL configuration API — the
 * Firestore instance has no `createTTLConfig` — so this talks to the REST API
 * directly. That needs a bearer token, which the service account can mint for
 * itself: a JWT signed with its own private key, exchanged at Google's token
 * endpoint. No extra dependency, `node:crypto` already has RS256.
 */
async function getAccessToken(credential: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const encodedHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString(
    'base64url'
  );
  const encodedClaims = Buffer.from(
    JSON.stringify({
      iss: credential.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');

  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(credential.private_key.replace(/\\n/g, '\n')).toString('base64url');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${signature}`,
    }),
  });

  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Could not mint an access token: ${payload.error_description ?? response.status}`
    );
  }

  return payload.access_token;
}

/**
 * Creates or updates the TTL config for one collection group.
 *
 * PATCH is used because it is create-or-update in one verb, which makes the
 * script idempotent without a separate existence check.
 */
async function enableTtlForCollection(
  projectId: string,
  collection: string,
  accessToken: string
): Promise<'enabled' | 'already'> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)` +
    `/collectionGroups/${collection}/fields/expireAt/ttlConfig`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttlConfig: {} }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    ttlConfig?: unknown;
    error?: { message?: string };
  };

  if (response.ok) return 'enabled';
  if (response.status === 409) return 'already';

  throw new Error(
    `${response.status} ${response.statusText}: ${body.error?.message ?? 'unknown error'}`
  );
}

async function main(): Promise<void> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const credential = readCredential() as ServiceAccount | null;

  if (!credential?.client_email || !credential?.private_key) {
    console.log('[ttl] No service account credentials — nothing to do automatically.');
    if (projectId) printManualSteps(projectId);
    return;
  }

  const target = credential.project_id ?? projectId;
  if (!target) {
    console.error('[ttl] No project id in the credential or .env.');
    return;
  }

  try {
    const token = await getAccessToken(credential);

    let failures = 0;
    for (const collection of COLLECTIONS) {
      try {
        const result = await enableTtlForCollection(target, collection, token);
        console.log(
          result === 'enabled'
            ? `[ttl] enabled for ${collection}.expireAt`
            : `[ttl] already enabled for ${collection}.expireAt`
        );
      } catch (error) {
        failures += 1;
        console.error(`[ttl] FAILED for ${collection}:`, error instanceof Error ? error.message : error);
      }
    }

    if (failures > 0) {
      console.log('\nPartial success. Enable it by hand instead:');
      printManualSteps(target);
      process.exitCode = 1;
      return;
    }

    console.log('\nDone. Firestore now deletes documents once expireAt passes.');
    console.log('Documents written before TTL was enabled have no expireAt field and');
    console.log('will never expire — delete them by hand if any exist.');
  } catch (error) {
    console.error('[ttl] Setup failed:', error instanceof Error ? error.message : error);
    console.log('\nEnable it by hand instead:');
    printManualSteps(target);
    process.exitCode = 1;
  }
}

await main();
