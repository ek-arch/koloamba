import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { PayoutsTable, type PayoutRow } from '@/components/admin/PayoutsTable';

/**
 * Admin-only payouts view. Shows every ambassador with a non-zero weighted
 * score ranked high→low, their projected USD share, chain/token preference,
 * and wallet address. Flags rows with no wallet as "missing". Supports CSV
 * export for batch payout.
 *
 * Gated tighter than other admin pages (admin role only, no moderators) —
 * wallet data is semi-sensitive and payout decisions are finance-adjacent.
 */
export default async function PayoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  if (session.user.role !== 'admin') redirect('/admin/review');

  const admin = supabaseAdmin();

  const [usersRes, leaderboardRes, campaignRes] = await Promise.all([
    admin
      .from('users')
      .select(
        'id, twitter_handle, twitter_name, telegram_handle, tier, tier_multiplier, wallet_address, wallet_chain, wallet_token',
      )
      .eq('role', 'ambassador'),
    admin.from('leaderboard').select('id, total_points, weighted_score'),
    admin
      .from('campaigns')
      .select('name, pool_amount')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const users = usersRes.data ?? [];
  const board = leaderboardRes.data ?? [];
  const pool = Number(campaignRes.data?.pool_amount ?? 0);
  const campaignName = campaignRes.data?.name ?? 'campaign';

  const byId = new Map(board.map((r) => [r.id, r]));
  const totalWeighted = board.reduce((s, r) => s + Number(r.weighted_score), 0);

  const rows: PayoutRow[] = users
    .map((u) => {
      const lb = byId.get(u.id);
      const weighted = Number(lb?.weighted_score ?? 0);
      const share =
        totalWeighted > 0 && pool > 0 ? (weighted / totalWeighted) * pool : 0;
      return {
        id:              u.id,
        twitterHandle:   u.twitter_handle,
        twitterName:     u.twitter_name,
        telegramHandle:  u.telegram_handle,
        tier:            u.tier,
        tierMultiplier:  Number(u.tier_multiplier),
        totalPoints:     Number(lb?.total_points ?? 0),
        weightedScore:   weighted,
        projectedShare:  share,
        walletAddress:   u.wallet_address,
        walletChain:     u.wallet_chain,
        walletToken:     u.wallet_token,
      };
    })
    .filter((r) => r.weightedScore > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="mt-1 text-muted">
          {rows.length} ambassador{rows.length === 1 ? '' : 's'} with points
          this campaign. Pool ${pool.toLocaleString()}.
        </p>
      </div>

      <PayoutsTable rows={rows} campaignName={campaignName} />
    </div>
  );
}
