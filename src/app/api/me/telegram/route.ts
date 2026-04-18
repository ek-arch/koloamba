// POST /api/me/telegram  { handle: string | null }
//
// Saves (or clears) the current ambassador's Telegram handle. Once linked we
// can cross-reference the replica DB by handle and surface the user's
// on-chain / in-product token balance.
//
// Validation: Telegram usernames are 5–32 chars, [a-zA-Z0-9_], must not start
// with a digit or underscore, and are stored lowercased with no leading @.
// Pass `null` or an empty string to unlink.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const HANDLE_RE = /^[a-z][a-z0-9_]{3,30}[a-z0-9]$/; // 5–32 chars, no trailing _

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return err('Not signed in', 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err('Missing body', 400);

  const raw = body.handle;
  let handle: string | null;
  if (raw === null || raw === '' || raw === undefined) {
    handle = null;
  } else if (typeof raw !== 'string') {
    return err('handle must be a string', 400);
  } else {
    handle = raw.trim().replace(/^@/, '').toLowerCase();
    if (!HANDLE_RE.test(handle)) {
      return err(
        'Invalid Telegram handle — use 5–32 chars (letters, digits, underscores; must start with a letter).',
        400,
      );
    }
  }

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('users')
    .update({ telegram_handle: handle, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)
    .select('telegram_handle')
    .single();

  if (dbErr) {
    // Unique violation → already taken
    if (dbErr.code === '23505') {
      return err('That Telegram handle is already linked to another ambassador.', 409);
    }
    return err(dbErr.message, 500);
  }

  return NextResponse.json({ data: { telegram_handle: data.telegram_handle }, error: null });
}
