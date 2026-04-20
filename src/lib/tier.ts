// Single source of truth for tier computation from a KOLO balance.
//
// Thresholds + multipliers match the tier_config seed in
// supabase/migrations/2026_04_20_retune_tiers.sql. If you change either side,
// change both — the DB table drives display/queries in SQL views, this module
// drives the API write-path when we upsert tier on a handle-link event.

import type { Tier } from '@/types';

export interface TierAssignment {
  tier: Tier;
  multiplier: number;
}

export function tierFromBalance(balance: number): TierAssignment {
  if (balance >= 50000) return { tier: 'gold',   multiplier: 1.7 };
  if (balance >= 2000)  return { tier: 'silver', multiplier: 1.3 };
  return { tier: 'bronze', multiplier: 1.0 };
}

/** Upper bound of a tier's KOLO range (used by dashboard progress bar). */
export const TIER_UPPER: Record<Tier, number> = {
  bronze: 2000,
  silver: 50000,
  gold:   1_000_000, // no real ceiling; used only for progress-bar scaling
};
