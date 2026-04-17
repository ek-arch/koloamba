import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import type { Campaign, LeaderboardRow } from '@/types';

export const revalidate = 30;

export default async function LeaderboardPage() {
  const session = await auth();
  const admin = supabaseAdmin();

  const [board, campaign] = await Promise.all([
    admin.from('leaderboard').select('*'),
    admin
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = (board.data as LeaderboardRow[] | null) ?? [];
  const pool = Number((campaign.data as Campaign | null)?.pool_amount ?? 0);
  const totalWeighted = rows.reduce((sum, r) => sum + Number(r.weighted_score), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted">
          Ranked by weighted score (points × tier multiplier). Projected rewards update as
          submissions are approved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="stat-label">Ambassadors</div>
          <div className="stat-number mt-1">{rows.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Total weighted score</div>
          <div className="stat-number mt-1">{totalWeighted.toFixed(1)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Reward pool</div>
          <div className="stat-number mt-1 text-accent">
            {pool > 0 ? `$${pool.toLocaleString('en-US')}` : '—'}
          </div>
        </div>
      </div>

      <LeaderboardTable
        rows={rows}
        totalWeighted={totalWeighted}
        pool={pool}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
