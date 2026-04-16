import Link from 'next/link';
import { auth } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/auth/SignInButton';

export async function Navbar() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <header className="border-b border-border bg-bg-base/80 backdrop-blur sticky top-0 z-40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-glow" />
          <span>Kolo Ambassadors</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/leaderboard" className="text-muted hover:text-white transition">
            Leaderboard
          </Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-white transition">
                Dashboard
              </Link>
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
