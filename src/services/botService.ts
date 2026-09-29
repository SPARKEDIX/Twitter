export interface BotProfile { id: string; username: string; displayName: string; taste: string; offsetMin: number }

export const BOTS: BotProfile[] = [
  { id: 'bot_01', username: 'ai_desi', displayName: 'AI Desi', taste: 'AI tools, coding, startups', offsetMin: 0 },
  { id: 'bot_02', username: 'antariskh', displayName: 'Antariksh', taste: 'space, ISRO, NASA', offsetMin: 42 },
  { id: 'bot_03', username: 'cricaddaa', displayName: 'CricAdda', taste: 'cricket, IPL', offsetMin: 84 },
  { id: 'bot_04', username: 'paisapoint', displayName: 'Paisa Point', taste: 'finance India, UPI', offsetMin: 126 },
  { id: 'bot_05', username: 'designdalaan', displayName: 'Design Dalaan', taste: 'UI/UX design', offsetMin: 168 },
  { id: 'bot_06', username: 'filmykeeda', displayName: 'Filmy Keeda', taste: 'cinema, no spoilers', offsetMin: 210 },
  { id: 'bot_07', username: 'surtaal', displayName: 'Sur Taal', taste: 'music', offsetMin: 252 },
  { id: 'bot_08', username: 'yatrigyaan', displayName: 'Yatri Gyaan', taste: 'budget travel India', offsetMin: 294 },
  { id: 'bot_09', username: 'swaadlab', displayName: 'Swaad Lab', taste: 'street food, chai', offsetMin: 336 },
  { id: 'bot_10', username: 'pixelkhel', displayName: 'Pixel Khel', taste: 'gaming India', offsetMin: 378 },
];

export const BOT_INTERVAL_MS = 7 * 60 * 60 * 1000;
export const REAL_USER_TARGET = 500;

export function botEnabled(): boolean {
  try { return (import.meta.env.VITE_BOT_ENABLED as string | undefined) === 'true'; }
  catch { return false; }
}

export function shouldUseBot(realUserCount: number | null): boolean {
  if (!botEnabled()) return false;
  if (realUserCount == null) return false;
  return realUserCount < REAL_USER_TARGET;
}

export function isBotUsername(username: string): boolean {
  return BOTS.some((b) => b.username === username);
}

function lastKey(id: string): string { return 'bot:lastTweet:' + id; }
function getLast(id: string): number { try { return Number(localStorage.getItem(lastKey(id)) || 0); } catch { return 0; } }
function setLast(id: string, t: number): void { try { localStorage.setItem(lastKey(id), String(t)); } catch { /* ignore */ } }

async function tickBot(bot: BotProfile): Promise<void> {
  const now = Date.now();
  if (now - getLast(bot.id) < BOT_INTERVAL_MS) return;
  try {
    const r = await fetch('/api/bot-tweet?botId=' + bot.id);
    if (!r.ok) return;
    const j = (await r.json()) as { text?: string };
    if (!j.text) return;
    const firestore = await import('firebase/firestore');
    const lib = await import('../lib/firebase');
    await firestore.addDoc(firestore.collection(firestore.getFirestore(lib.firebaseApp), 'tweets'), { authorId: bot.id, authorUsername: bot.username, authorName: bot.displayName, content: j.text.slice(0, 280), createdAt: firestore.serverTimestamp(), likesCount: 0, retweetsCount: 0, repliesCount: 0, bot: true, taste: bot.taste });
    setLast(bot.id, now);
  } catch (e) { console.warn('[bots] tick failed for ' + bot.id, e); }
}

export function startBotEngine(realUserCount: number | null): () => void {
  if (!shouldUseBot(realUserCount)) return () => undefined;
  const now = Date.now();
  const timers: number[] = [];
  for (const bot of BOTS) {
    if (now - getLast(bot.id) >= BOT_INTERVAL_MS) {
      timers.push(window.setTimeout(() => { void tickBot(bot); }, Math.min(bot.offsetMin * 60 * 1000, BOT_INTERVAL_MS)));
    }
  }
  const iv = window.setInterval(() => { if (!botEnabled()) return; for (const bot of BOTS) void tickBot(bot); }, 15 * 60 * 1000);
  return () => { timers.forEach((t) => clearTimeout(t)); clearInterval(iv); };
}
