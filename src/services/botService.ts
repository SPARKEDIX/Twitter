/**
 * Bot directory (client-safe).
 * Secret BOT_API_KEY never touches the browser - generation runs in Cloud Functions.
 * Client only reads real + bot tweets from Firestore and checks the 500-user gate.
 */
export interface BotProfile {
  id: string;
  username: string;
  displayName: string;
  taste: string;
  queries: string[];
  offsetMin: number;
}

export const BOTS: BotProfile[] = [
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
