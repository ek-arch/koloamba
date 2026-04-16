import { SignInButton } from '@/components/auth/SignInButton';
import { TierBadge } from '@/components/dashboard/TierBadge';
import { auth } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-5 pt-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Genesis Sprint · 1-month campaign
        </p>
        <h1 className="text-5xl font-bold leading-tight sm:text-6xl">
          Earn rewards for content about <span className="text-accent">Kolo</span>.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Join the ambassador program. Submit your posts, get scored on reach and credibility,
          and earn your share of the reward pool.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {loggedIn ? (
            <a href="/dashboard" className="btn-primary">Go to dashboard</a>
          ) : (
            <SignInButton>Join with X</SignInButton>
          )}
          <a href="/leaderboard" className="btn-outline">View leaderboard</a>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '1', title: 'Sign in with X', body: 'Connect your X account so we can verify tweet ownership and credibility.' },
            { step: '2', title: 'Submit posts', body: 'Paste the URL of a tweet you wrote about Kolo. Metrics are fetched automatically.' },
            { step: '3', title: 'Get scored', body: 'Engagement + your TwitterScore produce an auto-score. Moderators can fine-tune.' },
            { step: '4', title: 'Earn rewards', body: 'Climb the leaderboard and claim your share of the pool when the sprint ends.' },
          ].map((s) => (
            <div key={s.step} className="card">
              <div className="text-accent font-mono text-sm">Step {s.step}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Tiers & multipliers</h2>
        <p className="max-w-2xl text-muted">
          Your tier is set from your prior Kolo contribution (old points). It multiplies every
          point you earn in the sprint.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <TierBadge tier="bronze" />
            <div className="stat-number mt-3">1.0×</div>
            <p className="mt-2 text-sm text-muted">0–999 old points</p>
          </div>
          <div className="card">
            <TierBadge tier="silver" />
            <div className="stat-number mt-3">1.2×</div>
            <p className="mt-2 text-sm text-muted">1,000–4,999 old points</p>
          </div>
          <div className="card">
            <TierBadge tier="gold" />
            <div className="stat-number mt-3 text-tier-gold">1.5×</div>
            <p className="mt-2 text-sm text-muted">5,000+ old points</p>
          </div>
        </div>
      </section>

      {/* Reward formula */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Reward formula</h2>
        <div className="card space-y-4">
          <p className="text-muted">
            Your share of the pool is proportional to your weighted score vs everyone else&apos;s.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-bg-base px-4 py-3 text-sm text-accent">
{`Reward = (S × M) / Σ(S × M) × Pool

S = your total points (capped at 100)
M = your tier multiplier (1.0 / 1.2 / 1.5)
Σ(S × M) = sum of all ambassadors' weighted scores
Pool = total reward pool for the sprint`}
          </pre>
          <p className="text-sm text-muted">
            The calculator on your dashboard updates in real time as submissions are approved.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="card text-center">
        <h2 className="text-3xl font-bold">Ready to join?</h2>
        <p className="mt-2 text-muted">Sign in with X and start submitting.</p>
        <div className="mt-5 flex justify-center">
          {loggedIn ? (
            <a href="/dashboard" className="btn-primary">Go to dashboard</a>
          ) : (
            <SignInButton>Join with X</SignInButton>
          )}
        </div>
      </section>
    </div>
  );
}
