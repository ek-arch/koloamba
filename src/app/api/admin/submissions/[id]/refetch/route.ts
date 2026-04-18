// POST /api/admin/submissions/[id]/refetch — re-pull engagement metrics and
// recompute auto_score for an existing submission. Dispatches by platform:
// X via socialdata.tools, Reddit via public JSON, Telegram no-ops (stays 1.0).

import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchPostMetrics } from '@/lib/post-metrics';
import { computeAutoScore } from '@/lib/scoring';
import type { Platform, Submission } from '@/types';

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
    .select('id, post_id, post_url, platform, user_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!sub || !sub.post_id) return err('Submission not found or missing post_id', 404);

  const { data: user } = await admin
    .from('users')
    .select('twitter_score, reddit_karma')
    .eq('id', sub.user_id)
    .maybeSingle();

  // Rehydrate a minimal ParsedUrl from the stored row so we don't have to
  // re-parse the original URL.
  const parsed = {
    platform: sub.platform as Platform,
    postId:   sub.post_id,
    authorHandle: null,
    canonicalUrl: sub.post_url,
  };

  const engagement = await fetchPostMetrics(parsed);
  const score = computeAutoScore(engagement, {
    twitterScore: Number(user?.twitter_score ?? 0),
    redditKarma:  Number(user?.reddit_karma  ?? 0),
  });

  const { data, error: dbErr } = await admin
    .from('submissions')
    .update({
      likes:    engagement.likes,
      retweets: engagement.retweets,
      replies:  engagement.replies,
      views:    engagement.views,
      engagement_rate: score.engagementRate,
      auto_score:      score.autoScore,
      fetched_at:      engagement.fetched ? new Date().toISOString() : null,
    })
    .eq('id', params.id)
    .select('*')
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return NextResponse.json({ data: data as Submission, error: null });
}
