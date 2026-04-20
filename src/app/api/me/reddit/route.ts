// POST /api/me/reddit  { username: string | null }
//
// Saves (or clears) the current ambassador's Reddit username. Used as an
// ownership check — Reddit submissions must match this handle. No karma
// fetch: Reddit rate-limits cloud IPs hard, and karma doesn't feed scoring.
//
// Validation: Reddit usernames are 3–20 chars, [a-zA-Z0-9_-]. Leading u/ or /
// is stripped. Stored lowercased.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/;

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return err('Not signed in', 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err('Missing body', 400);

  const raw = body.username;
  let username: string | null;

  if (raw === null || raw === '' || raw === undefined) {
    username = null;
  } else if (typeof raw !== 'string') {
    return err('username must be a string', 400);
  } else {
    username = raw.trim().replace(/^u\//i, '').replace(/^\//, '').toLowerCase();
    if (!USERNAME_RE.test(username)) {
      return err('Invalid Reddit username. Use 3–20 chars (letters, digits, _ or -).', 400);
    }
  }

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('users')
    .update({
      reddit_username: username,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('reddit_username')
    .single();

  if (dbErr) {
    if (dbErr.code === '23505') {
      return err('That Reddit username is already linked to another ambassador.', 409);
    }
    return err(dbErr.message, 500);
  }

  return NextResponse.json({
    data: { reddit_username: data.reddit_username },
    error: null,
  });
}
