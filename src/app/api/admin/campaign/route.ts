// PATCH /api/admin/campaign — update the active campaign's pool_amount / dates / status.
//
// If no active campaign exists, creates one.

import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import type { Campaign, CampaignStatus } from '@/types';

const STATUSES: CampaignStatus[] = ['draft', 'active', 'completed'];

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function PATCH(req: Request) {
  const { error } = await requireStaffApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err('Missing body', 400);

  const update: Record<string, unknown> = {};
  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim()) return err('Invalid name', 400);
    update.name = body.name.trim();
  }
  if ('description' in body) {
    if (body.description !== null && typeof body.description !== 'string') return err('Invalid description', 400);
    update.description = body.description;
  }
  if ('pool_amount' in body) {
    if (typeof body.pool_amount !== 'number' || body.pool_amount < 0) return err('pool_amount must be non-negative', 400);
    update.pool_amount = body.pool_amount;
  }
  if ('max_score' in body) {
    if (typeof body.max_score !== 'number' || body.max_score <= 0) return err('max_score must be positive', 400);
    update.max_score = body.max_score;
  }
  if ('start_date' in body) {
    if (typeof body.start_date !== 'string') return err('Invalid start_date', 400);
    update.start_date = body.start_date;
  }
  if ('end_date' in body) {
    if (typeof body.end_date !== 'string') return err('Invalid end_date', 400);
    update.end_date = body.end_date;
  }
  if ('status' in body) {
    if (!STATUSES.includes(body.status)) return err('Invalid status', 400);
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) return err('Nothing to update', 400);

  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from('campaigns')
    .select('id')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    // Create — require the minimal fields
    if (!update.name || !update.start_date || !update.end_date) {
      return err('Creating a campaign requires name, start_date, and end_date', 400);
    }
    const { data, error: dbErr } = await admin
      .from('campaigns')
      .insert({ status: 'active', pool_amount: 0, max_score: 100, ...update })
      .select('*')
      .single();
    if (dbErr) return err(dbErr.message, 500);
    return NextResponse.json({ data: data as Campaign, error: null });
  }

  const { data, error: dbErr } = await admin
    .from('campaigns')
    .update(update)
    .eq('id', existing.id)
    .select('*')
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return NextResponse.json({ data: data as Campaign, error: null });
}
