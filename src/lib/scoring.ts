// Per-platform auto-scoring.
//
//   auto_score = engagement × (1 + credibility_weight)
//
// Engagement is normalized to 0..10 from raw platform signals. Credibility
// weight is normalized to 0..1 from a per-platform "reputation" source.
// Net range ~0..20 per submission; leaderboard caps total_points at 100 so
// ~5 strong posts saturate a user's side of the share equation.
//
//   X         engagement = (likes + rt×2 + replies×1.5 + views×0.01) / 100, cap 10
//             credibility = clamp(twitter_score / 100, 0, 1)
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

function scoreX(e: PostEngagement, twitterScore: number): ScoreBreakdown {
  const raw = e.likes + e.retweets * 2 + e.replies * 1.5 + e.views * 0.01;
  const engagementScore = Math.min(raw / 100, 10);
  const weight = Math.min(Math.max(twitterScore, 0) / 100, 1);
  const autoScore = engagementScore * (1 + weight);
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
