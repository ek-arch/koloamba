// Reddit engagement fetcher — public JSON endpoints, no auth.
//
// Post metrics:  GET https://www.reddit.com/comments/{id}.json → .data.children[0].data
//                fields: ups, score, num_comments, author, subreddit
// Comment:       GET https://www.reddit.com/r/{sub}/comments/{post}/comment/{cmt}.json
//                → first children[0] is the post, children[1] is the comment thread
//
// All requests send a descriptive User-Agent (required by Reddit ToS). Returns
// zeros / nulls on any failure so submissions always flow; moderators can fill in.

const USER_AGENT = 'kolo-ambassador/1.0 (+https://koloamba.vercel.app)';

export interface RedditPostEngagement {
  likes: number; // ups
  replies: number; // num_comments
  authorHandle: string | null;
  authorId: string | null;
}

const EMPTY_POST: RedditPostEngagement = {
  likes: 0,
  replies: 0,
  authorHandle: null,
  authorId: null,
};

interface RedditListing<T> {
  data?: { children?: { data?: T }[] };
}
interface RedditPostData {
  ups?: number;
  score?: number;
  num_comments?: number;
  author?: string;
  author_fullname?: string;
  id?: string;
}
interface RedditCommentData {
  ups?: number;
  score?: number;
  author?: string;
  author_fullname?: string;
  replies?: RedditListing<RedditCommentData> | string;
}

/**
 * Fetch engagement for a Reddit post or comment.
 *
 * @param postId  base36 post id (e.g. "1a2b3c")
 * @param commentId optional — when set we fetch the comment's thread
 */
export async function fetchRedditPost(
  postId: string,
  commentId?: string | null,
): Promise<RedditPostEngagement> {
  const url = commentId
    ? `https://www.reddit.com/comments/${postId}/_/${commentId}.json?limit=1&depth=0`
    : `https://www.reddit.com/comments/${postId}.json?limit=1&depth=0`;

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[reddit-fetcher] ${postId}: HTTP ${res.status}`);
      return EMPTY_POST;
    }
    const json = (await res.json()) as RedditListing<RedditPostData>[];
    if (!Array.isArray(json) || json.length === 0) return EMPTY_POST;

    if (commentId) {
      // json[0] = post listing, json[1] = comment listing
      const commentListing = json[1] as unknown as RedditListing<RedditCommentData> | undefined;
      const cmt = commentListing?.data?.children?.[0]?.data;
      if (!cmt) return EMPTY_POST;
      const replyCount =
        typeof cmt.replies === 'object' && cmt.replies?.data?.children
          ? cmt.replies.data.children.length
          : 0;
      return {
        likes: Number(cmt.ups ?? cmt.score ?? 0),
        replies: replyCount,
        authorHandle: cmt.author ?? null,
        authorId: cmt.author_fullname ?? null,
      };
    }

    const post = json[0]?.data?.children?.[0]?.data;
    if (!post) return EMPTY_POST;
    return {
      likes: Number(post.ups ?? post.score ?? 0),
      replies: Number(post.num_comments ?? 0),
      authorHandle: post.author ?? null,
      authorId: post.author_fullname ?? null,
    };
  } catch (e) {
    console.warn(`[reddit-fetcher] ${postId}: fetch failed`, e);
    return EMPTY_POST;
  }
}

