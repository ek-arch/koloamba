import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { ReviewRow } from '@/components/admin/ReviewRow';
import { ScoringGuideButton } from '@/components/admin/ScoringGuideButton';
import type { Submission, SubmissionStatus, Tier } from '@/types';

type ReviewSubmission = Submission & {
  users: {
    twitter_handle: string;
    twitter_name: string | null;
    twitter_avatar_url: string | null;
    tier: Tier;
    twitter_score: number;
    reddit_username: string | null;
    telegram_handle: string | null;
  } | null;
};

const TABS: { value: SubmissionStatus; label: string }[] = [
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (TABS.find((t) => t.value === searchParams.status)?.value ?? 'pending');

  const admin = supabaseAdmin();
  const { data } = await admin
    .from('submissions')
    .select(
      '*, users:user_id(twitter_handle, twitter_name, twitter_avatar_url, tier, twitter_score, reddit_username, telegram_handle)',
    )
    .eq('status', status)
    .order('created_at', { ascending: false });

  const rows = (data as ReviewSubmission[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Review queue</h1>
          <p className="mt-1 text-muted">
            Approve, reject, or override the auto-score on ambassador submissions.
          </p>
        </div>
        <ScoringGuideButton />
      </div>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/review?status=${t.value}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              t.value === status
                ? 'border-bg-invert text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-primary'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center text-muted">No {status} submissions.</div>
      ) : (
        <div className="space-y-4">
          {rows.map((s) => (
            <ReviewRow key={s.id} submission={s} />
          ))}
        </div>
      )}
    </div>
  );
}
