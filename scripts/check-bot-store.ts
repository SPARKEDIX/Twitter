/**
 * Verifies the storage layer end to end, including 30-day retention.
 *
 * Writes a document, reads it back, checks `expireAt` landed — then writes a
 * second document that is *already* expired and proves `purgeExpired` removes
 * it while leaving the live one alone.
 *
 *   npm run bots:store
 *
 * Both probes use throwaway ids and are deleted afterwards, so real content is
 * untouched.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Loads `.env` into `process.env`.
 *
 * Without this the credential path is unknown and the script reports "no
 * credentials" even when a service account file is sitting in the project root.
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

const { getBotStore } = await import('../api/_lib/store.js');
const store = await getBotStore();

console.log(`Active backend: ${store.kind}`);

if (store.kind === 'memory') {
  console.log(
    '\nNo credentials found, so this only proves the fallback works.\n' +
      'To use Firestore, create a service account and either:\n' +
      '  - set FIREBASE_SERVICE_ACCOUNT=service-account.json in .env (local), or\n' +
      '  - set FIREBASE_SERVICE_ACCOUNT_B64=<base64 of that file> (Vercel).\n' +
      'Then run this script again.'
  );
  process.exit(0);
}

const { RETENTION_DAYS } = await import('../api/_lib/firestoreStore.js');
const { getAdminFirestore } = await import('../api/_lib/firebase-admin.js');
const { Timestamp } = await import('firebase-admin/firestore');

const db = getAdminFirestore();
const liveId = 'selftest-live';
const expiredId = 'selftest-expired';
const nowIso = new Date().toISOString();

// Firestore reserves document ids beginning with a double underscore.
const probe = (id: string, content: string, createdAt: string) => ({
  id,
  botId: 'bot_01',
  topic: 'self-test',
  sources: [],
  text: content,
  createdAt,
});

console.log('\n1. write a live document');
await store.saveTweet(probe(liveId, 'storage round trip', nowIso));

console.log('2. write an already-expired document');
// expireAt lands 30 days after createdAt, so a createdAt 40 days ago is dead.
const staleCreatedAt = new Date(Date.now() - 40 * 86_400_000).toISOString();
await db!
  .collection('botTweets')
  .doc(expiredId)
  .set({
    botId: 'bot_01',
    topic: 'self-test',
    sources: [],
    content: 'already expired',
    createdAt: Timestamp.fromDate(new Date(staleCreatedAt)),
    expireAt: Timestamp.fromMillis(Date.now() - 86_400_000),
  });

console.log('3. read back');
const tweets = await store.listTweets(10);
const live = tweets.find((t) => t.id === liveId);
const expiredVisible = tweets.find((t) => t.id === expiredId);
console.log(
  `   live visible=${live ? 'yes' : 'NO'}  expired visible=${expiredVisible ? 'YES (BUG)' : 'no'}`
);

console.log('4. retention timestamp');
const snap = await db!.collection('botTweets').doc(liveId).get();
const expireAt = snap.get('expireAt')?.toDate();
if (!expireAt) {
  console.error('   FAILED: expireAt is missing.');
  process.exit(1);
}
const days = Math.round((expireAt.getTime() - Date.parse(nowIso)) / 86_400_000);
console.log(`   expireAt = ${expireAt.toISOString()} (~${days} days, expected ${RETENTION_DAYS})`);
console.log(`   ${Math.abs(days - RETENTION_DAYS) <= 1 ? 'ok' : 'WARNING: unexpected'}`);

console.log('5. purgeExpired');
const purged = await store.purgeExpired(50);
console.log(`   purged=${purged} ${purged >= 1 ? '(ok)' : '(BUG: nothing removed)'}`);

const after = await db!.collection('botTweets').doc(expiredId).get();
const liveAfter = await db!.collection('botTweets').doc(liveId).get();
console.log(`   expired doc gone=${!after.exists}  live doc kept=${liveAfter.exists}`);

console.log('6. cleanup');
await db!.collection('botTweets').doc(liveId).delete();
await db!.collection('botTweets').doc(expiredId).delete();
console.log('   removed');

const ok = Boolean(live) && !expiredVisible && !after.exists && liveAfter.exists && purged >= 1;
console.log(ok ? '\nStorage round trip OK.' : '\nFAILED — see the checks above.');
if (!ok) process.exit(1);
