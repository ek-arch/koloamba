import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { RewardCalculator } from '@/components/dashboard/RewardCalculator';
import { SocialLinksCard } from '@/components/dashboard/SocialLinksCard';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { TIER_UPPER } from '@/lib/tier';
import { twitterCredibilityMultiplier } from '@/lib/scoring';
import type { WalletChain, WalletToken } from '@/lib/wallet';
import type { Campaign, LeaderboardRow, Platform, Submission, Tier } from '@/types';

export const revalidate = 0;

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

const PLATFORM_LABEL: Record<Platform, string> = {
  x:        'X',
  reddit:   'Reddit',
  telegram: 'Telegram',
};

function nextTier(current: Tier): Tier | null {
  if (current === 'bronze') return 'silver';
  if (current === 'silver') return 'gold';
  return null;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted">User record not found. Sign in again.</p>
      </main>
    );
  }

  const admin = supabaseAdmin();
  const [myRow, board, campaign, mySubs, balanceRow] = await Promise.all([
    admin.from('leaderboard').select('*').eq('id', user.id).maybeSingle(),
    admin.from('leaderboard').select('id, weighted_score'),
    admin
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('submissions')
      .select('id, post_url, auto_score, moderator_score, final_score, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    // Kolo mini-app balance snapshot, looked up by the user's linked Telegram handle.
    // Returns null if they haven't linked a handle yet, or if their handle isn't in
    // the snapshot (never touched the mini-app, or linked the wrong handle).
    user.telegram_handle
      ? admin
          .from('kolo_balances')
          .select('token_balance')
          .ilike('telegram_handle', user.telegram_handle)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const me =
    (myRow.data as LeaderboardRow | null) ?? {
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

  const board_rows = (board.data as { id: string; weighted_score: number }[] | null) ?? [];
  const totalCount = board_rows.length;
  const totalWeighted = board_rows.reduce((s, r) => s + Number(r.weighted_score), 0);
  const myWeighted = Number(me.weighted_score);
  const sigmaOthers = Math.max(0, totalWeighted - myWeighted);

  // Rank: position within the full leaderboard, by weighted_score desc
  const sortedIds = [...board_rows]
    .sort((a, b) => Number(b.weighted_score) - Number(a.weighted_score))
    .map((r) => r.id);
  const rankIdx = sortedIds.indexOf(user.id);
  const myRank = rankIdx >= 0 ? rankIdx + 1 : totalCount + 1;

  const pool = Number((campaign.data as Campaign | null)?.pool_amount ?? 0);
  const myDenom = sigmaOthers + myWeighted;
  const projected = myDenom > 0 && pool > 0 ? (myWeighted / myDenom) * pool : 0;

  const submissions = (mySubs.data as Submission[] | null) ?? [];
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
  const totalApprovedScore = submissions
    .filter((s) => s.status === 'approved')
    .reduce((a, b) => a + Number(b.final_score ?? 0), 0);

  const upperBound = TIER_UPPER[user.tier];
  const tierFill = Math.min(100, (Number(user.old_points) / upperBound) * 100);
  const next = nextTier(user.tier);

  // First 6 in the table, link to full page for the rest
  const rowsToShow = submissions.slice(0, 6);

  function statusLabel(s: Submission['status']) {
    return s;
  }

  function shortText(url: string) {
    // Strip protocol + common host prefix for a tidier cell.
    return url
      .replace(/^https?:\/\/(www\.|mobile\.|old\.|new\.|m\.|np\.)?(x|twitter|reddit)\.com\//, '')
      .replace(/^https?:\/\/t\.me\//, '')
      .replace(/^https?:\/\/redd\.it\//, '')
      .slice(0, 100);
  }

  return (
    <main className="section-block" style={{ borderBottom: 'none' }}>
      <div className="wrap">
        {/* ----- Section head ----- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 24,
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="eyebrow">your dashboard</div>
            <h2 className="section-title" style={{ marginTop: 12 }}>
              hi, @{user.twitter_handle}.
            </h2>
          </div>
          <Link href="/dashboard/submit" className="btn btn-primary btn-lg">
            Submit a post +
          </Link>
        </div>

        {/* ----- Hero cards: rank + tier ----- */}
        <div className="dash-hero">
          <div className="dash-card">
            <div className="ring" aria-hidden />
            <div className="dash-label">Current rank</div>
            <div className="dash-big">
              #{myRank}
              <small>of {totalCount.toLocaleString()}</small>
            </div>
            <div className="dash-sub">
              <div>
                <div className="k">Weighted score</div>
                <div className="v">{myWeighted.toFixed(1)}</div>
              </div>
              <div>
                <div className="k">Projected reward</div>
                <div className="v" style={{ color: 'var(--accent)' }}>
                  {pool > 0 ? `$${projected.toFixed(0)}` : '—'}
                </div>
              </div>
              <div>
                <div className="k">TwitterScore</div>
                <div className="v">
                  {Number(user.twitter_score).toFixed(0)}
                  <span
                    style={{
                      fontSize: 16,
                      marginLeft: 8,
                      color: 'var(--muted)',
                      fontWeight: 400,
                    }}
                  >
                    ×{twitterCredibilityMultiplier(Number(user.twitter_score)).toFixed(1)} on X
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-label">Tier · {TIER_LABEL[user.tier]}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span
                style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.035em' }}
              >
                {Number(user.tier_multiplier).toFixed(1)}×
              </span>
              <span className="text-muted" style={{ fontSize: 14 }}>
                on every point
              </span>
            </div>
            <div className="tier-progress">
              <div className="tier-meta">
                <span>{Number(user.old_points).toLocaleString()} KOLO</span>
                <span>
                  {next
                    ? `${upperBound.toLocaleString()} to ${TIER_LABEL[next].toLowerCase()}`
                    : 'top tier'}
                </span>
              </div>
              <div className="tier-bar">
                <div className="tier-bar-fill" style={{ width: `${tierFill}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ----- Social links (Telegram token balance + Reddit handle) ----- */}
        <div style={{ marginTop: 24 }}>
          <SocialLinksCard
            telegramHandle={user.telegram_handle}
            tokenBalance={
              balanceRow?.data ? Number(balanceRow.data.token_balance) : null
            }
            redditUsername={user.reddit_username}
          />
        </div>

        {/* ----- Payout wallet ----- */}
        <div style={{ marginTop: 24 }}>
          <WalletCard
            initialAddress={user.wallet_address}
            initialChain={user.wallet_chain as WalletChain | null}
            initialToken={user.wallet_token as WalletToken | null}
          />
        </div>

        {/* ----- Submissions + Calculator ----- */}
        <div className="dash-split">
          <div className="submissions">
            <div className="submissions-head">
              <h3>Your submissions</h3>
              <div className="mono-sm">
                <span style={{ color: '#1db954' }}>●</span> {approvedCount} approved ·
                <span style={{ color: '#e5b547', marginLeft: 8 }}>●</span> {pendingCount} pending ·
                <span style={{ color: '#d94a4a', marginLeft: 8 }}>●</span> {rejectedCount} rejected
              </div>
            </div>

            {submissions.length === 0 ? (
              <div
                style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}
              >
                No submissions yet. Paste a tweet URL to get started.
              </div>
            ) : (
              rowsToShow.map((s) => {
                const created = new Date(s.created_at);
                const dateLabel = created.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div key={s.id} className="sub-row">
                    <div className="sub-text" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="mono-sm"
                        style={{
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--line-2)',
                          padding: '2px 6px',
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--ink)',
                          lineHeight: 1.3,
                          flex: 'none',
                        }}
                      >
                        {PLATFORM_LABEL[s.platform]}
                      </span>
                      <a
                        href={s.post_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{ color: 'inherit', flex: 1, minWidth: 0 }}
                      >
                        {shortText(s.post_url)}
                      </a>
                    </div>
                    <div className="sub-meta hide-m">{dateLabel}</div>
                    <div className="sub-score">
                      {s.status === 'approved' && s.final_score != null
                        ? `+${Number(s.final_score).toFixed(1)}`
                        : '—'}
                    </div>
                    <div className={`sub-status ${s.status}`}>
                      <span className="dot" />
                      {statusLabel(s.status)}
                    </div>
                  </div>
                );
              })
            )}

            <div
              style={{
                padding: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div className="mono-sm">
                Total score:{' '}
                <b style={{ color: 'var(--ink)' }}>+{totalApprovedScore.toFixed(1)}</b>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {submissions.length > rowsToShow.length && (
                  <Link href="/dashboard/submissions" className="btn btn-ghost">
                    See all ({submissions.length})
                  </Link>
                )}
                <Link href="/dashboard/submit" className="btn btn-ghost">
                  Submit another →
                </Link>
              </div>
            </div>
          </div>

          <RewardCalculator
            initialPoints={Math.min(100, Number(me.total_points))}
            tier={user.tier}
            multiplier={Number(user.tier_multiplier)}
            sigmaOthers={sigmaOthers}
            pool={pool}
          />
        </div>
      </div>
    </main>
  );
}
