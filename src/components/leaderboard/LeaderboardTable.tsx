'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { twitterCredibilityMultiplier } from '@/lib/scoring';
import type { LeaderboardRow, Tier } from '@/types';

type TabKey = 'all' | Tier;

interface Props {
  rows: LeaderboardRow[];
  totalWeighted: number;
  currentUserId?: string;
}

/**
 * Leaderboard table — client component so chip filters + search are local.
 * Grid layout matches the prototype: 60px 2fr 1fr 1fr 1fr 1fr 40px.
 * Top-3 get accent rank numbers only when viewing "all" with no query.
 */
export function LeaderboardTable({ rows, totalWeighted, currentUserId }: Props) {
  const [tab, setTab] = useState<TabKey>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let out = rows;
    if (tab !== 'all') out = out.filter((r) => r.tier === tab);
    if (q) {
      const needle = q.toLowerCase();
      out = out.filter(
        (r) =>
          r.twitter_handle.toLowerCase().includes(needle) ||
          (r.twitter_name?.toLowerCase().includes(needle) ?? false)
      );
    }
    return out;
  }, [rows, tab, q]);

  const counts: Record<TabKey, number> = {
    all: rows.length,
    gold: rows.filter((r) => r.tier === 'gold').length,
    silver: rows.filter((r) => r.tier === 'silver').length,
    bronze: rows.filter((r) => r.tier === 'bronze').length,
  };

  const topHighlightActive = tab === 'all' && q === '';

  const tabs: { k: TabKey; label: string }[] = [
    { k: 'all', label: 'All' },
    { k: 'gold', label: 'Gold' },
    { k: 'silver', label: 'Silver' },
    { k: 'bronze', label: 'Bronze' },
  ];

  return (
    <>
      <div className="lb-filters">
        {tabs.map((c) => (
          <button
            key={c.k}
            className={`chip${tab === c.k ? ' active' : ''}`}
            onClick={() => setTab(c.k)}
            type="button"
          >
            {c.label} <span className="mono">{counts[c.k]}</span>
          </button>
        ))}
        <input
          className="search-input"
          placeholder="Search handle or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="lb">
          <div className="px-5 py-12 text-center text-sm text-muted">
            No ambassadors match this filter yet.
          </div>
        </div>
      ) : (
        <div className="lb">
          <div className="lb-head">
            <div>Rank</div>
            <div>Ambassador</div>
            <div className="hide-m">Posts</div>
            <div>Tier</div>
            <div>Points</div>
            <div className="hide-m">Weighted</div>
            <div />
          </div>

          {filtered.map((r, i) => {
            const isMe = r.id === currentUserId;
            const isTop3 = topHighlightActive && i < 3;
            const share = totalWeighted > 0 ? Number(r.weighted_score) / totalWeighted : 0;

            return (
              <div key={r.id} className={`lb-row${isMe ? ' is-me' : ''}`}>
                <div className={`lb-rank${isTop3 ? ' lb-rank-top' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div className="lb-user">
                  {r.twitter_avatar_url ? (
                    <Image
                      src={r.twitter_avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="lb-avatar">
                      {r.twitter_handle.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="lb-handle truncate">
                      @{r.twitter_handle}
                      {r.twitter_name && (
                        <small className="truncate">{r.twitter_name}</small>
                      )}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal text-accent">(you)</span>
                      )}
                    </div>
                    <div
                      className="mono-sm"
                      title="Credibility boost from TwitterScore applies to X posts only. Tier multiplier (from KOLO balance) applies to the final weighted score."
                    >
                      cred ×{twitterCredibilityMultiplier(Number(r.twitter_score)).toFixed(2)}
                      {' · '}
                      tier ×{Number(r.tier_multiplier).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="lb-num hide-m">{r.approved_submissions}</div>

                <div>
                  <span className={`lb-tier ${r.tier}`}>
                    <span className="dot" aria-hidden />
                    {r.tier}
                  </span>
                </div>

                <div className="lb-num">{Number(r.total_points).toFixed(0)}</div>

                <div
                  className="lb-num hide-m"
                  style={{ color: share > 0 ? 'var(--accent)' : 'var(--muted)' }}
                  title={share > 0 ? `Share ≈ ${(share * 100).toFixed(2)}% of pool` : ''}
                >
                  {Number(r.weighted_score).toFixed(1)}
                </div>

                <div className="lb-arrow">→</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="mono-sm">
          Showing {filtered.length} of {rows.length}
        </div>
      </div>
    </>
  );
}
