import { StatusBadge } from '@/components/ui/Badge';
import type { Platform, Submission } from '@/types';

const PLATFORM_LABEL: Record<Platform, string> = {
  x:        'X',
  reddit:   'Reddit',
  telegram: 'Telegram',
};

export function SubmissionRow({ submission: s }: { submission: Submission }) {
  const created = new Date(s.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Engagement labels vary by platform — show only fields the platform has.
  let engagementLine: string;
  switch (s.platform) {
    case 'x':
      engagementLine = `♥ ${s.likes.toLocaleString()} · ⟲ ${s.retweets.toLocaleString()} · 👁 ${s.views.toLocaleString()}`;
      break;
    case 'reddit':
      engagementLine = `▲ ${s.likes.toLocaleString()} · 💬 ${s.replies.toLocaleString()}`;
      break;
    case 'telegram':
      engagementLine = 'manually scored';
      break;
  }

  return (
    <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="mono-sm rounded-xs border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] text-text-primary">
            {PLATFORM_LABEL[s.platform]}
          </span>
          <StatusBadge status={s.status} />
          <span className="text-xs text-muted">{created}</span>
        </div>
        <a
          href={s.post_url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 block truncate text-sm text-accent hover:underline"
        >
          {s.post_url}
        </a>
        {s.moderator_notes && (
          <p className="mt-1 text-xs text-muted">Note: {s.moderator_notes}</p>
        )}
      </div>

      <div className="flex gap-6 text-right">
        <div>
          <div className="stat-label">Score</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-text-primary">
            {Number(s.final_score).toFixed(1)}
          </div>
        </div>
        <div>
          <div className="stat-label">Engagement</div>
          <div className="mt-1 text-xs text-muted tabular-nums">{engagementLine}</div>
        </div>
      </div>
    </div>
  );
}
