import type { Platform } from '@/types';
import { twitterCredibilityMultiplier } from '@/lib/scoring';

interface Props {
  platform: Platform;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  /** The ambassador's TwitterScore at review time. Ignored for Reddit / Telegram. */
  twitterScore: number;
  /** The auto-score stored on the submission row. Shown for cross-check. */
  autoScore: number;
}

/**
 * Inline step-by-step breakdown of how the auto_score for a submission was
 * computed. Reflects the formulas in `lib/scoring.ts` exactly. Designed to
 * appear below the Auto-score field in the review row when the moderator
 * taps the (i) button, so they can see _why_ the number is what it is
 * before overriding.
 */
export function ScoreBreakdown({
  platform,
  likes,
  retweets,
  replies,
  views,
  twitterScore,
  autoScore,
}: Props) {
  if (platform === 'x') {
    const raw = likes + retweets * 2 + replies * 1.5 + views * 0.01;
    const engagement = Math.min(raw / 100, 10);
    const credibility = twitterCredibilityMultiplier(twitterScore);
    return (
      <Shell>
        <Line>
          <b>1. Raw engagement</b>{' '}
          = likes + RT×2 + replies×1.5 + views×0.01
        </Line>
        <Line muted>
          = {likes} + {retweets}×2 + {replies}×1.5 + {views}×0.01 ={' '}
          <b>{raw.toFixed(2)}</b>
        </Line>
        <Line>
          <b>2. Engagement score</b> = min(raw / 100, 10) ={' '}
          <b>{engagement.toFixed(3)}</b>
        </Line>
        <Line>
          <b>3. Credibility boost</b> = 1 + min(TS/50, 1) × 2
        </Line>
        <Line muted>
          = 1 + min({twitterScore.toFixed(1)}/50, 1) × 2 ={' '}
          <b>×{credibility.toFixed(3)}</b>
        </Line>
        <Line>
          <b>4. Auto-score</b> = engagement × credibility ={' '}
          {engagement.toFixed(3)} × {credibility.toFixed(3)} ={' '}
          <b>{autoScore.toFixed(2)}</b>
        </Line>
      </Shell>
    );
  }

  if (platform === 'reddit') {
    const raw = likes + replies * 1.5;
    const engagement = Math.min(raw / 50, 10);
    return (
      <Shell>
        <Line>
          <b>1. Raw engagement</b> = ups + comments×1.5
        </Line>
        <Line muted>
          = {likes} + {replies}×1.5 = <b>{raw.toFixed(2)}</b>
        </Line>
        <Line>
          <b>2. Engagement score</b> = min(raw / 50, 10) ={' '}
          <b>{engagement.toFixed(2)}</b>
        </Line>
        <Line muted>
          (no credibility multiplier on Reddit — pure engagement)
        </Line>
        <Line>
          <b>3. Auto-score</b> = <b>{autoScore.toFixed(2)}</b>
        </Line>
      </Shell>
    );
  }

  // Telegram
  return (
    <Shell>
      <Line>
        Telegram posts auto-score at a flat <b>1.00</b>.
      </Line>
      <Line muted>
        No public engagement signal we can fetch. Use the 0.5 / 1 / 2 / 3
        quick-pick to grade the submission by quality.
      </Line>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-2 rounded-xs border border-border bg-bg-card px-3 py-2 text-xs leading-relaxed"
      style={{
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
      }}
    >
      {children}
    </div>
  );
}

function Line({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div style={muted ? { color: 'var(--muted)' } : undefined}>{children}</div>
  );
}
