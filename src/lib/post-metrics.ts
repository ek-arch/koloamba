// Unified post-metrics fetcher — dispatches by platform.
//
// - X         → socialdata.tools (lib/tweet-fetcher)
// - Reddit    → public JSON  (lib/reddit-fetcher)
// - Telegram  → noop. Telegram doesn't expose engagement metrics for
//               group messages / comments, and the preview page for channel
//               posts only shows views (fragile). We leave auto_score=1.0
//               and rely on the moderator to set moderator_score.

import type { Platform } from '@/types';
import type { ParsedUrl } from './url-parser';
import { fetchTweetEngagement } from './tweet-fetcher';
import { fetchRedditPost } from './reddit-fetcher';

export interface PostEngagement {
  platform: Platform;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  /** Author handle if the provider reports one; used for ownership check. */
  authorHandle: string | null;
  /** Stable author id from the provider (e.g. user.id_str on X). */
  authorId: string | null;
  /** True when a real fetch ran; false for platforms we can't auto-measure. */
  fetched: boolean;
}

function empty(platform: Platform): PostEngagement {
  return {
    platform,
    likes: 0,
    retweets: 0,
    replies: 0,
    views: 0,
    authorHandle: null,
    authorId: null,
    fetched: false,
  };
}

export async function fetchPostMetrics(parsed: ParsedUrl): Promise<PostEngagement> {
  switch (parsed.platform) {
    case 'x': {
      const x = await fetchTweetEngagement(parsed.postId);
      return {
        platform: 'x',
        likes:    x.likes,
        retweets: x.retweets,
        replies:  x.replies,
        views:    x.views,
        authorHandle: x.authorHandle,
        authorId:     x.authorId,
        fetched: true,
      };
    }

    case 'reddit': {
      // postId may be "{postId}" or "{postId}_{commentId}" (set by url-parser)
      const [pid, cid] = parsed.postId.split('_');
      const r = await fetchRedditPost(pid, cid);
      return {
        platform: 'reddit',
        likes:    r.likes,       // ups map to "likes" so the DB schema stays uniform
        retweets: 0,             // no analog on reddit
        replies:  r.replies,     // num_comments / reply count
        views:    0,             // reddit doesn't expose views publicly
        authorHandle: r.authorHandle,
        authorId:     r.authorId,
        fetched: true,
      };
    }

    case 'telegram':
      // No auto-fetch — see module docstring above.
      return empty('telegram');
  }
}
