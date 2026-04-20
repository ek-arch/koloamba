// Shared TypeScript types for the Kolo Ambassador app

export type Tier = 'bronze' | 'silver' | 'gold';
export type Role = 'ambassador' | 'moderator' | 'admin';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type CampaignStatus = 'draft' | 'active' | 'completed';
export type Platform = 'x' | 'reddit' | 'telegram';

export interface User {
  id: string;
  twitter_id: string;
  twitter_handle: string;
  twitter_name: string | null;
  twitter_avatar_url: string | null;
  twitter_score: number;
  twitter_score_updated_at: string | null;
  old_points: number;
  tier: Tier;
  tier_multiplier: number;
  wallet_address: string | null;
  wallet_chain: 'bnb' | 'arbitrum' | 'base' | null;
  wallet_token: 'usdc' | 'usdt' | null;
  telegram_handle: string | null;
  reddit_username: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  platform: Platform;
  post_url: string;
  post_id: string | null;

  likes: number;
  retweets: number;
  replies: number;
  views: number;
  engagement_rate: number;

  auto_score: number;
  moderator_score: number | null;
  final_score: number;

  status: SubmissionStatus;
  moderator_id: string | null;
  moderator_notes: string | null;
  reviewed_at: string | null;

  fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  pool_amount: number;
  max_score: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  created_at: string;
}

export interface LeaderboardRow {
  id: string;
  twitter_handle: string;
  twitter_name: string | null;
  twitter_avatar_url: string | null;
  tier: Tier;
  tier_multiplier: number;
  twitter_score: number;
  total_points: number;
  weighted_score: number;
  approved_submissions: number;
}

export interface TierConfigRow {
  tier: Tier;
  min_old_points: number;
  max_old_points: number | null;
  multiplier: number;
}

// Convention: API routes always return { data, error }
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };
