import Link from 'next/link';
import { SignInButton } from '@/components/auth/SignInButton';
import { Ticker } from '@/components/layout/Ticker';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 60; // program stats don't need to be sub-minute fresh

interface ProgramStatus {
  pool: number;
  ambassadors: number;
  postsApproved: number;
  avgScore: number;
}

interface RecentSubmission {
  handle: string;
  score: number;
  minutesAgo: number;
}

async function loadProgramStatus(): Promise<ProgramStatus> {
  const sb = supabaseAdmin();

  const [campaignRes, ambassadorsRes, submissionsRes, scoresRes] = await Promise.all([
    sb
      .from('campaigns')
      .select('pool_amount, status')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'ambassador'),
    sb
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    sb
      .from('submissions')
      .select('final_score')
      .eq('status', 'approved'),
  ]);

  const scores = (scoresRes.data ?? []) as { final_score: number | null }[];
  const avgScore =
    scores.length === 0
      ? 0
      : scores.reduce((a, s) => a + (s.final_score ?? 0), 0) / scores.length;

  return {
    pool: campaignRes.data?.pool_amount ?? 5000,
    ambassadors: ambassadorsRes.count ?? 0,
    postsApproved: submissionsRes.count ?? 0,
    avgScore,
  };
}

async function loadRecentSubmissions(): Promise<RecentSubmission[]> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('submissions')
    .select('final_score, created_at, users:user_id(twitter_handle)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(4);

  if (!data) return [];
  const now = Date.now();
  return data
    .filter((r) => r.users)
    .map((r) => {
      const user = Array.isArray(r.users) ? r.users[0] : r.users;
      return {
        handle: '@' + (user?.twitter_handle ?? 'anon'),
        score: r.final_score ?? 0,
        minutesAgo: Math.max(1, Math.round((now - new Date(r.created_at).getTime()) / 60000)),
      };
    });
}

const TIERS = [
  { key: 'bronze', name: 'Bronze', mult: '1.0×', range: '0–999 old points' },
  { key: 'silver', name: 'Silver', mult: '1.2×', range: '1,000–4,999 old points' },
  { key: 'gold',   name: 'Gold',   mult: '1.5×', range: '5,000+ old points' },
] as const;

const STEPS = [
  {
    n: '01',
    t: 'Sign in with X',
    d: 'Connect your X account so we can verify tweet ownership and pull your TwitterScore.',
  },
  {
    n: '02',
    t: 'Submit posts',
    d: 'Paste the URL of a tweet, Reddit post, or Telegram message you wrote about Kolo.',
  },
  {
    n: '03',
    t: 'Get scored',
    d: 'X is auto-scored on engagement × TwitterScore. Reddit on engagement. Telegram is moderator-reviewed.',
  },
  {
    n: '04',
    t: 'Earn rewards',
    d: 'Climb the board, claim your share of the pool when the sprint ends.',
  },
];

export default async function LandingPage() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  const [status, recent] = await Promise.all([loadProgramStatus(), loadRecentSubmissions()]);

  const signInCta = loggedIn ? (
    <Link href="/dashboard" className="btn btn-primary btn-lg">
      Go to dashboard →
    </Link>
  ) : (
    <SignInButton className="btn btn-primary btn-lg">Sign in with X →</SignInButton>
  );

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">
            <span className="dot" aria-hidden />
            <span>
              genesis · ambassador program · pool{' '}
              <b style={{ color: 'var(--ink)' }}>${status.pool.toLocaleString()}</b>
            </span>
          </div>

          <h1 className="headline">
            Earn for what you <em>post</em> about <span className="accent-word">Kolo.</span>
          </h1>

          <div className="hero-row">
            <div>
              <p className="hero-sub">
                An ongoing ambassador program. Paste a tweet, Reddit post, or Telegram message you
                wrote about Kolo, get scored on reach and credibility, and earn your share of the
                reward pool.
              </p>
              <div className="hero-cta">
                {signInCta}
                <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-label">Pool</div>
                <div className="stat-value">
                  ${(status.pool / 1000).toFixed(0)}
                  <span className="text-muted" style={{ fontSize: 20 }}>
                    K
                  </span>
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Ambassadors</div>
                <div className="stat-value mono">{status.ambassadors.toLocaleString()}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Posts approved</div>
                <div className="stat-value mono">{status.postsApproved.toLocaleString()}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Avg score</div>
                <div className="stat-value mono">
                  {status.avgScore > 0 ? status.avgScore.toFixed(1) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ticker ---------- */}
      <Ticker
        pool={status.pool}
        ambassadors={status.ambassadors}
        postsApproved={status.postsApproved}
        avgScore={status.avgScore || undefined}
      />

      {/* ---------- 01 · How it works ---------- */}
      <section id="how-it-works" className="section-block">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">01 — how it works</div>
            <h2 className="section-title">
              Four steps between a tweet and a <em>payout.</em>
            </h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
                <div className="step-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 02 · Tiers & multipliers (dark) ---------- */}
      <section id="tiers" className="section-block dark">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">02 — tiers &amp; multipliers</div>
            <h2 className="section-title">
              Your prior contribution <em>travels with you.</em>
            </h2>
          </div>
          <p
            className="section-lede"
            style={{ marginTop: -32, marginBottom: 40 }}
          >
            Tier is set from your old points at sprint start. It multiplies every point you earn —
            so loyal contributors compound.
          </p>
          <div className="tiers">
            {TIERS.map((t) => (
              <div key={t.key} className={`tier tier-${t.key}`}>
                <div className="tier-badge" aria-hidden />
                <div className="tier-name">{t.name}</div>
                <div className="tier-mult">{t.mult}</div>
                <div className="tier-range">{t.range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 03 · Reward formula ---------- */}
      <section id="formula" className="section-block">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">03 — reward formula</div>
            <h2 className="section-title">
              Math, in <em>plain sight.</em>
            </h2>
          </div>
          <div className="formula-card">
            <div>
              <p className="section-lede" style={{ marginTop: 0, marginBottom: 20 }}>
                Your share of the pool is proportional to your weighted score vs. everyone
                else&apos;s. The calculator on your dashboard updates in real time as submissions are
                approved.
              </p>
              <dl className="formula-legend">
                <div>
                  <dt>S</dt>
                  <dd>your total points (capped at 100 per sprint)</dd>
                </div>
                <div>
                  <dt>M</dt>
                  <dd>tier multiplier — 1.0 / 1.2 / 1.5</dd>
                </div>
                <div>
                  <dt>Σ(S × M)</dt>
                  <dd>sum of all ambassadors&apos; weighted scores</dd>
                </div>
                <div>
                  <dt>Pool</dt>
                  <dd>total reward pool for the sprint</dd>
                </div>
              </dl>
            </div>
            <div className="formula-expr">
              <div>
                <span className="c-k">Reward</span> <span className="c-m">=</span> (S × M)
              </div>
              <div style={{ borderTop: '1px solid var(--line-2)', margin: '6px 0' }} />
              <div>
                Σ(S × M) × <span className="c-k">Pool</span>
              </div>
              <div style={{ marginTop: 20, color: 'var(--muted)' }}>
                <span className="c-m">{'// worked example'}</span>
              </div>
              <div>
                <span className="c-m">S =</span> 34, <span className="c-m">M =</span> 1.2× (silver)
              </div>
              <div>
                <span className="c-m">Σ =</span> 9,420,{' '}
                <span className="c-m">Pool =</span> ${status.pool.toLocaleString()}
              </div>
              <div style={{ marginTop: 6 }}>
                <span className="c-k">Reward ≈</span> $
                {(((34 * 1.2) / (9420 + 34 * 1.2)) * status.pool).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 04 · Ready? ---------- */}
      <section className="section-block" style={{ borderBottom: 'none' }}>
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 48,
              alignItems: 'center',
            }}
            className="landing-cta"
          >
            <div>
              <div className="eyebrow">04 — ready?</div>
              <h2 className="section-title" style={{ marginTop: 14 }}>
                Sign in. <em>Start submitting.</em>
              </h2>
              <p className="section-lede" style={{ marginTop: 20 }}>
                No forms. No approvals queue. We pull your handle and TwitterScore on first submit
                and you&apos;re in.
              </p>
              <div className="hero-cta" style={{ marginTop: 28 }}>
                {signInCta}
                <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                  See who&apos;s winning
                </Link>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 48 }}>
              <div className="mono-sm" style={{ marginBottom: 20 }}>
                LIVE — recent submissions
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-muted">
                  Be the first to submit — this list populates as posts get approved.
                </p>
              ) : (
                recent.map((a, i) => (
                  <div
                    key={`${a.handle}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom:
                        i < recent.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <div className="lb-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                      {a.handle[1]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {a.handle}{' '}
                        <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>
                          posted
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                        }}
                      >
                        +{a.score.toFixed(1)} pts · {a.minutesAgo}m ago
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
