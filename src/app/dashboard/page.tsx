import { getCurrentUser } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { StatCard } from '@/components/ui/StatCard';
import { projectReward, formatUsd, formatPercent } from '@/lib/rewards';
import type { Campaign, LeaderboardRow } from '@/types';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    // Shouldn't happen — layout already redirects. Render a safe fallback.
    return <p className="text-muted">User record not found. Sign in again.</p>;
  }

  const admin = supabaseAdmin();

  // Pull: my leaderboard row + everyone's weighted totals + active campaign
  const [myRow, board, campaign] = await Promise.all([
    admin.from('leaderboard').select('*').eq('id', user.id).maybeSingle(),
    admin.from('leaderboard').select('weighted_score'),
    admin
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const me = (myRow.data as LeaderboardRow | null) ?? {
    id: user.id,
    twitter_handle: user.twitter_handle,
    twitter_name: user.twitter_name,
    twitter_avatar_url: user.twitter_avatar_url,
    tier: user.tier,
    tier_multiplier: Number(user.tier_multiplier),
    twitter_score: Number(user.twitter_score),
    total_points: 0,
    weighted_score: 0,
    approved_submissions: 0,
  };

  const totalWeighted =
    (board.data as { weighted_score: number }[] | null)?.reduce(
      (sum, r) => sum + Number(r.weighted_score),
      0,
    ) ?? 0;

  const pool = Number((campaign.data as Campaign | null)?.pool_amount ?? 0);
  const reward = projectReward(Number(me.weighted_score), totalWeighted, pool);

  return (
    <div className="space-y-6">
      <ProfileCard user={user} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total points"
          value={Number(me.total_points).toFixed(0)}
          sublabel={`capped at 100`}
        />
        <StatCard
          label="Weighted score"
          value={Number(me.weighted_score).toFixed(1)}
          sublabel={`× ${Number(user.tier_multiplier).toFixed(1)} tier multiplier`}
        />
        <StatCard
          label="Approved posts"
          value={me.approved_submissions}
        />
        <StatCard
          label="Projected reward"
          value={formatUsd(reward.amount)}
          sublabel={`${formatPercent(reward.share)} of ${formatUsd(reward.pool)} pool`}
          accent
        />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold">Next step</h3>
        <p className="mt-1 text-sm text-muted">
          Paste a tweet URL to add a new submission. Metrics are fetched automatically; a
          moderator will review and approve.
        </p>
        <div className="mt-4">
          <a href="/dashboard/submit" className="btn-primary">Submit a post</a>
        </div>
      </div>
    </div>
  );
}
