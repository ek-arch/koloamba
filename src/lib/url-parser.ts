// URL parser — extract platform + post ID from a submission URL.
//
// Supported platforms (see src/lib/post-metrics.ts for how each is scored):
//   - x        twitter.com / x.com / mobile.twitter.com
//   - reddit   reddit.com/r/{sub}/comments/{id}/... (plus www/old/new/m subdomains)
//   - telegram t.me/{channel}/{msg}  or  t.me/c/{group}/{msg} (private groups)

import type { Platform } from '@/types';

export interface ParsedUrl {
  platform: Platform;
  /** Stable identifier used for duplicate detection (post_id). */
  postId: string;
  /**
   * Author handle extracted from the URL, when the URL embeds one.
   * - X: screen name segment (/{handle}/status/...)
   * - Reddit: null (a post URL identifies a subreddit, not an author)
   * - Telegram: channel/group name (public channels only; null for t.me/c/...)
   */
  authorHandle: string | null;
  /** Normalized canonical URL stored in DB. */
  canonicalUrl: string;
}

export class UrlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlParseError';
  }
}

// ---------- X / Twitter ----------
const X_URL_RE =
  /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:\/.*)?(?:\?.*)?$/i;

export function parseX(url: string): ParsedUrl {
  const m = url.match(X_URL_RE);
  if (!m) throw new UrlParseError('Not a valid X/Twitter status URL');
  const [, handle, postId] = m;
  return {
    platform: 'x',
    postId,
    authorHandle: handle,
    canonicalUrl: `https://x.com/${handle}/status/${postId}`,
  };
}

// ---------- Reddit ----------
// Accepts:
//   https://www.reddit.com/r/{sub}/comments/{id}/{slug?}/...
//   https://reddit.com/r/{sub}/comments/{id}
//   https://old.reddit.com/... , https://new.reddit.com/... , https://m.reddit.com/...
//   https://redd.it/{id}  (short form)
//   https://www.reddit.com/r/{sub}/comments/{postId}/comment/{commentId}  → postId+'_'+commentId
//   https://www.reddit.com/user/{handle}/comments/{id}/{slug?}/...        (profile-routed view)
const REDDIT_POST_RE =
  /^https?:\/\/(?:www\.|old\.|new\.|m\.|np\.)?reddit\.com\/(r|user|u)\/([A-Za-z0-9_-]+)\/comments\/([a-z0-9]+)(?:\/[^/?#]*)?(?:\/comment\/([a-z0-9]+))?(?:[\/?#].*)?$/i;
const REDDIT_SHORT_RE = /^https?:\/\/redd\.it\/([a-z0-9]+)(?:[\/?#].*)?$/i;

export function parseReddit(url: string): ParsedUrl {
  const mPost = url.match(REDDIT_POST_RE);
  if (mPost) {
    const [, kind, name, postId, commentId] = mPost;
    // Profile-routed URLs (/user/{h}/ or /u/{h}/) are mirrored on Reddit at
    // /r/u_{h}/. Normalize to that subreddit form so canonical URLs and
    // metric fetches don't try to use the handle as a subreddit.
    const sub = kind.toLowerCase() === 'r' ? name : `u_${name}`;
    const compositeId = commentId ? `${postId}_${commentId}` : postId;
    const canonical = commentId
      ? `https://www.reddit.com/r/${sub}/comments/${postId}/comment/${commentId}`
      : `https://www.reddit.com/r/${sub}/comments/${postId}/`;
    return {
      platform: 'reddit',
      postId: compositeId,
      authorHandle: null,
      canonicalUrl: canonical,
    };
  }

  const mShort = url.match(REDDIT_SHORT_RE);
  if (mShort) {
    const [, postId] = mShort;
    return {
      platform: 'reddit',
      postId,
      authorHandle: null,
      canonicalUrl: `https://redd.it/${postId}`,
    };
  }

  throw new UrlParseError('Not a valid Reddit post URL');
}

// ---------- Telegram ----------
// Public channel/group message:   https://t.me/{channel}/{msgId}
// Private (linked by id):         https://t.me/c/{groupId}/{msgId}
// Comment thread:                 https://t.me/{channel}/{msgId}?comment={cmtId}
// Optional ?embed=1, ?single etc. are stripped.
const TG_PUBLIC_RE =
  /^https?:\/\/t\.me\/([A-Za-z][A-Za-z0-9_]{3,31})\/(\d{1,20})(?:\?.*)?$/i;
const TG_PRIVATE_RE = /^https?:\/\/t\.me\/c\/(\d{3,20})\/(\d{1,20})(?:\?.*)?$/i;

export function parseTelegram(url: string): ParsedUrl {
  const pub = url.match(TG_PUBLIC_RE);
  if (pub) {
    const [, channel, msgId] = pub;
    // Preserve ?comment=... in postId so the same base message + different
    // comments count as separate submissions.
    const commentMatch = url.match(/[?&]comment=(\d+)/);
    const postId = commentMatch ? `${channel}_${msgId}_c${commentMatch[1]}` : `${channel}_${msgId}`;
    const canonical = commentMatch
      ? `https://t.me/${channel}/${msgId}?comment=${commentMatch[1]}`
      : `https://t.me/${channel}/${msgId}`;
    return {
      platform: 'telegram',
      postId,
      authorHandle: channel,
      canonicalUrl: canonical,
    };
  }

  const priv = url.match(TG_PRIVATE_RE);
  if (priv) {
    const [, groupId, msgId] = priv;
    return {
      platform: 'telegram',
      postId: `c${groupId}_${msgId}`,
      authorHandle: null,
      canonicalUrl: `https://t.me/c/${groupId}/${msgId}`,
    };
  }

  throw new UrlParseError('Not a valid Telegram URL (expected t.me/{channel}/{id})');
}

// ---------- Router ----------
export function parseSubmissionUrl(url: string): ParsedUrl {
  const trimmed = url.trim();
  if (!trimmed) throw new UrlParseError('URL is empty');

  if (/^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\//i.test(trimmed)) return parseX(trimmed);
  if (/^https?:\/\/(?:www\.|old\.|new\.|m\.|np\.)?reddit\.com\//i.test(trimmed)) return parseReddit(trimmed);
  if (/^https?:\/\/redd\.it\//i.test(trimmed)) return parseReddit(trimmed);
  if (/^https?:\/\/t\.me\//i.test(trimmed)) return parseTelegram(trimmed);

  throw new UrlParseError(
    'Unsupported URL. Paste an X (twitter.com / x.com), Reddit (reddit.com), or Telegram (t.me) link.',
  );
}

/** Cheap platform sniff for UI auto-highlighting without throwing. */
export function detectPlatformFromUrl(url: string): Platform | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\//i.test(t)) return 'x';
  if (/^https?:\/\/(?:www\.|old\.|new\.|m\.|np\.)?reddit\.com\//i.test(t) || /^https?:\/\/redd\.it\//i.test(t))
    return 'reddit';
  if (/^https?:\/\/t\.me\//i.test(t)) return 'telegram';
  return null;
}
