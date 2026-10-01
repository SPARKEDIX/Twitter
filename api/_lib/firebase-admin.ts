/**
 * Firebase Admin SDK bootstrap for the bot engine.
 *
 * Why Admin and not the client SDK
 * -------------------------------
 * The bot engine runs server-side and needs to *write* bot tweets and
 * conversations. Doing that with the client SDK would mean opening the
 * Firestore rules to the world, because the server is not an authenticated
 * user — anyone holding the public web API key could then post as
 * `@antariskh`. The Admin SDK authenticates with a service account and
 * bypasses rules entirely, so the client stays read-only.
 *
 * Credentials are looked for in this order, and the first hit wins:
 *
 *   1. `FIREBASE_SERVICE_ACCOUNT`     — path to a JSON file (local development)
 *   2. `FIREBASE_SERVICE_ACCOUNT_JSON` — the JSON itself, inline
 *   3. `FIREBASE_SERVICE_ACCOUNT_B64`  — base64 of the JSON (Vercel; env values
 *                                       cannot contain newlines, so the raw
 *                                       JSON has to be encoded)
 *   4. Application Default Credentials  — `gcloud auth application-default`
 *
 * When none are present this returns `null` rather than throwing, and
 * `store.ts` falls back to the in-memory implementation. That is deliberate:
 * a missing credential should degrade the app to a cache, not take the
 * timeline down.
 */

import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/** The Admin SDK expects an RSA key with literal newlines, not `\n` escapes. */
function normalisePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

/** Reads and parses a credential from any of the supported env shapes. */
function readCredential(): ServiceAccountJson | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      return JSON.parse(inline) as ServiceAccountJson;
    } catch {
      console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();
  if (encoded) {
    try {
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as ServiceAccountJson;
    } catch {
      console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64 JSON.');
    }
  }

  const file = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (file) {
    // Resolved against the project root so a relative path works the same way
    // locally and on Vercel, where the process CWD is not the repo root.
    const absolute = path.resolve(process.cwd(), file);
    if (existsSync(absolute)) {
      try {
        return JSON.parse(readFileSync(absolute, 'utf8')) as ServiceAccountJson;
      } catch {
        console.warn(`[firebase-admin] Could not parse ${absolute} as JSON.`);
      }
    } else {
      console.warn(`[firebase-admin] Service account file not found at ${absolute}.`);
    }
  }

  return null;
}

/** Memoised so the SDK is initialised once per warm instance. */
let firestore: Firestore | null = null;
let attempted = false;

/**
 * Locates Application Default Credentials without attempting to use them.
 *
 * This check exists because `initializeApp({ credential: applicationDefault() })`
 * does **not** throw when no credentials exist — it defers the failure to the
 * first real request, which then dies with "Unable to detect a Project Id".
 *
 * That is a nasty failure mode here: the factory would see a non-null instance,
 * choose Firestore over the in-memory fallback, and every bot read and write
 * would fail at runtime instead of degrading to a cache. So ADC is only used
 * once this has confirmed it is actually present on disk.
 */
function hasApplicationDefaultCredentials(): boolean {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return true;

  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (!home) return false;

  const candidates = [
    path.join(home, '.config', 'gcloud', 'application_default_credentials.json'),
    path.join(home, 'gcloud', 'application_default_credentials.json'),
    process.env.APPDATA
      ? path.join(process.env.APPDATA, 'gcloud', 'application_default_credentials.json')
      : '',
  ].filter(Boolean);

  return candidates.some((candidate) => existsSync(candidate));
}

/** Project id used when the credential shape does not carry one. */
function fallbackProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    undefined
  );
}

/**
 * @returns A Firestore instance, or `null` when no credentials are configured.
 * Never throws — a credential problem downgrades storage, it does not break
 * the app.
 */
export function getAdminFirestore(): Firestore | null {
  if (attempted) return firestore;
  attempted = true;

  const credential = readCredential();

  try {
    if (credential?.client_email && credential?.private_key && credential?.project_id) {
      const app: App =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: credential.project_id,
            clientEmail: credential.client_email,
            privateKey: normalisePrivateKey(credential.private_key),
          }),
        });
      firestore = getFirestore(app);
      console.log('[firebase-admin] Using a service account credential.');
      return firestore;
    }

    // Lets `gcloud auth application-default login` work without any env var,
    // which is how the Firebase emulator and CI usually authenticate. Only
    // taken when the credential file is confirmed present — see the note on
    // hasApplicationDefaultCredentials.
    if (hasApplicationDefaultCredentials()) {
      const projectId = credential?.project_id ?? fallbackProjectId();
      const app: App =
        getApps()[0] ??
        initializeApp({ credential: applicationDefault(), ...(projectId ? { projectId } : {}) });
      firestore = getFirestore(app);
      console.log('[firebase-admin] Using application default credentials.');
      return firestore;
    }

    // Nothing usable. Returning null here is what makes the caller fall back to
    // the in-memory store rather than handing out a Firestore instance that
    // would throw on first use.
    console.log(
      '[firebase-admin] No credentials found — bot content stays in memory. ' +
        'Set FIREBASE_SERVICE_ACCOUNT to a service account JSON, or run ' +
        '`gcloud auth application-default login`.'
    );
    return null;
  } catch (error) {
    console.warn(
      '[firebase-admin] No usable credentials; bot content will stay in memory. ' +
        'Set FIREBASE_SERVICE_ACCOUNT (file path) or FIREBASE_SERVICE_ACCOUNT_B64. ' +
        `(${
          error instanceof Error ? error.message.split('\n')[0] : 'unknown error'
        })`,
      error
    );
    firestore = null;
    return null;
  }
}