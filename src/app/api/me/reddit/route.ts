// POST /api/me/reddit  { username: string | null }
//
// Saves (or clears) the current ambassador's Reddit username. On save we also
// fetch the user's total_karma from reddit.com/user/{name}/about.json so the
// scoring formula can use it immediately. If Reddit is unreachable the row
// still saves and karma is left at 0 (moderator can set it later).
//
// Validation: Reddit usernames are 3–20 chars, [a-zA-Z0-9_-]. Leading u/ or /
// is stripped. Stored lowercased.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchRedditUser } from '@/lib/reddit-fetcher';

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
  let karma = 0;

  if (raw === null || raw === '' || raw === undefined) {
    username = null;
  } else if (typeof raw !== 'string') {
    return err('username must be a string', 400);
  } else {
    username = raw.trim().replace(/^u\//i, '').replace(/^\//, '').toLowerCase();
    if (!USERNAME_RE.test(username)) {
      return err('Invalid Reddit username — use 3–20 chars (letters, digits, _ or -).', 400);
    }
    const stats = await fetchRedditUser(username);
    if (!stats.exists) {
      return err(`Reddit user u/${username} was not found.`, 404);
    }
    karma = stats.totalKarma;
  }

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('users')
    .update({
      reddit_username:         username,
      reddit_karma:            username === null ? 0 : karma,
      reddit_karma_updated_at: username === null ? null : new Date().toISOString(),
      updated_at:              new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('reddit_username, reddit_karma')
    .single();

  if (dbErr) {
    if (dbErr.code === '23505') {
      return err('That Reddit username is already linked to another ambassador.', 409);
    }
    return err(dbErr.message, 500);
  }

  return NextResponse.json({
    data: {
      reddit_username: data.reddit_username,
      reddit_karma:    Number(data.reddit_karma ?? 0),
    },
    error: null,
  });
}
