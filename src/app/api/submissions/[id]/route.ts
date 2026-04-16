// GET    /api/submissions/:id — current user's single submission
// DELETE /api/submissions/:id — delete own PENDING submission (approved ones are locked)

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return err('Not authenticated', 401);

  const { data, error } = await supabaseAdmin()
    .from('submissions')
    .select('*')
    .eq('id', ctx.params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) return err(error.message, 500);
  if (!data) return err('Not found', 404);
  return NextResponse.json({ data, error: null });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return err('Not authenticated', 401);

  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from('submissions')
    .select('id, user_id, status')
    .eq('id', ctx.params.id)
    .maybeSingle();

  if (!existing || existing.user_id !== session.user.id) return err('Not found', 404);
  if (existing.status !== 'pending') return err('Only pending submissions can be deleted', 400);

  const { error } = await admin.from('submissions').delete().eq('id', ctx.params.id);
  if (error) return err(error.message, 500);
  return NextResponse.json({ data: { id: ctx.params.id }, error: null });
}
