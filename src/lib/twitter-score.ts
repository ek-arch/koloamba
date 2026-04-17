// twitterscore.io API wrapper.
//
// Fetches a credibility score for an X handle. Used on first sign-in and
// on manual refresh (POST /api/twitter-score/refresh).
//
// Graceful: returns null on any error so a failing external API never blocks
// auth or submission flows. The actual endpoint path/response shape should be
// confirmed against the twitterscore.io docs for the purchased plan — adjust
// `parseScore` if the response JSON differs.

const BASE = process.env.TWITTER_SCORE_API_URL ?? 'https://api.twitterscore.io';
const KEY = process.env.TWITTER_SCORE_API_KEY;

export interface TwitterScoreResult {
  score: number;
  raw: unknown;
}

export async function fetchTwitterScore(handle: string): Promise<TwitterScoreResult | null> {
  if (!KEY) return null;
  const clean = handle.replace(/^@/, '').trim();
  if (!clean) return null;

  const url = `${BASE.replace(/\/$/, '')}/user/${encodeURIComponent(clean)}?api_key=${KEY}`;

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[twitter-score] ${clean}: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const score = parseScore(json);
    if (score == null) return null;
    return { score, raw: json };
  } catch (e) {
    console.warn(`[twitter-score] ${clean}: fetch failed`, e);
    return null;
  }
}

function parseScore(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  const candidates = [obj.score, obj.twitter_score, obj.twitterScore, (obj.data as Record<string, unknown> | undefined)?.score];
  for (const c of candidates) {
    const n = typeof c === 'string' ? Number(c) : typeof c === 'number' ? c : NaN;
    if (Number.isFinite(n)) return n;
  }
  return null;
}
