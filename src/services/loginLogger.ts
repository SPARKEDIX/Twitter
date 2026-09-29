import type { User as FirebaseUser } from 'firebase/auth';
import { firebaseApp } from '../lib/firebase';

/**
 * Security-first login event logger.
 * Best-effort only: never throws, never blocks sign-in.
 * Stores minimal data under users/{uid}/logins.
 */
async function getPublicIP(): Promise<string | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const r = await fetch('https://api.ipify.org?format=json', { signal: c.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = (await r.json()) as { ip?: unknown };
    return typeof j.ip === 'string' ? j.ip.slice(0, 45) : null;
  } catch {
    return null;
  }
}

export async function logLoginEvent(fbUser: FirebaseUser): Promise<void> {
  try {
    const { collection, addDoc, serverTimestamp, getFirestore } = await import('firebase/firestore');
    const ip = await getPublicIP();
    await addDoc(collection(getFirestore(firebaseApp), 'users', fbUser.uid, 'logins'), {
      uid: fbUser.uid,
      email: fbUser.email ?? null,
      time: serverTimestamp(),
      ip,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      platform: typeof navigator !== 'undefined' ? (navigator as Navigator & { platform?: string }).platform?.slice(0, 100) ?? null : null,
    });
  } catch (e) {
    console.warn('[loginLogger] failed', e);
  }
}
