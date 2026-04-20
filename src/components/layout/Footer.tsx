import Link from 'next/link';
import { SignInButton } from '@/components/auth/SignInButton';
import { auth } from '@/lib/auth';

/**
 * Global footer — inverted surface (black), Instrument Serif accent lede,
 * 2fr/1fr/1fr three-column on desktop, collapses to single column < 900px.
 */
export async function Footer() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-inner">
          <div>
            <p className="footer-lede">
              Write about <em>what you actually use.</em> Get paid.
            </p>
            {loggedIn ? (
              <Link href="/dashboard" className="btn btn-accent btn-lg">
                Go to dashboard →
              </Link>
            ) : (
              <SignInButton className="btn btn-accent btn-lg">Sign in with X →</SignInButton>
            )}
          </div>

          <div>
            <h4>Program</h4>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#tiers">Tiers</Link>
            <Link href="/#formula">Reward formula</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>

          <div>
            <h4>Support</h4>
            <a href="mailto:support@kolo.xyz">Contact moderation</a>
            <a href="mailto:support@kolo.xyz">Report an issue</a>
            <a
              href="https://kolo.xyz/terms"
              target="_blank"
              rel="noreferrer noopener"
            >
              Terms
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>KOLO AMBASSADORS · GENESIS SPRINT</span>
          <span>©{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
