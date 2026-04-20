'use client';

import { useState } from 'react';
import type { Tier } from '@/types';

interface Props {
  /** Starting points from the user's own row (capped at 100). */
  initialPoints: number;
  /** The user's locked tier — set by their KOLO balance, not chosen here. */
  tier: Tier;
  /** The user's tier multiplier from the users row. */
  multiplier: number;
  /** Σ weighted scores from every OTHER ambassador — used as the denominator floor. */
  sigmaOthers: number;
  /** Active campaign pool. */
  pool: number;
}

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold:   'Gold',
};

// Effort-to-target math. These are "typical-strong" per-post scores an
// engaged ambassador can realistically hit — not the theoretical ceiling,
// not the average. Used purely for rough guidance on the dashboard.
//
//   X        — solid engagement × moderate TwitterScore credibility
//   Reddit   — a post that lands in a relevant subreddit's top of day
//   Telegram — a solid moderator-graded comment (preset: 2)
const TYPICAL_SCORE = { x: 10, reddit: 5, telegram: 2 };

export function RewardCalculator({
  initialPoints,
  tier,
  multiplier,
  sigmaOthers,
  pool,
}: Props) {
  const [target, setTarget] = useState(
    Math.min(100, Math.max(0, Math.round(initialPoints))),
  );

  const myWeighted = target * multiplier;
  const denom = sigmaOthers + myWeighted;
  const share = denom > 0 ? (myWeighted / denom) * pool : 0;
  const delta = Math.max(0, target - initialPoints);

  return (
    <div className="calc">
      <h3>Reward calculator</h3>
      <div className="calc-sub">
        Slide to set a target. See what it takes to get there.
      </div>

      <div className="slider-row">
        <div className="slider-label">
          <span>target points</span>
          <span>{target} / 100</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div className="slider-label" style={{ marginBottom: 10 }}>
          <span>tier</span>
          <span>
            {TIER_LABEL[tier]} · {multiplier.toFixed(1)}× multiplier
          </span>
        </div>
        <div
          className="mono-sm"
          style={{ color: 'var(--muted)', lineHeight: 1.5 }}
        >
          Locked. Set by your KOLO balance.
        </div>
      </div>

      <div className="calc-result">
        <div className="calc-result-num">${share.toFixed(0)}</div>
        <div className="calc-result-lbl">projected share</div>
      </div>

      {delta > 0 && (
        <div
          className="mono-sm"
          style={{ marginTop: 14, lineHeight: 1.7, color: 'var(--muted)' }}
        >
          <div style={{ color: 'var(--ink)', marginBottom: 2 }}>
            To add {delta.toFixed(0)} more points, roughly:
          </div>
          <div>
            · {Math.max(1, Math.ceil(delta / TYPICAL_SCORE.x))} solid X post
            {Math.ceil(delta / TYPICAL_SCORE.x) === 1 ? '' : 's'}
            {'  '}
            <span style={{ opacity: 0.5 }}>
              (~{TYPICAL_SCORE.x} pts/post)
            </span>
          </div>
          <div>
            · {Math.max(1, Math.ceil(delta / TYPICAL_SCORE.reddit))} front-page
            Reddit post{Math.ceil(delta / TYPICAL_SCORE.reddit) === 1 ? '' : 's'}
            {'  '}
            <span style={{ opacity: 0.5 }}>
              (~{TYPICAL_SCORE.reddit} pts/post)
            </span>
          </div>
          <div>
            · {Math.max(1, Math.ceil(delta / TYPICAL_SCORE.telegram))} solid
            Telegram comment
            {Math.ceil(delta / TYPICAL_SCORE.telegram) === 1 ? '' : 's'}
            {'  '}
            <span style={{ opacity: 0.5 }}>
              (~{TYPICAL_SCORE.telegram} pts/post)
            </span>
          </div>
        </div>
      )}

      <div
        className="mono-sm"
        style={{ marginTop: 12, lineHeight: 1.6, color: 'var(--muted)' }}
      >
        ({target} × {multiplier.toFixed(1)}) ÷ ({denom.toFixed(0)}) × $
        {pool.toLocaleString()}
      </div>
    </div>
  );
}
