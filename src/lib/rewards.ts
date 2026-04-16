// Reward math used by the dashboard and admin.
// Formula (spec §5.5):  (my_weighted_score / Σ weighted_scores) × pool

export interface ProjectedReward {
  myWeighted: number;
  totalWeighted: number;
  pool: number;
  share: number;      // fraction 0..1
  amount: number;     // USD
}

export function projectReward(
  myWeighted: number,
  totalWeighted: number,
  pool: number,
): ProjectedReward {
  const share = totalWeighted > 0 ? myWeighted / totalWeighted : 0;
  return {
    myWeighted,
    totalWeighted,
    pool,
    share,
    amount: share * pool,
  };
}

export function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function formatPercent(n: number): string {
  return (n * 100).toLocaleString('en-US', { maximumFractionDigits: 2 }) + '%';
}
