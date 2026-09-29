import { beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

const LOGIN_CAP = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

async function checkBucket(key: string): Promise<void> {
  const ref = db.doc('authRateLimits/' + key);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let tokens = LOGIN_CAP;
    let updatedAt = now;
    if (snap.exists) {
      const d = snap.data() as { tokens?: number; updatedAt?: number };
      tokens = typeof d.tokens === 'number' ? d.tokens : LOGIN_CAP;
      updatedAt = typeof d.updatedAt === 'number' ? d.updatedAt : now;
      tokens = Math.min(LOGIN_CAP, tokens + (now - updatedAt) / (LOGIN_WINDOW_MS / LOGIN_CAP));
    }
    if (tokens < 1) {
      throw new HttpsError('resource-exhausted', 'Too many attempts. Try again later.');
    }
    tx.set(ref, { tokens: tokens - 1, updatedAt: now, expireAt: new Date(now + LOGIN_WINDOW_MS * 2) }, { merge: true });
  });
}

export const authratelimit = beforeUserSignedIn(async (event) => {
  const email = (event.data?.email ?? '').toLowerCase().trim();
  if (!email) return;
  await checkBucket('email:' + hashKey(email));
});
