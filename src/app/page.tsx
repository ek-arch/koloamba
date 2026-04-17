import { SignInButton } from '@/components/auth/SignInButton';
import { TierBadge } from '@/components/dashboard/TierBadge';
import { auth } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="space-y-24 pb-24">
      {/* Hero — full-bleed black inverse section, kolo.xyz style */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-10 w-screen bg-bg-invert py-24 text-text-invert sm:py-32">
        <div className="mx-auto max-w-6xl space-y-8 px-6">
          <p className="eyebrow text-accent">
            Genesis Sprint · 1-month campaign
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-display-sm lg:text-display-md">
            Earn rewards for content about <span className="text-accent">Kolo</span>.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Join the ambassador program. Submit your posts, get scored on reach and credibility,
            and earn your share of the reward pool.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            {loggedIn ? (
              <a href="/dashboard" className="btn-accent">Go to dashboard →</a>
            ) : (
              <SignInButton className="btn-accent">Join with X →</SignInButton>
            )}
            <a
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-xs border border-white/20 px-5 py-2.5 font-medium text-white transition hover:border-white hover:bg-white/5"
            >
              View leaderboard
            </a>
          </div>
        </div>
      </section>

      {/* How it works — numbered cards, kolo.xyz style */}
      <section className="section">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="hidden text-sm text-muted sm:block">Four steps to rewards</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '01', title: 'Sign in with X', body: 'Connect your X account so we can verify tweet ownership and credibility.' },
            { step: '02', title: 'Submit posts', body: 'Paste the URL of a tweet you wrote about Kolo. Metrics are fetched automatically.' },
            { step: '03', title: 'Get scored', body: 'Engagement + your TwitterScore produce an auto-score. Moderators can fine-tune.' },
            { step: '04', title: 'Earn rewards', body: 'Climb the leaderboard and claim your share of the pool when the sprint ends.' },
          ].map((s) => (
            <div key={s.step} className="card group">
              <div className="font-mono text-sm text-muted">{s.step}</div>
              <h3 className="mt-6 text-lg font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">{s.body}</p>
              <div className="mt-6 text-accent opacity-0 transition group-hover:opacity-100">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="section">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tiers & multipliers</h2>
        <p className="max-w-2xl text-text-tertiary">
          Your tier is set from your prior Kolo contribution (old points). It multiplies every
          point you earn in the sprint.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <TierBadge tier="bronze" />
            <div className="stat-number mt-6">1.0×</div>
            <p className="mt-3 text-sm text-text-tertiary">0–999 old points</p>
          </div>
          <div className="card">
            <TierBadge tier="silver" />
            <div className="stat-number mt-6">1.2×</div>
            <p className="mt-3 text-sm text-text-tertiary">1,000–4,999 old points</p>
          </div>
          <div className="card">
            <TierBadge tier="gold" />
            <div className="stat-number mt-6 text-tier-gold">1.5×</div>
            <p className="mt-3 text-sm text-text-tertiary">5,000+ old points</p>
          </div>
        </div>
      </section>

      {/* Reward formula */}
      <section className="section">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reward formula</h2>
        <div className="card space-y-4">
          <p className="text-text-tertiary">
            Your share of the pool is proportional to your weighted score vs everyone else&apos;s.
          </p>
          <pre className="overflow-x-auto rounded-xs bg-bg-invert px-4 py-3 text-sm text-accent">
{`Reward = (S × M) / Σ(S × M) × Pool

S = your total points (capped at 100)
M = your tier multiplier (1.0 / 1.2 / 1.5)
Σ(S × M) = sum of all ambassadors' weighted scores
Pool = total reward pool for the sprint`}
          </pre>
          <p className="text-sm text-text-tertiary">
            The calculator on your dashboard updates in real time as submissions are approved.
          </p>
        </div>
      </section>

      {/* CTA — inverse */}
      <section className="card-invert text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to join?</h2>
        <p className="mt-3 text-white/70">Sign in with X and start submitting.</p>
        <div className="mt-6 flex justify-center">
          {loggedIn ? (
            <a href="/dashboard" className="btn-accent">Go to dashboard →</a>
          ) : (
            <SignInButton className="btn-accent">Join with X →</SignInButton>
          )}
        </div>
      </section>
    </div>
  );
}
