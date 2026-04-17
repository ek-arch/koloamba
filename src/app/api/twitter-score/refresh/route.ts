// POST /api/twitter-score/refresh — re-fetch the signed-in user's TwitterScore
// from twitterscore.io and update their users row.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTwitterScore } from '@/lib/twitter-score';

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.handle) return err('Not authenticated', 401);

  const result = await fetchTwitterScore(session.user.handle);
  if (!result) return err('Could not fetch TwitterScore right now', 502);

  const admin = supabaseAdmin();
  const updated_at = new Date().toISOString();
  const { error } = await admin
    .from('users')
    .update({ twitter_score: result.score, twitter_score_updated_at: updated_at })
    .eq('id', session.user.id);

  if (error) return err(error.message, 500);
  return NextResponse.json({
    data: { score: result.score, updated_at },
    error: null,
  });
}
