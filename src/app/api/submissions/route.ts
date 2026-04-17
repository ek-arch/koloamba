// POST /api/submissions — create a new submission from a post URL.
// GET  /api/submissions — list current user's submissions (most recent first).

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSubmissionUrl, UrlParseError } from '@/lib/url-parser';
import { fetchTweetEngagement } from '@/lib/tweet-fetcher';
import { computeAutoScore } from '@/lib/scoring';
import type { Submission } from '@/types';

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return err('Not authenticated', 401);

  const body = await req.json().catch(() => null);
  const url: unknown = body?.url;
  if (typeof url !== 'string') return err('Missing url', 400);

  let parsed;
  try {
    parsed = parseSubmissionUrl(url);
  } catch (e) {
    if (e instanceof UrlParseError) return err(e.message, 400);
    throw e;
  }

  // Soft ownership check: if URL includes a handle, it must match the signed-in user's handle.
  // (Authoritative ownership via tweet author ID is a Phase 3 fetcher concern.)
  if (
    parsed.authorHandle &&
    parsed.authorHandle.toLowerCase() !== session.user.handle.toLowerCase()
  ) {
    return err(
      `URL handle @${parsed.authorHandle} doesn't match your account @${session.user.handle}`,
      400,
    );
  }

  const admin = supabaseAdmin();

  // Duplicate check (unique index will also catch, but friendlier error here)
  const existing = await admin
    .from('submissions')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('platform', parsed.platform)
    .eq('post_id', parsed.postId)
    .maybeSingle();
  if (existing.data) return err('You have already submitted this post', 409);

  // Fetch engagement metrics (stub until a scraping provider is wired).
  // If the fetcher returns an authoritative author handle, enforce ownership.
  const engagement = await fetchTweetEngagement(parsed.postId);
  if (
    engagement.authorHandle &&
    engagement.authorHandle.toLowerCase() !== session.user.handle.toLowerCase()
  ) {
    return err(
      `This tweet was posted by @${engagement.authorHandle}, not your account`,
      400,
    );
  }

  const { data: userRow } = await admin
    .from('users')
    .select('twitter_score')
    .eq('id', session.user.id)
    .maybeSingle();
  const twitterScore = Number(userRow?.twitter_score ?? 0);

  const score = computeAutoScore(engagement, twitterScore);

  const { data, error } = await admin
    .from('submissions')
    .insert({
      user_id:  session.user.id,
      platform: parsed.platform,
      post_url: parsed.canonicalUrl,
      post_id:  parsed.postId,
      status:   'pending',
      likes:    engagement.likes,
      retweets: engagement.retweets,
      replies:  engagement.replies,
      views:    engagement.views,
      engagement_rate: score.engagementRate,
      auto_score:      score.autoScore,
      fetched_at:      new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ data: data as Submission, error: null });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return err('Not authenticated', 401);

  const { data, error } = await supabaseAdmin()
    .from('submissions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return err(error.message, 500);
  return NextResponse.json({ data: data as Submission[], error: null });
}
