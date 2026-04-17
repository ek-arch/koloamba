// Role guard for admin routes + API.
// Throws in API context; redirects in server-component context.

import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { Role } from '@/types';

const STAFF: Role[] = ['moderator', 'admin'];

export async function requireStaffPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  if (!STAFF.includes(session.user.role)) redirect('/dashboard');
  return session;
}

export async function requireStaffApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ data: null, error: 'Not authenticated' }, { status: 401 }) };
  }
  if (!STAFF.includes(session.user.role)) {
    return { session: null, error: NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null as null };
}
