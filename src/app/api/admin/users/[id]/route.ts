// PATCH /api/admin/users/[id] — update tier, old_points, role.
//
// Only admin can promote/demote roles. Moderators can edit tier + old_points.

import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import type { Role, Tier, User } from '@/types';

const TIERS: Tier[] = ['bronze', 'silver', 'gold'];
const ROLES: Role[] = ['ambassador', 'moderator', 'admin'];

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { session, error } = await requireStaffApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err('Missing body', 400);

  const update: Record<string, unknown> = {};

  if ('tier' in body) {
    if (!TIERS.includes(body.tier)) return err('Invalid tier', 400);
    update.tier = body.tier;
    update.tier_multiplier = body.tier === 'gold' ? 1.5 : body.tier === 'silver' ? 1.2 : 1.0;
  }
  if ('old_points' in body) {
    if (typeof body.old_points !== 'number' || body.old_points < 0) {
      return err('old_points must be a non-negative number', 400);
    }
    update.old_points = body.old_points;
  }
  if ('role' in body) {
    if (session!.user.role !== 'admin') return err('Only admin can change roles', 403);
    if (!ROLES.includes(body.role)) return err('Invalid role', 400);
    update.role = body.role;
  }
  if ('wallet_address' in body) {
    if (body.wallet_address !== null && typeof body.wallet_address !== 'string') {
      return err('wallet_address must be a string or null', 400);
    }
    update.wallet_address = body.wallet_address;
  }

  if (Object.keys(update).length === 0) return err('Nothing to update', 400);

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return NextResponse.json({ data: data as User, error: null });
}
