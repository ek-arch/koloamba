// Server-side session helpers for use in server components & route handlers.

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { User } from '@/types';

/**
 * Returns the Supabase user row for the currently logged-in ambassador,
 * or null if there is no session (or the user row has not been upserted yet).
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { data } = await supabaseAdmin()
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return (data as User | null) ?? null;
}
