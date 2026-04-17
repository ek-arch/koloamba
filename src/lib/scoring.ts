// Auto-scoring (spec §5.3).
//
//   engagement_score = normalize(likes×1 + retweets×2 + replies×1.5 + views×0.01)
//   submission_score = engagement_score × (1 + twitter_score_weight)
//
// Normalization choice: divide raw engagement by 100 and cap at 10. TwitterScore
// (0..100 from twitterscore.io) is normalized to 0..1. Net range ~0..20 per
// submission; total_points is capped at 100 in the leaderboard view, so this
// leaves room for ~5 strong posts before saturation.

import type { TweetEngagement } from './tweet-fetcher';

export interface ScoreBreakdown {
  rawEngagement: number;
  engagementScore: number;
  twitterScoreWeight: number;
  autoScore: number;
  engagementRate: number;
}

export function computeAutoScore(
  engagement: TweetEngagement,
  twitterScore: number,
): ScoreBreakdown {
  const { likes, retweets, replies, views } = engagement;
  const raw = likes + retweets * 2 + replies * 1.5 + views * 0.01;
  const engagementScore = Math.min(raw / 100, 10);
  const weight = Math.min(Math.max(twitterScore, 0) / 100, 1);
  const autoScore = engagementScore * (1 + weight);
  const engagementRate = views > 0 ? (likes + retweets + replies) / views : 0;
  return {
    rawEngagement: raw,
    engagementScore,
    twitterScoreWeight: weight,
    autoScore: Number(autoScore.toFixed(2)),
    engagementRate: Number(engagementRate.toFixed(4)),
  };
}
