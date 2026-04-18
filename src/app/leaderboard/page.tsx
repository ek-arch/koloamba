import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { AutoRefresh } from '@/components/leaderboard/AutoRefresh';
import type { Campaign, LeaderboardRow } from '@/types';

export const revalidate = 0;

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
    <main className="section-block" style={{ borderBottom: 'none' }}>
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: 32 }}>
          <div className="eyebrow">leaderboard · live</div>
          <h2 className="section-title">
            Who&apos;s <em>earning</em> right now.
          </h2>
        </div>
        <p className="section-lede" style={{ marginTop: -16, marginBottom: 32 }}>
          Updated continuously from X. Ranked by weighted score (points × tier multiplier).
          {pool > 0 && <> Current reward pool: ${pool.toLocaleString('en-US')}.</>}
        </p>

        <LeaderboardTable
          rows={rows}
          totalWeighted={totalWeighted}
          pool={pool}
          currentUserId={session?.user?.id}
        />

        <AutoRefresh />
      </div>
    </main>
  );
}
