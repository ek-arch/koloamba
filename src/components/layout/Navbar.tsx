import Link from 'next/link';
import { auth } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/auth/SignInButton';

/**
 * Sticky 64px navbar matching the Kolo Ambassadors prototype (`.nav-shell`).
 * Brand mark is the kolo concentric-circle glyph drawn in CSS (.brand-mark).
 */
export async function Navbar() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;
  const isStaff = loggedIn && (session!.user.role === 'moderator' || session!.user.role === 'admin');

  return (
    <header className="nav-shell">
      <div className="wrap nav-inner">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold tracking-tight text-text-primary"
        >
          <span>Kolo</span>
          <span className="ml-1 hidden text-[11px] font-medium uppercase tracking-[0.08em] text-muted sm:inline">
            Ambassadors
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-7">
          <Link
            href="/"
            className="hidden text-muted transition-colors duration-instant hover:text-text-primary sm:inline"
          >
            Home
          </Link>
          <Link
            href="/leaderboard"
            className="text-muted transition-colors duration-instant hover:text-text-primary"
          >
            Leaderboard
          </Link>
          {loggedIn && (
            <Link
              href="/dashboard"
              className="text-muted transition-colors duration-instant hover:text-text-primary"
            >
              Dashboard
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin/review"
              className="text-text-primary transition-colors duration-instant hover:text-accent"
            >
              Admin
            </Link>
          )}

          {loggedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-muted sm:inline">@{session!.user.handle}</span>
              <SignOutButton className="btn-outline px-3 py-1.5 text-sm" />
            </div>
          ) : (
            <SignInButton className="btn-primary whitespace-nowrap px-3 py-2 text-sm sm:px-4">
              <span className="hidden sm:inline">Sign in with X →</span>
              <span className="sm:hidden">Sign in →</span>
            </SignInButton>
          )}
        </nav>
      </div>
    </header>
  );
}
