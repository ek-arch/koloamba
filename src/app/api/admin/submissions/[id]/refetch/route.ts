// POST /api/admin/submissions/[id]/refetch — re-pull engagement metrics from
// socialdata.tools and recompute auto_score for an existing submission.

import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTweetEngagement } from '@/lib/tweet-fetcher';
import { computeAutoScore } from '@/lib/scoring';
import type { Submission } from '@/types';

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireStaffApi();
  if (error) return error;

  const admin = supabaseAdmin();

  const { data: sub } = await admin
    .from('submissions')
    .select('id, post_id, user_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!sub || !sub.post_id) return err('Submission not found or missing post_id', 404);

  const { data: user } = await admin
    .from('users')
    .select('twitter_score')
    .eq('id', sub.user_id)
    .maybeSingle();

  const engagement = await fetchTweetEngagement(sub.post_id);
  const score = computeAutoScore(engagement, Number(user?.twitter_score ?? 0));

  const { data, error: dbErr } = await admin
    .from('submissions')
    .update({
      likes:    engagement.likes,
      retweets: engagement.retweets,
      replies:  engagement.replies,
      views:    engagement.views,
      engagement_rate: score.engagementRate,
      auto_score:      score.autoScore,
      fetched_at:      new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('*')
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return NextResponse.json({ data: data as Submission, error: null });
}
