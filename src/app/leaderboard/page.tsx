import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { AutoRefresh } from '@/components/leaderboard/AutoRefresh';
import type { LeaderboardRow } from '@/types';

export const revalidate = 0;

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const admin = supabaseAdmin();

  const { data: board } = await admin.from('leaderboard').select('*');

  const rows = (board as LeaderboardRow[] | null) ?? [];
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
        </p>

        <LeaderboardTable
          rows={rows}
          totalWeighted={totalWeighted}
          currentUserId={session?.user?.id}
        />

        <AutoRefresh />
      </div>
    </main>
  );
}
