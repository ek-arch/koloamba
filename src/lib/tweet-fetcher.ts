// Tweet engagement fetcher — socialdata.tools.
//
// Docs: https://docs.socialdata.tools/reference/get-tweet
// GET https://api.socialdata.tools/twitter/tweets/{id}
//   Authorization: Bearer <key>
// Response: favorite_count, retweet_count, reply_count, views_count,
//           user.screen_name, user.id_str.
//
// Returns zeros + nulls on any failure so submissions always flow; moderators
// can override manually.

const KEY = process.env.SOCIALDATA_API_KEY;
const BASE = process.env.SOCIALDATA_API_URL ?? 'https://api.socialdata.tools';

export interface TweetEngagement {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  authorId: string | null;    // for authoritative ownership check; null if unavailable
  authorHandle: string | null;
}

const EMPTY: TweetEngagement = {
  likes: 0,
  retweets: 0,
  replies: 0,
  views: 0,
  authorId: null,
  authorHandle: null,
};

interface SocialDataTweet {
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  views_count?: number;
  user?: { id_str?: string; screen_name?: string };
}

export async function fetchTweetEngagement(tweetId: string): Promise<TweetEngagement> {
  if (!KEY) return EMPTY;
  if (!/^\d+$/.test(tweetId)) return EMPTY;

  const url = `${BASE.replace(/\/$/, '')}/twitter/tweets/${tweetId}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[tweet-fetcher] ${tweetId}: HTTP ${res.status}`);
      return EMPTY;
    }
    const json = (await res.json()) as SocialDataTweet;
    return {
      likes:    Number(json.favorite_count ?? 0),
      retweets: Number(json.retweet_count  ?? 0),
      replies:  Number(json.reply_count    ?? 0),
      views:    Number(json.views_count    ?? 0),
      authorId:     json.user?.id_str      ?? null,
      authorHandle: json.user?.screen_name ?? null,
    };
  } catch (e) {
    console.warn(`[tweet-fetcher] ${tweetId}: fetch failed`, e);
    return EMPTY;
  }
}
