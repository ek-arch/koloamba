// PATCH /api/admin/submissions/[id] — approve / reject / override score / set notes.
//
// Body: { status?: 'approved'|'rejected'|'pending', moderator_score?: number|null, moderator_notes?: string|null }

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import type { Submission, SubmissionStatus } from '@/types';

const VALID_STATUS: SubmissionStatus[] = ['pending', 'approved', 'rejected'];

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

  const update: Record<string, unknown> = { moderator_id: session!.user.id };

  if ('status' in body) {
    if (!VALID_STATUS.includes(body.status)) return err('Invalid status', 400);
    update.status = body.status;
    update.reviewed_at = new Date().toISOString();
  }
  if ('moderator_score' in body) {
    if (body.moderator_score === null) {
      update.moderator_score = null;
    } else if (typeof body.moderator_score === 'number' && body.moderator_score >= 0) {
      update.moderator_score = body.moderator_score;
    } else {
      return err('moderator_score must be a non-negative number or null', 400);
    }
  }
  if ('moderator_notes' in body) {
    if (body.moderator_notes === null || typeof body.moderator_notes === 'string') {
      update.moderator_notes = body.moderator_notes;
    } else {
      return err('moderator_notes must be a string or null', 400);
    }
  }

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('submissions')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (dbErr) return err(dbErr.message, 500);

  // Invalidate the review queue cache for ALL status tabs so the row moves
  // between Pending / Approved / Rejected immediately on the next click.
  revalidatePath('/admin/review');

  return NextResponse.json({ data: data as Submission, error: null });
}
