import Image from 'next/image';
import { TierBadge } from '@/components/dashboard/TierBadge';
import { formatUsd } from '@/lib/rewards';
import type { LeaderboardRow } from '@/types';

interface Props {
  rows: LeaderboardRow[];
  totalWeighted: number;
  pool: number;
  currentUserId?: string;
}

export function LeaderboardTable({ rows, totalWeighted, pool, currentUserId }: Props) {
  if (rows.length === 0) {
    return (
      <div className="card text-center text-muted">
        No ambassadors yet. Be the first to submit.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Ambassador</th>
            <th className="px-4 py-3 text-left">Tier</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">Weighted</th>
            <th className="px-4 py-3 text-right">Posts</th>
            <th className="px-4 py-3 text-right">Projected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isMe = row.id === currentUserId;
            const share = totalWeighted > 0 ? Number(row.weighted_score) / totalWeighted : 0;
            const projected = share * pool;
            return (
              <tr
                key={row.id}
                className={`border-b border-border/60 last:border-0 ${
                  isMe ? 'bg-accent/5' : 'hover:bg-bg-base/40'
                }`}
              >
                <td className="px-4 py-3 font-mono text-muted">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.twitter_avatar_url ? (
                      <Image
                        src={row.twitter_avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-bg-base" />
                    )}
                    <div>
                      <div className="font-medium">
                        {row.twitter_name ?? row.twitter_handle}
                        {isMe && <span className="ml-2 text-xs text-accent">(you)</span>}
                      </div>
                      <div className="text-xs text-muted">@{row.twitter_handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={row.tier} showMultiplier={false} />
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {Number(row.total_points).toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {Number(row.weighted_score).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">
                  {row.approved_submissions}
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent">
                  {pool > 0 ? formatUsd(projected) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
