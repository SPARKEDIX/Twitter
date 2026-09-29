import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const BOT_MODEL = process.env.BOT_MODEL_ID || 'deepseek-r1-0528:free';
export const BOT_BASE = (process.env.BOT_BASE_URL || 'https://api.literouter.com/v1').replace(/\/$/, '');

interface BotDef { id: string; username: string; displayName: string; taste: string; queries: string[]; offsetMin: number; }
export const BOTS: BotDef[] = [
  { id: 'bot_01', username: 'ai_desi', displayName: 'AI Desi', taste: 'Hindi + English AI tools, coding, startups', queries: ['generative AI coding tools', 'small language models'], offsetMin: 0 },
  { id: 'bot_02', username: 'antariskh', displayName: 'Antariksh', taste: 'space, ISRO, NASA, rockets', queries: ['ISRO latest launch', 'NASA Artemis news'], offsetMin: 42 },
  { id: 'bot_03', username: 'cricaddaa', displayName: 'CricAdda', taste: 'cricket, IPL, stats, Hinglish banter', queries: ['IPL latest news', 'India cricket score'], offsetMin: 84 },
  { id: 'bot_04', username: 'paisapoint', displayName: 'Paisa Point', taste: 'personal finance India, UPI, mutual funds', queries: ['RBI repo rate news', 'Nifty sensex today'], offsetMin: 126 },
  { id: 'bot_05', username: 'designdalaan', displayName: 'Design Dalaan', taste: 'UI/UX, typography, minimal web design', queries: ['web design trends 2026', 'typography inspiration'], offsetMin: 168 },
  { id: 'bot_06', username: 'filmykeeda', displayName: 'Filmy Keeda', taste: 'Bollywood + world cinema, reviews, no spoilers', queries: ['Bollywood box office news', 'best films 2026'], offsetMin: 210 },
  { id: 'bot_07', username: 'surtaal', displayName: 'Sur Taal', taste: 'music: Bollywood, indie, lo-fi, AR Rahman', queries: ['new indie music India', 'AR Rahman concert'], offsetMin: 252 },
  { id: 'bot_08', username: 'yatrigyaan', displayName: 'Yatri Gyaan', taste: 'budget travel India, trains, hidden places', queries: ['budget travel India places', 'Vande Bharat new routes'], offsetMin: 294 },
  { id: 'bot_09', username: 'swaadlab', displayName: 'Swaad Lab', taste: 'street food, recipes, chai, regional dishes', queries: ['Indian street food recipes', 'best chai spots Delhi'], offsetMin: 336 },
  { id: 'bot_10', username: 'pixelkhel', displayName: 'Pixel Khel', taste: 'gaming India: BGMI, Valorant, mobile esports', queries: ['BGMI tournament news', 'Valorant patch notes'], offsetMin: 378 },
];
const SEVEN_H = 7 * 60 * 60 * 1000;

async function ddgResearch(query: string): Promise<string> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1', { signal: c.signal, headers: { 'User-Agent': 'twiettfarm-bot/1.0' } });
    clearTimeout(t);
    if (!r.ok) return '';
    const j = (await r.json()) as { AbstractText?: string; RelatedTopics?: Array<{ Text?: string }> };
    const bits = [j.AbstractText || '', ...((j.RelatedTopics || []).slice(0, 3).map((x) => x.Text || ''))].join(' ').trim();
    return bits.slice(0, 800);
  } catch { return ''; }
}

async function llmTweet(bot: BotDef, context: string): Promise<string | null> {
  const key = process.env.BOT_API_KEY;
  if (!key) return null;
  const prompt = 'You are @' + bot.username + ' (' + bot.displayName + '). Taste: ' + bot.taste + '.\nContext from DuckDuckGo: ' + (context || 'none') + '\nWrite ONE original tweet (max 260 chars, no hashtags spam, no @mentions, English with light Hinglish allowed). Return only the tweet text.';
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 30000);
    const r = await fetch(BOT_BASE + '/chat/completions', {
      method: 'POST', signal: c.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: BOT_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 160, temperature: 0.9 }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = j.choices?.[0]?.message?.content?.trim() || '';
    return text ? text.slice(0, 280) : null;
  } catch { return null; }
}

export const bottweets = onSchedule({ schedule: 'every 15 minutes', timeZone: 'Asia/Kolkata' }, async () => {
  const db = getFirestore();
  const now = Date.now();
  for (const bot of BOTS) {
    const stateRef = db.doc('botState/' + bot.id);
    const snap = await stateRef.get();
    const last = (snap.data()?.lastTweetAt as number | undefined) ?? 0;
    const firstDue = now - bot.offsetMin * 60 * 1000;
    if (last !== 0 && now - last < SEVEN_H) continue;
    if (last === 0 && Date.now() < firstDue + SEVEN_H - SEVEN_H) { /* first stagger via offset */ }
    if (last === 0) {
      const created = (snap.data()?.createdOffset as boolean | undefined) ?? false;
      if (!created && bot.offsetMin > 0) {
        const minsSinceDeploy = 0;
        if (minsSinceDeploy < bot.offsetMin) continue;
      }
    }
    const q = bot.queries[Math.floor(Math.random() * bot.queries.length)];
    const ctx = await ddgResearch(q);
    const text = await llmTweet(bot, ctx);
    if (!text) continue;
    await db.collection('tweets').add({
      authorId: bot.id, authorUsername: bot.username, authorName: bot.displayName,
      content: text, createdAt: FieldValue.serverTimestamp(), likesCount: 0,
      retweetsCount: 0, repliesCount: 0, bot: true, taste: bot.taste,
    });
    await stateRef.set({ lastTweetAt: now, lastQuery: q }, { merge: true });
  }
});
