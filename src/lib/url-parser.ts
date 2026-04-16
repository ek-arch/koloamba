// URL parser — extract platform + post ID from a submission URL.
// Add parsers here as new platforms are supported (reddit, youtube, ...).

import type { Platform } from '@/types';

export interface ParsedUrl {
  platform: Platform;
  postId: string;
  authorHandle: string | null;  // e.g. twitter handle of the tweet author, when URL includes it
  canonicalUrl: string;         // normalized URL
}

export class UrlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlParseError';
  }
}

// Twitter / X URLs:
//   https://twitter.com/{handle}/status/{id}
//   https://x.com/{handle}/status/{id}
//   https://mobile.twitter.com/{handle}/status/{id}
// Handles: can contain photo/video suffix paths — we strip them.
const X_URL_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:\/.*)?(?:\?.*)?$/i;

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

export function parseSubmissionUrl(url: string): ParsedUrl {
  const trimmed = url.trim();
  if (!trimmed) throw new UrlParseError('URL is empty');

  // Route to platform-specific parser. For Phase 2 we only support X.
  if (/^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\//i.test(trimmed)) {
    return parseX(trimmed);
  }

  throw new UrlParseError('Unsupported platform. Only X/Twitter URLs are accepted.');
}
