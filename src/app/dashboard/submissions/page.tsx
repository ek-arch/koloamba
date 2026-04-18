import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { SubmissionRow } from '@/components/submissions/SubmissionRow';
import type { Submission } from '@/types';

export default async function MySubmissionsPage() {
  const session = await auth();
  // Layout already guards, but we need session.user.id here.
  if (!session?.user?.id) return null;

  const { data } = await supabaseAdmin()
    .from('submissions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  const rows = (data as Submission[] | null) ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My submissions</h1>
          <p className="mt-1 text-muted">Track status and scores for everything you&apos;ve submitted.</p>
        </div>
        <a href="/dashboard/submit" className="btn-primary">Submit new</a>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">No submissions yet.</p>
          <div className="mt-4">
            <a href="/dashboard/submit" className="btn-outline">Submit your first post</a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <SubmissionRow key={s.id} submission={s} />
          ))}
        </div>
      )}
    </main>
  );
}
