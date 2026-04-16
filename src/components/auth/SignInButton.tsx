// Server component that renders a <form> which calls the NextAuth signIn
// server action. Works without JS; no "use client" needed.
import { signIn, signOut } from '@/lib/auth';

export function SignInButton({
  children = 'Sign in with X',
  className = 'btn-primary',
  callbackUrl = '/dashboard',
}: {
  children?: React.ReactNode;
  className?: string;
  callbackUrl?: string;
}) {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('twitter', { redirectTo: callbackUrl });
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export function SignOutButton({
  className = 'btn-outline',
}: {
  className?: string;
}) {
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}
    >
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
