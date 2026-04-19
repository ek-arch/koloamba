'use client';

import { useEffect } from 'react';
import type { Platform } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Platform section to highlight + scroll to when the modal opens. */
  platform: Platform;
}

export function ScoringGuideModal({ open, onClose, platform }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`scoring-section-${platform}`);
    if (el) el.scrollIntoView({ block: 'start' });
  }, [open, platform]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-bg-base shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-6 py-4">
          <h2 className="text-lg font-semibold">Scoring & moderation guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline px-3 py-1 text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-5 text-sm leading-relaxed">
          <section>
            <h3 className="text-base font-semibold">Default rule — don't override</h3>
            <p className="mt-1 text-muted">
              On X and Reddit the auto-score already reflects measurable engagement.
              Leave it alone ~80% of the time. Override only when the formula misses
              something it structurally can&apos;t see (bots, off-topic posts,
              niche-subreddit quality). If you can&apos;t articulate why, don&apos;t
              override.
            </p>
          </section>

          <Section
            id="scoring-section-x"
            active={platform === 'x'}
            title="X (Twitter)"
            formula="engagement × (1 + TwitterScore / 100), cap 20"
            rows={[
              ['Dead tweet (≤20 likes, low views)', '0.2 – 0.8'],
              ['Modest (~100 likes, few RTs)',      '1.5 – 3'],
              ['Solid (300+ likes, 50+ RTs)',       '5 – 8'],
              ['Viral (1000+ likes, 200+ RTs)',     '10 – 16'],
              ['Home run (max engagement)',         '18 – 20'],
            ]}
            downReasons={[
              'Bot or farmed engagement (generic mass replies, weird like ratio)',
              'Off-topic — post barely mentions Kolo, hashtag-stuffed',
              'Recycled angle from a prior submission',
            ]}
            upReasons={[
              'Low engagement but high-quality educational thread',
              'Verifiable off-platform impact (rare — usually not warranted)',
            ]}
            heuristic="If you're tempted to override X, it's almost always down, not up."
          />

          <Section
            id="scoring-section-reddit"
            active={platform === 'reddit'}
            title="Reddit"
            formula="(ups + comments × 1.5) / 50, cap 10"
            rows={[
              ['Posted, ~nothing (≤5 ups, 0 comments)',    '~0.1'],
              ['Small traction (20 ups, 5 comments)',      '~0.55'],
              ['Solid (50 ups, 15 comments)',              '~1.45'],
              ['Hit front page (200+ ups, 40+ comments)',  '5+'],
              ['Reddit viral (500+ ups)',                  '10 (cap)'],
            ]}
            downReasons={[
              'Cross-posted to a spam subreddit to farm ups',
              'Comment thread is the ambassador replying to themselves',
            ]}
            upReasons={[
              'Posted in a highly relevant niche sub — 30 ups in r/ethfinance > 200 in a generic crypto sub',
              'Thoughtful long-form post that sparked real discussion',
            ]}
            heuristic="Context beats raw numbers on Reddit. A small niche sub can outweigh a generic big one."
          />

          <section
            id="scoring-section-telegram"
            className={`space-y-3 rounded-xl border p-4 ${
              platform === 'telegram' ? 'border-accent' : 'border-border'
            }`}
          >
            <div>
              <h3 className="text-base font-semibold">Telegram</h3>
              <p className="mt-1 font-mono text-xs text-muted">
                Auto-score is a flat 1.0. Use the quick-pick below the score input.
              </p>
            </div>

            <div className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-2 text-xs">
              <Header>Pick</Header>
              <Header>When</Header>
              <Header>Example</Header>

              <Cell mono>0.5</Cell>
              <Cell>Minimal effort, clearly farming</Cell>
              <Cell>&quot;🔥🔥🔥&quot;, &quot;great project&quot;, emoji dumps, one-word replies</Cell>

              <Cell mono>1.0</Cell>
              <Cell>Baseline — showed up, engaged</Cell>
              <Cell>Short on-topic comment, brief genuine reply</Cell>

              <Cell mono>2.0</Cell>
              <Cell>Solid, substantive contribution</Cell>
              <Cell>Multi-sentence comment that adds info, answers a question, tags people meaningfully</Cell>

              <Cell mono>3.0</Cell>
              <Cell>Exceptional — rare</Cell>
              <Cell>Thread-starter in a big public group that drew 10+ replies, or pinned/highlighted explainer</Cell>
            </div>

            <p className="text-xs text-muted">
              <strong>Key heuristic:</strong> would this comment exist without
              Kolo&apos;s incentive program? Organic & useful → 1–2. Clearly farming →
              0.5. Stranger would read and learn → 2–3.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-bg-card p-4">
            <h3 className="text-base font-semibold">When in doubt</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Open the link. Read the actual post.</li>
              <li>
                Ask: &quot;does this deserve more or less than the auto-score says?&quot;
                If you can&apos;t articulate why — leave it auto and move on.
              </li>
              <li>Use the notes field to log <em>why</em> you adjusted.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  active,
  title,
  formula,
  rows,
  downReasons,
  upReasons,
  heuristic,
}: {
  id: string;
  active: boolean;
  title: string;
  formula: string;
  rows: [string, string][];
  downReasons: string[];
  upReasons: string[];
  heuristic: string;
}) {
  return (
    <section
      id={id}
      className={`space-y-3 rounded-xl border p-4 ${
        active ? 'border-accent' : 'border-border'
      }`}
    >
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 font-mono text-xs text-muted">{formula}</p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
        <Header>Post profile</Header>
        <Header>Auto-score</Header>
        {rows.map(([profile, score]) => (
          <RowPair key={profile} profile={profile} score={score} />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-red-400">Override DOWN when</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted">
            {downReasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-accent">Override UP when</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted">
            {upReasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </div>

      <p className="text-xs italic text-muted">{heuristic}</p>
    </section>
  );
}

function RowPair({ profile, score }: { profile: string; score: string }) {
  return (
    <>
      <div className="text-text-primary">{profile}</div>
      <div className="font-mono text-muted">{score}</div>
    </>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="stat-label border-b border-border pb-1">{children}</div>
  );
}

function Cell({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div className={mono ? 'font-mono text-text-primary' : 'text-muted'}>
      {children}
    </div>
  );
}
