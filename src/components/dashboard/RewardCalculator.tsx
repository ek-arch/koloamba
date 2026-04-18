'use client';

import { useState } from 'react';
import type { Tier } from '@/types';

interface Props {
  /** Starting points from the user's own row (capped at 100). */
  initialPoints: number;
  /** Starting tier from the user's own row. */
  initialTier: Tier;
  /** Σ weighted scores from every OTHER ambassador — used as the denominator floor. */
  sigmaOthers: number;
  /** Active campaign pool. */
  pool: number;
}

const TIER_PILLS: { key: Tier; mult: number }[] = [
  { key: 'bronze', mult: 1.0 },
  { key: 'silver', mult: 1.2 },
  { key: 'gold', mult: 1.5 },
];

/**
 * Live reward projection — slider + tier segment. Formula:
 *   share = (points × mult) / (Σ_others + points × mult) × pool
 */
export function RewardCalculator({ initialPoints, initialTier, sigmaOthers, pool }: Props) {
  const [simTier, setSimTier] = useState<Tier>(initialTier);
  const [simPoints, setSimPoints] = useState(Math.min(100, Math.max(0, Math.round(initialPoints))));

  const mult = TIER_PILLS.find((t) => t.key === simTier)!.mult;
  const myWeighted = simPoints * mult;
  const denom = sigmaOthers + myWeighted;
  const share = denom > 0 ? (myWeighted / denom) * pool : 0;

  return (
    <div className="calc">
      <h3>Reward calculator</h3>
      <div className="calc-sub">Live projection based on your points and tier.</div>

      <div className="slider-row">
        <div className="slider-label">
          <span>your points</span>
          <span>{simPoints} / 100</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={simPoints}
          onChange={(e) => setSimPoints(Number(e.target.value))}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div className="slider-label" style={{ marginBottom: 10 }}>
          <span>tier</span>
          <span>{mult.toFixed(1)}× multiplier</span>
        </div>
        <div className="tier-pills">
          {TIER_PILLS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tier-pill${simTier === t.key ? ' active' : ''}`}
              onClick={() => setSimTier(t.key)}
            >
              <span>{t.key}</span>
              <small>{t.mult.toFixed(1)}×</small>
            </button>
          ))}
        </div>
      </div>

      <div className="calc-result">
        <div className="calc-result-num">${share.toFixed(0)}</div>
        <div className="calc-result-lbl">projected share</div>
      </div>
      <div className="mono-sm" style={{ marginTop: 12, lineHeight: 1.6 }}>
        ({simPoints} × {mult.toFixed(1)}) ÷ ({denom.toFixed(0)}) × ${pool.toLocaleString()}
      </div>
    </div>
  );
}
