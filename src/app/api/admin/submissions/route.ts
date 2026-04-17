// GET /api/admin/submissions?status=pending — list submissions for review.

import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import type { SubmissionStatus } from '@/types';

const VALID_STATUS: SubmissionStatus[] = ['pending', 'approved', 'rejected'];

export async function GET(req: Request) {
  const { error } = await requireStaffApi();
  if (error) return error;

  const statusParam = new URL(req.url).searchParams.get('status');
  const status = statusParam && VALID_STATUS.includes(statusParam as SubmissionStatus)
    ? (statusParam as SubmissionStatus)
    : 'pending';

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('submissions')
    .select('*, users:user_id(twitter_handle, twitter_name, twitter_avatar_url, tier, twitter_score)')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (dbErr) return NextResponse.json({ data: null, error: dbErr.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
