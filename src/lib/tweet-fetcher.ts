// Tweet engagement fetcher.
//
// Spec §note: "No Twitter API needed — we use tweet engagement scraping (via a
// service like SocialData, TweetScout, or direct scraping)". The scraping
// provider hasn't been chosen yet, so for now this is a stub returning zeros
// — submissions still flow end-to-end, moderators can set scores manually, and
// auto-score becomes meaningful once a provider is wired in here.
//
// When wiring a real provider: implement fetchTweetEngagement to return live
// metrics; everything downstream (scoring, submission insert, dashboard) is
// already hooked up to consume them.

export interface TweetEngagement {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  authorId: string | null;    // for authoritative ownership check; null if unavailable
  authorHandle: string | null;
}

export async function fetchTweetEngagement(tweetId: string): Promise<TweetEngagement> {
  void tweetId;
  return {
    likes: 0,
    retweets: 0,
    replies: 0,
    views: 0,
    authorId: null,
    authorHandle: null,
  };
}
