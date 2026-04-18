interface TickerProps {
  pool: number;
  daysLeft: number;
  ambassadors: number;
  postsApproved: number;
  sprintDay: number;
  sprintLength: number;
  avgScore?: number;
  lastPayout?: { amount: number; handle: string } | null;
}

/**
 * Full-bleed black ticker — CSS-animated (42s linear scroll via .ticker-track).
 * Items render 3× so the -50% translateX loop is seamless.
 */
export function Ticker({
  pool,
  daysLeft,
  ambassadors,
  postsApproved,
  sprintDay,
  sprintLength,
  avgScore,
  lastPayout,
}: TickerProps) {
  const items: React.ReactNode[] = [
    <>
      <b>Sprint</b> <span>day {sprintDay} / {sprintLength} ·</span>
    </>,
    <>
      <b>Pool</b> <em>${pool.toLocaleString()}</em>
    </>,
    <>
      <b>Ambassadors</b> <em>{ambassadors.toLocaleString()}</em>
    </>,
    <>
      <b>Posts approved</b> <em>{postsApproved.toLocaleString()}</em>
    </>,
  ];
  if (avgScore !== undefined) {
    items.push(
      <>
        <b>Avg score</b> <em>{avgScore.toFixed(1)}</em>
      </>
    );
  }
  if (lastPayout) {
    items.push(
      <>
        <b>Last payout</b> <em>${lastPayout.amount.toLocaleString()} → {lastPayout.handle}</em>
      </>
    );
  }
  items.push(
    <>
      <b>Days left</b> <em>{daysLeft}</em>
    </>,
    <>
      <b>Tier caps</b> <span>bronze 1.0×</span> <span>silver 1.2×</span> <span>gold 1.5×</span>
    </>
  );

  // Render 3× to keep the -50% loop continuous across all viewports.
  const loops = 3;

  return (
    <div className="ticker" role="marquee" aria-hidden>
      <div className="ticker-track">
        {Array.from({ length: loops }).flatMap((_, loopIdx) =>
          items.map((it, i) => <span key={`${loopIdx}-${i}`}>{it}</span>)
        )}
      </div>
    </div>
  );
}
