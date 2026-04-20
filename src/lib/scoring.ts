// Per-platform auto-scoring.
//
//   auto_score = engagement × (1 + credibility_weight × credibility_gain)
//
// Engagement is normalized to 0..10 from raw platform signals. Credibility
// weight is normalized to 0..1 from a per-platform "reputation" source. The
// credibility_gain sets the ceiling of the multiplier (1 + gain) — currently
// 2 for X, giving a max 3× multiplier. Leaderboard caps total_points at 100.
//
//   X         engagement = (likes + rt×2 + replies×1.5 + views×0.01) / 100, cap 10
//             credibility = clamp(twitter_score / 50, 0, 1)    // TS 50 = "elite"
//             gain        = 2                                    // max multiplier 3×
//             → auto_score cap = 30
//   Reddit    engagement = (ups + comments×1.5) / 50, cap 10
//             credibility = 0. Reddit's karma API is rate-limited from cloud
//             IPs and doesn't tell us much about Kolo-topical credibility, so
//             score is pure engagement. Ownership is verified via the linked
//             u/ handle on the dashboard.
//   Telegram  flat 1.0 per post (baseline). No external signal; moderator
//             assigns a quality-graded override in {0.5, 1, 2, 3} in the
//             review queue — cap ~3 keeps Telegram comment-farming from
//             dominating vs. higher-reach X/Reddit posts.

import type { Platform } from '@/types';
import type { PostEngagement } from './post-metrics';

export interface ScoreBreakdown {
  rawEngagement: number;
  engagementScore: number;
  credibilityWeight: number;
  autoScore: number;
  engagementRate: number;
}

export interface CredibilityInputs {
  /** X TwitterScore (0..100). Unused for Reddit/Telegram. */
  twitterScore?: number;
}

const ROUND2 = (n: number) => Number(n.toFixed(2));
const ROUND4 = (n: number) => Number(n.toFixed(4));

export function computeAutoScore(
  engagement: PostEngagement,
  credibility: CredibilityInputs = {},
): ScoreBreakdown {
  switch (engagement.platform) {
    case 'x':        return scoreX(engagement, credibility.twitterScore ?? 0);
    case 'reddit':   return scoreReddit(engagement);
    case 'telegram': return scoreTelegram();
  }
}

// TwitterScore 50 is already hard-earned, so we saturate credibility there
// rather than at 100. The gain of 2 makes a TS-50 ambassador's post worth 3×
// the same engagement from a zero-rep account.
const TWITTER_CREDIBILITY_SATURATION = 50;
const TWITTER_CREDIBILITY_GAIN = 2;

/**
 * The multiplier TwitterScore applies to X post engagement. Exposed as its
 * own helper so the dashboard, leaderboard, and submit page can show users
 * exactly what advantage their TS buys them before they post.
 *
 *   TS 0  → 1.0×
 *   TS 25 → 2.0×
 *   TS 50+ → 3.0×
 */
export function twitterCredibilityMultiplier(twitterScore: number): number {
  const weight = Math.min(
    Math.max(twitterScore, 0) / TWITTER_CREDIBILITY_SATURATION,
    1,
  );
  return 1 + weight * TWITTER_CREDIBILITY_GAIN;
}

function scoreX(e: PostEngagement, twitterScore: number): ScoreBreakdown {
  const raw = e.likes + e.retweets * 2 + e.replies * 1.5 + e.views * 0.01;
  const engagementScore = Math.min(raw / 100, 10);
  const weight = Math.min(
    Math.max(twitterScore, 0) / TWITTER_CREDIBILITY_SATURATION,
    1,
  );
  const autoScore = engagementScore * (1 + weight * TWITTER_CREDIBILITY_GAIN);
  const engagementRate = e.views > 0 ? (e.likes + e.retweets + e.replies) / e.views : 0;
  return {
    rawEngagement:     raw,
    engagementScore,
    credibilityWeight: weight,
    autoScore:         ROUND2(autoScore),
    engagementRate:    ROUND4(engagementRate),
  };
}

function scoreReddit(e: PostEngagement): ScoreBreakdown {
  // Reddit absolute numbers run lower than X; the /50 divisor puts ~50 ups or
  // ~35 ups + 10 comments at the 1.0 engagement mark. No credibility multiplier
  // (see module docstring); auto_score tops out at 10 for very-viral posts
  // where X can reach 20. Moderators can bump via moderator_score when needed.
  const raw = e.likes + e.replies * 1.5;
  const engagementScore = Math.min(raw / 50, 10);
  const autoScore = engagementScore;
  const engagementRate = e.replies > 0 ? e.likes / Math.max(1, e.replies) : 0;
  return {
    rawEngagement:     raw,
    engagementScore,
    credibilityWeight: 0,
    autoScore:         ROUND2(autoScore),
    engagementRate:    ROUND4(engagementRate),
  };
}

function scoreTelegram(): ScoreBreakdown {
  // Telegram groups & comments don't have any public metric we can trust.
  // Credit a flat 1.0 per submitted post; moderator reviews for quality and
  // can bump via moderator_score for exceptional posts.
  return {
    rawEngagement:     0,
    engagementScore:   1,
    credibilityWeight: 0,
    autoScore:         1.0,
    engagementRate:    0,
  };
}

/** Small helper for UI to label the credibility source consistently. */
export function credibilityLabel(platform: Platform): string {
  switch (platform) {
    case 'x':        return 'TwitterScore';
    case 'reddit':   return '—'; // karma no longer weights the score
    case 'telegram': return '—';
  }
}
