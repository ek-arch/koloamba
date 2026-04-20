'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/Badge';
import { TierBadge } from '@/components/dashboard/TierBadge';
import { ScoringGuideModal } from '@/components/admin/ScoringGuideModal';
import { ScoreBreakdown } from '@/components/admin/ScoreBreakdown';
import type { Platform, Submission, Tier } from '@/types';

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

const PLATFORM_LABEL: Record<Platform, string> = {
  x:        'X',
  reddit:   'Reddit',
  telegram: 'Telegram',
};

// Telegram is moderator-graded since we can't fetch engagement.
// Range caps at 3 so Telegram can't outscale X/Reddit.
const TELEGRAM_PRESETS = [
  { value: 0.5, label: 'Low effort / thin comment' },
  { value: 1,   label: 'Baseline (auto-score)' },
  { value: 2,   label: 'Solid contribution' },
  { value: 3,   label: 'Exceptional (max)' },
];

export function ReviewRow({ submission }: { submission: ReviewSubmission }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState<string>(
    submission.moderator_score != null ? String(submission.moderator_score) : '',
  );
  const [notes, setNotes] = useState<string>(submission.moderator_notes ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showMath, setShowMath] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setErr(null);
    const res = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setErr(json.error ?? 'Failed');
      return false;
    }
    return true;
  }

  function onRefetch() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/submissions/${submission.id}/refetch`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErr(json.error ?? 'Refetch failed');
        return;
      }
      router.refresh();
    });
  }

  function onApprove() {
    startTransition(async () => {
      const body: Record<string, unknown> = { status: 'approved' };
      if (score.trim() !== '') {
        const n = Number(score);
        if (!Number.isFinite(n) || n < 0) {
          setErr('Score must be a non-negative number');
          return;
        }
        body.moderator_score = n;
      }
      if (notes.trim() !== submission.moderator_notes) {
        body.moderator_notes = notes.trim() || null;
      }
      const ok = await patch(body);
      if (ok) router.refresh();
    });
  }

  function onReject() {
    startTransition(async () => {
      const ok = await patch({
        status: 'rejected',
        moderator_notes: notes.trim() || null,
      });
      if (ok) router.refresh();
    });
  }

  const u = submission.users;

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {u?.twitter_avatar_url ? (
            <Image
              src={u.twitter_avatar_url}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
              unoptimized
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-bg-card" />
          )}
          <div>
            <div className="font-medium">{u?.twitter_name ?? u?.twitter_handle ?? '—'}</div>
            <div className="text-xs text-muted">@{u?.twitter_handle ?? '?'}</div>
          </div>
          {u && <TierBadge tier={u.tier} showMultiplier={false} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xs border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-primary">
            {PLATFORM_LABEL[submission.platform]}
          </span>
          <StatusBadge status={submission.status} />
          <span className="text-xs text-muted">
            {new Date(submission.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <a
        href={submission.post_url}
        target="_blank"
        rel="noreferrer noopener"
        className="block truncate text-sm text-accent hover:underline"
      >
        {submission.post_url}
      </a>

      {submission.platform === 'x' && (
        <div className="grid grid-cols-2 gap-3 rounded-xs bg-bg-card px-3 py-2 text-xs sm:grid-cols-5">
          <Metric label="Likes"    value={submission.likes} />
          <Metric label="Retweets" value={submission.retweets} />
          <Metric label="Replies"  value={submission.replies} />
          <Metric label="Views"    value={submission.views} />
          <Metric
            label="TwitterScore"
            value={u ? Number(u.twitter_score).toFixed(1) : '—'}
          />
        </div>
      )}
      {submission.platform === 'reddit' && (
        <div className="grid grid-cols-2 gap-3 rounded-xs bg-bg-card px-3 py-2 text-xs sm:grid-cols-3">
          <Metric label="Ups"      value={submission.likes} />
          <Metric label="Comments" value={submission.replies} />
          <Metric
            label="Reddit handle"
            value={u?.reddit_username ? `u/${u.reddit_username}` : '—'}
          />
        </div>
      )}
      {submission.platform === 'telegram' && (
        <div className="grid grid-cols-2 gap-3 rounded-xs bg-bg-card px-3 py-2 text-xs sm:grid-cols-2">
          <Metric
            label="Telegram handle"
            value={u?.telegram_handle ? `@${u.telegram_handle}` : '—'}
          />
          <Metric
            label="Signal"
            value="no external metrics. Open link to review."
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <div className="text-sm">
          <span className="stat-label inline-flex items-center gap-1.5">
            Auto-score
            <button
              type="button"
              onClick={() => setShowMath((s) => !s)}
              title={showMath ? 'Hide math' : 'Show how this was calculated'}
              aria-label="Toggle scoring math"
              aria-expanded={showMath}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted transition hover:border-bg-invert hover:text-text-primary"
            >
              i
            </button>
          </span>
          <div className="mt-1 rounded-xs border border-border bg-bg-card px-3 py-2 font-mono">
            {Number(submission.auto_score).toFixed(2)}
          </div>
        </div>
        <label className="text-sm">
          <span className="stat-label inline-flex items-center gap-1.5">
            Override score (optional)
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setGuideOpen(true);
              }}
              title="Open scoring guide"
              aria-label="Open scoring guide"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted transition hover:border-bg-invert hover:text-text-primary"
            >
              i
            </button>
          </span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Leave blank to use auto-score"
            className="mt-1 w-full rounded-xs border border-border bg-white px-3 py-2 font-mono text-text-primary outline-none focus:border-bg-invert"
          />
          {submission.platform === 'telegram' && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {TELEGRAM_PRESETS.map((preset) => {
                const active = score === String(preset.value);
                return (
                  <button
                    type="button"
                    key={preset.value}
                    onClick={() => setScore(String(preset.value))}
                    title={preset.label}
                    className={`rounded-xs border px-2 py-1 text-xs font-mono transition ${
                      active
                        ? 'border-bg-invert bg-bg-invert text-white'
                        : 'border-border bg-white text-text-primary hover:border-bg-invert'
                    }`}
                  >
                    {preset.value.toFixed(1)}
                  </button>
                );
              })}
              <span className="ml-1 text-[11px] text-muted">
                0.5 low · 1 baseline · 2 solid · 3 exceptional
              </span>
            </div>
          )}
        </label>
        <div className="flex flex-wrap items-end gap-2">
          {submission.platform !== 'telegram' && (
            <button
              type="button"
              onClick={onRefetch}
              disabled={pending}
              className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
              title="Re-pull engagement metrics and recompute auto-score"
            >
              Refetch
            </button>
          )}
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? '…' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={pending}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>

      {showMath && (
        <ScoreBreakdown
          platform={submission.platform}
          likes={submission.likes}
          retweets={submission.retweets}
          replies={submission.replies}
          views={submission.views}
          twitterScore={Number(u?.twitter_score ?? 0)}
          autoScore={Number(submission.auto_score)}
        />
      )}

      <label className="block text-sm">
        <span className="stat-label">Notes</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note for the ambassador"
          className="mt-1 w-full rounded-xs border border-border bg-white px-3 py-2 text-text-primary outline-none focus:border-bg-invert"
        />
      </label>

      {err && <p className="text-xs text-red-400">{err}</p>}

      <ScoringGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        platform={submission.platform}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="mt-0.5 font-mono">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
