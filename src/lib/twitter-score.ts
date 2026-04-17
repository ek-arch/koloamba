// twitterscore.io API wrapper.
//
// Docs: https://twitterscore.gitbook.io/twitterscore/developers/api-documentation
// GET https://twitterscore.io/api/v1/get_twitter_score?api_key=KEY&username=HANDLE
// → { success: true, username, twitter_id, twitter_score }
//
// Returns null on any error so a failing external API never blocks auth or
// submission flows.

const BASE = process.env.TWITTER_SCORE_API_URL ?? 'https://twitterscore.io/api/v1';
const KEY = process.env.TWITTER_SCORE_API_KEY;

export interface TwitterScoreResult {
  score: number;
  twitterId: string | null;
  raw: unknown;
}

export async function fetchTwitterScore(handle: string): Promise<TwitterScoreResult | null> {
  if (!KEY) return null;
  const clean = handle.replace(/^@/, '').trim();
  if (!clean) return null;

  const url = `${BASE.replace(/\/$/, '')}/get_twitter_score?api_key=${encodeURIComponent(KEY)}&username=${encodeURIComponent(clean)}`;

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[twitter-score] ${clean}: HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      success?: boolean;
      twitter_score?: number;
      twitter_id?: string;
    };
    if (json?.success !== true || typeof json.twitter_score !== 'number') {
      console.warn(`[twitter-score] ${clean}: unexpected response`, json);
      return null;
    }
    return {
      score: json.twitter_score,
      twitterId: json.twitter_id ?? null,
      raw: json,
    };
  } catch (e) {
    console.warn(`[twitter-score] ${clean}: fetch failed`, e);
    return null;
  }
}
