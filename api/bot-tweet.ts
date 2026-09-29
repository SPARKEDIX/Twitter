import type { VercelRequest, VercelResponse } from '@vercel/node';

type BotDef = { username: string; displayName: string; taste: string; queries: string[] };

const BOTS: Record<string, BotDef> = {
  bot_01: { username: 'ai_desi', displayName: 'AI Desi', taste: 'Hindi + English AI tools, coding, startups', queries: ['generative AI coding tools', 'small language models'] },
  bot_02: { username: 'antariskh', displayName: 'Antariksh', taste: 'space, ISRO, NASA, rockets', queries: ['ISRO latest launch', 'NASA Artemis news'] },
  bot_03: { username: 'cricaddaa', displayName: 'CricAdda', taste: 'cricket, IPL, stats, Hinglish banter', queries: ['IPL latest news', 'India cricket score'] },
  bot_04: { username: 'paisapoint', displayName: 'Paisa Point', taste: 'personal finance India, UPI, mutual funds', queries: ['RBI repo rate news', 'Nifty sensex today'] },
  bot_05: { username: 'designdalaan', displayName: 'Design Dalaan', taste: 'UI/UX, typography, minimal web design', queries: ['web design trends 2026', 'typography inspiration'] },
  bot_06: { username: 'filmykeeda', displayName: 'Filmy Keeda', taste: 'Bollywood and world cinema, reviews, no spoilers', queries: ['Bollywood box office news', 'best films 2026'] },
  bot_07: { username: 'surtaal', displayName: 'Sur Taal', taste: 'music: Bollywood, indie, lo-fi', queries: ['new indie music India', 'AR Rahman concert'] },
  bot_08: { username: 'yatrigyaan', displayName: 'Yatri Gyaan', taste: 'budget travel India, trains, hidden places', queries: ['budget travel India places', 'Vande Bharat new routes'] },
  bot_09: { username: 'swaadlab', displayName: 'Swaad Lab', taste: 'street food, recipes, chai', queries: ['Indian street food recipes', 'best chai spots Delhi'] },
  bot_10: { username: 'pixelkhel', displayName: 'Pixel Khel', taste: 'gaming India: BGMI, Valorant, mobile esports', queries: ['BGMI tournament news', 'Valorant patch notes'] },
};

async function ddg(query: string): Promise<string> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1', { signal: c.signal, headers: { 'User-Agent': 'twiettfarm-bot/1.0' } });
    clearTimeout(t);
    if (!r.ok) return '';
    const j = (await r.json()) as { AbstractText?: string; RelatedTopics?: Array<{ Text?: string }> };
    const rel = (j.RelatedTopics || []).slice(0, 3).map((x) => x.Text || '').join(' ');
    return (j.AbstractText || '' + ' ' + rel).trim().slice(0, 800);
  } catch { return ''; }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const botId = String(req.query.botId || '');
  const bot = BOTS[botId];
  if (!bot) { res.status(400).json({ error: 'unknown bot' }); return; }
  const key = process.env.BOT_API_KEY;
  const model = process.env.BOT_MODEL_ID || 'deepseek-r1-0528:free';
  const base = (process.env.BOT_BASE_URL || 'https://api.literouter.com/v1').replace(/\/$/, '');
  if (!key) { res.status(500).json({ error: 'BOT_API_KEY not configured' }); return; }
  const q = bot.queries[Math.floor(Math.random() * bot.queries.length)];
  const ctx = await ddg(q);
  const prompt = 'You are @' + bot.username + ' (' + bot.displayName + '). Taste: ' + bot.taste + '. DuckDuckGo context: ' + (ctx || 'none') + ' Write ONE original tweet (max 260 chars, English with light Hinglish allowed, no hashtag spam, no mentions). Return only the tweet text.';
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 30000);
    const r = await fetch(base + '/chat/completions', { method: 'POST', signal: c.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 160, temperature: 0.9 }) });
    clearTimeout(t);
    if (!r.ok) { res.status(502).json({ error: 'provider failed' }); return; }
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim().slice(0, 280);
    if (!text) { res.status(502).json({ error: 'empty completion' }); return; }
    res.status(200).json({ text });
  } catch { res.status(502).json({ error: 'provider failed' }); }
}
