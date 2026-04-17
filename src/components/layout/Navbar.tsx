import Link from 'next/link';
import { auth } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/auth/SignInButton';

export async function Navbar() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;
  const isStaff = loggedIn && (session!.user.role === 'moderator' || session!.user.role === 'admin');

  return (
    <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span>Kolo Ambassadors</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/leaderboard" className="text-text-secondary hover:text-text-primary transition">
            Leaderboard
          </Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition">
                Dashboard
              </Link>
              {isStaff && (
                <Link href="/admin/review" className="text-text-primary hover:text-accent transition">
                  Admin
                </Link>
              )}
              <span className="hidden text-muted sm:inline">
                @{session!.user.handle}
              </span>
              <SignOutButton className="btn-outline px-3 py-1.5 text-sm" />
            </>
          ) : (
            <SignInButton className="btn-primary px-3 py-1.5 text-sm">
              Sign in with X
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
}
