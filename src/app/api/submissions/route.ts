// POST /api/submissions — create a new submission from a post URL.
// GET  /api/submissions — list current user's submissions (most recent first).

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSubmissionUrl, UrlParseError } from '@/lib/url-parser';
import { fetchPostMetrics } from '@/lib/post-metrics';
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

  const admin = supabaseAdmin();

  const { data: userRow } = await admin
    .from('users')
    .select('twitter_handle, twitter_score, reddit_username, telegram_handle')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!userRow) return err('User record not found. Sign in again.', 401);

  // Ownership checks — soft (URL shape) + hard (provider author when known).
  // Enforcement is per-platform because each platform surfaces ownership
  // differently:
  //   X        URL handle MUST match; provider-reported handle also enforced.
  //   Reddit   URL doesn't carry an author; we require a linked reddit_username
  //            and compare to the provider-reported author.
  //   Telegram URL carries the channel name, not the poster's handle. We can't
  //            verify authorship without a bot, so we accept the submission on
  //            trust and let the moderator confirm.
  if (parsed.platform === 'x') {
    if (
      parsed.authorHandle &&
      parsed.authorHandle.toLowerCase() !== userRow.twitter_handle.toLowerCase()
    ) {
      return err(
        `URL handle @${parsed.authorHandle} doesn't match your X account @${userRow.twitter_handle}`,
        400,
      );
    }
  }

  // Duplicate check
  const existing = await admin
    .from('submissions')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('platform', parsed.platform)
    .eq('post_id', parsed.postId)
    .maybeSingle();
  if (existing.data) return err('You have already submitted this post', 409);

  const engagement = await fetchPostMetrics(parsed);

  // Hard ownership checks using provider-reported author.
  if (parsed.platform === 'x') {
    if (
      engagement.authorHandle &&
      engagement.authorHandle.toLowerCase() !== userRow.twitter_handle.toLowerCase()
    ) {
      return err(`This tweet was posted by @${engagement.authorHandle}, not your account`, 400);
    }
  } else if (parsed.platform === 'reddit') {
    if (!userRow.reddit_username) {
      return err(
        'Link your Reddit username on the dashboard before submitting Reddit posts.',
        400,
      );
    }
    if (
      engagement.authorHandle &&
      engagement.authorHandle.toLowerCase() !== userRow.reddit_username.toLowerCase()
    ) {
      return err(
        `This Reddit post was submitted by u/${engagement.authorHandle}, not your linked u/${userRow.reddit_username}`,
        400,
      );
    }
  } else if (parsed.platform === 'telegram') {
    if (!userRow.telegram_handle) {
      return err(
        'Link your Telegram handle on the dashboard before submitting Telegram posts.',
        400,
      );
    }
  }

  const score = computeAutoScore(engagement, {
    twitterScore: Number(userRow.twitter_score ?? 0),
  });

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
      fetched_at:      engagement.fetched ? new Date().toISOString() : null,
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
