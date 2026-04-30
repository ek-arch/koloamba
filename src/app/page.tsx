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
  campaignName: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
}

interface RecentSubmission {
  handle: string;
  score: number;
  minutesAgo: number;
}

async function loadProgramStatus(): Promise<ProgramStatus> {
  const sb = supabaseAdmin();

  const [campaignRes, ambassadorsRes, submissionsRes] = await Promise.all([
    sb
      .from('campaigns')
      .select('name, pool_amount, start_date, end_date, status')
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
  ]);

  const endDate = campaignRes.data?.end_date ?? null;
  const daysLeft =
    endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  return {
    pool:          campaignRes.data?.pool_amount ?? 5000,
    ambassadors:   ambassadorsRes.count ?? 0,
    postsApproved: submissionsRes.count ?? 0,
    campaignName:  campaignRes.data?.name ?? null,
    startDate:     campaignRes.data?.start_date ?? null,
    endDate,
    daysLeft,
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

// "May 1 – Jun 1" — uses en-dash, not em-dash (em-dashes are stripped
// across the app per copy convention; en-dash is correct for date ranges).
function formatDateRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

const TIERS = [
  { key: 'bronze', name: 'Bronze', mult: '1.0×', range: '0 – 1,999 KOLO' },
  { key: 'silver', name: 'Silver', mult: '1.3×', range: '2,000 – 49,999 KOLO' },
  { key: 'gold',   name: 'Gold',   mult: '1.7×', range: '50,000+ KOLO' },
] as const;

const STEPS = [
  {
    n: '01',
    t: 'Sign in',
    d: 'Connect your account so we can verify the posts you submit.',
  },
  {
    n: '02',
    t: 'Submit posts',
    d: 'Paste a link to anything you posted about Kolo on socials.',
  },
  {
    n: '03',
    t: 'Get scored',
    d: 'Posts are scored on reach and credibility.',
  },
  {
    n: '04',
    t: 'Claim your share',
    d: 'Climb the board and claim your share of the pool when the campaign ends.',
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
          <video
            className="hero-logo"
            src="/brand/kolo-logo.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          />

          <div className="eyebrow">
            <span className="dot" aria-hidden />
            <span>
              {status.campaignName
                ? status.campaignName.toLowerCase()
                : 'active campaign'}
              {status.startDate && status.endDate
                ? ` · ${formatDateRange(status.startDate, status.endDate)}`
                : ''}
            </span>
          </div>

          <h1 className="headline">
            Kolo runs on its <span className="accent-word">ambassadors.</span>
          </h1>

          <div className="hero-row">
            <div>
              <p className="hero-sub">
                For Kolo creators and OGs. Talk about Kolo, get scored, and grab your share of the
                pool. Your KOLO points set a tier multiplier.
              </p>
              <div className="hero-cta">
                {signInCta}
                {loggedIn && (
                  <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                    View leaderboard
                  </Link>
                )}
              </div>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-label">Ambassadors</div>
                <div className="stat-value mono">{status.ambassadors.toLocaleString()}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Posts approved</div>
                <div className="stat-value mono">{status.postsApproved.toLocaleString()}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Days left</div>
                <div className="stat-value mono">
                  {status.daysLeft === null ? '—' : status.daysLeft}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ticker ---------- */}
      <Ticker
        ambassadors={status.ambassadors}
        postsApproved={status.postsApproved}
        daysLeft={status.daysLeft ?? undefined}
      />

      {/* ---------- 01 · How it works ---------- */}
      <section id="how-it-works" className="section-block">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">01 · how it works</div>
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
            <div className="eyebrow">02 · tiers &amp; multipliers</div>
            <h2 className="section-title">
              Your KOLO points <em>travel with you.</em>
            </h2>
          </div>
          <p
            className="section-lede"
            style={{ marginTop: 32, marginBottom: 40 }}
          >
            Tier is set from your KOLO points at the close of the mini-app tap phase. If you&apos;re
            a Kolo OG, you already have a multiplier waiting. It applies to every point you earn
            across ambassador campaigns, so early adopters compound over time.
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
            <div className="eyebrow">03 · reward formula</div>
            <h2 className="section-title">
              Math, in <em>plain sight.</em>
            </h2>
          </div>
          <div className="formula-card">
            <div>
              <p className="section-lede" style={{ marginTop: 0, marginBottom: 20 }}>
                Your share of the pool is proportional to your weighted score vs. everyone
                else&apos;s. The calculator on your dashboard updates in real time as submissions are
                approved. Each campaign runs for a fixed window (typically a month), then the pool
                resets for the next one.
              </p>
              <dl className="formula-legend">
                <div>
                  <dt>S</dt>
                  <dd>your total points across approved submissions</dd>
                </div>
                <div>
                  <dt>M</dt>
                  <dd>tier multiplier: 1.0 / 1.3 / 1.7 (from KOLO points)</dd>
                </div>
                <div>
                  <dt>Σ(S × M)</dt>
                  <dd>sum of all ambassadors&apos; weighted scores</dd>
                </div>
                <div>
                  <dt>Pool</dt>
                  <dd>total reward pool for the campaign</dd>
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
                <span className="c-m">{'// pool announced at campaign kickoff'}</span>
              </div>
              <div>
                <span className="c-m">S =</span> 42, <span className="c-m">M =</span> 1.7× (gold)
              </div>
              <div>
                <span className="c-m">Σ =</span> 685
              </div>
              <div style={{ marginTop: 6 }}>
                <span className="c-k">Share ≈</span>{' '}
                {(((42 * 1.7) / (685 + 42 * 1.7)) * 100).toFixed(2)}
                <span className="c-m">%</span> of pool
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
              <div className="eyebrow">04 · ready?</div>
              <h2 className="section-title" style={{ marginTop: 14 }}>
                Sign in. <em>Start submitting.</em>
              </h2>
              <p className="section-lede" style={{ marginTop: 20 }}>
                No forms. No approvals queue. Link your Telegram. If you&apos;re a Kolo OG, your
                tier and multiplier show up instantly. Then submit your first post.
              </p>
              <div className="hero-cta" style={{ marginTop: 28 }}>
                {signInCta}
                {loggedIn && (
                  <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                    See who&apos;s winning
                  </Link>
                )}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 48 }}>
              <div className="mono-sm" style={{ marginBottom: 20 }}>
                LIVE · recent submissions
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-muted">
                  Be the first to submit. This list populates as posts get approved.
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
