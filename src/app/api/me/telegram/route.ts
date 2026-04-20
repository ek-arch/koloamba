// POST /api/me/telegram  { handle: string | null }
//
// Saves (or clears) the current ambassador's Telegram handle. When a handle is
// saved, we also look up the user's KOLO balance in the kolo_balances snapshot
// and set users.old_points + tier + tier_multiplier accordingly — this is how
// mini-app standing flows into the ambassador program's tier system.
//
// Validation: Telegram usernames are 5–32 chars, [a-zA-Z0-9_], must not start
// with a digit or underscore, and are stored lowercased with no leading @.
// Pass `null` or an empty string to unlink (clears old_points + resets to bronze).

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { tierFromBalance } from '@/lib/tier';

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
        'Invalid Telegram handle. Use 5–32 chars (letters, digits, underscores; must start with a letter).',
        400,
      );
    }
  }

  const admin = supabaseAdmin();

  // Look up the snapshot balance + derive tier. If handle is cleared or not in
  // the snapshot, reset to bronze/0 (treat as "never tapped").
  let balance = 0;
  if (handle) {
    const { data: balanceRow } = await admin
      .from('kolo_balances')
      .select('token_balance')
      .ilike('telegram_handle', handle)
      .maybeSingle();
    if (balanceRow) balance = Number(balanceRow.token_balance);
  }
  const { tier, multiplier } = tierFromBalance(balance);

  const { data, error: dbErr } = await admin
    .from('users')
    .update({
      telegram_handle: handle,
      old_points:      balance,
      tier,
      tier_multiplier: multiplier,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('telegram_handle, old_points, tier, tier_multiplier')
    .single();

  if (dbErr) {
    if (dbErr.code === '23505') {
      return err('That Telegram handle is already linked to another ambassador.', 409);
    }
    return err(dbErr.message, 500);
  }

  return NextResponse.json({
    data: {
      telegram_handle: data.telegram_handle,
      old_points:      Number(data.old_points),
      tier:            data.tier,
      tier_multiplier: Number(data.tier_multiplier),
    },
    error: null,
  });
}
