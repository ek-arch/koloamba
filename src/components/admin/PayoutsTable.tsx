'use client';

import { useMemo, useState } from 'react';
import type { Tier } from '@/types';
import {
  chainLabel,
  maskAddress,
  tokenLabel,
  type WalletChain,
  type WalletToken,
} from '@/lib/wallet';

export interface PayoutRow {
  id: string;
  twitterHandle: string | null;
  twitterName: string | null;
  telegramHandle: string | null;
  tier: Tier;
  tierMultiplier: number;
  totalPoints: number;
  weightedScore: number;
  projectedShare: number;
  walletAddress: string | null;
  walletChain: WalletChain | null;
  walletToken: WalletToken | null;
}

type Filter = 'all' | 'has_wallet' | 'missing_wallet';

export function PayoutsTable({
  rows,
  campaignName,
}: {
  rows: PayoutRow[];
  campaignName: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'has_wallet') return rows.filter((r) => r.walletAddress);
    if (filter === 'missing_wallet') return rows.filter((r) => !r.walletAddress);
    return rows;
  }, [rows, filter]);

  const missingCount = rows.filter((r) => !r.walletAddress).length;

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400);
    });
  }

  function downloadCsv() {
    const header = [
      'rank',
      'twitter_handle',
      'telegram_handle',
      'tier',
      'tier_multiplier',
      'total_points',
      'weighted_score',
      'projected_usd',
      'chain',
      'token',
      'wallet_address',
    ];
    const lines = rows.map((r, i) => [
      i + 1,
      r.twitterHandle ?? '',
      r.telegramHandle ?? '',
      r.tier,
      r.tierMultiplier.toFixed(1),
      r.totalPoints.toFixed(2),
      r.weightedScore.toFixed(2),
      r.projectedShare.toFixed(2),
      r.walletChain ?? '',
      r.walletToken ?? '',
      r.walletAddress ?? '',
    ]);
    const csv =
      [header, ...lines]
        .map((row) =>
          row
            .map((cell) => {
              const s = String(cell);
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(','),
        )
        .join('\n') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `payouts-${slug}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`All (${rows.length})`}
          />
          <FilterChip
            active={filter === 'has_wallet'}
            onClick={() => setFilter('has_wallet')}
            label={`With wallet (${rows.length - missingCount})`}
          />
          <FilterChip
            active={filter === 'missing_wallet'}
            onClick={() => setFilter('missing_wallet')}
            label={`Missing wallet (${missingCount})`}
          />
        </div>
        <button type="button" onClick={downloadCsv} className="btn-primary px-4 py-2 text-sm">
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-muted">No rows match the filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Ambassador</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2 text-right">Pts</th>
                <th className="px-3 py-2 text-right">Weighted</th>
                <th className="px-3 py-2 text-right">Projected $</th>
                <th className="px-3 py-2">Chain / Token</th>
                <th className="px-3 py-2">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const rank = rows.indexOf(r) + 1;
                const missing = !r.walletAddress;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border ${missing ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-muted">{rank}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">
                        {r.twitterName ??
                          (r.twitterHandle ? `@${r.twitterHandle}` : '—')}
                      </div>
                      <div className="text-xs text-muted">
                        {r.twitterHandle ? `@${r.twitterHandle}` : ''}
                        {r.twitterHandle && r.telegramHandle ? ' · ' : ''}
                        {r.telegramHandle ? `tg:@${r.telegramHandle}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize">
                      {r.tier}{' '}
                      <span className="text-xs text-muted">
                        {r.tierMultiplier.toFixed(1)}×
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.totalPoints.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.weightedScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      ${r.projectedShare.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {r.walletChain && r.walletToken ? (
                        <>
                          {chainLabel(r.walletChain)}
                          <br />
                          <span className="text-muted">
                            {tokenLabel(r.walletToken)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {r.walletAddress ? (
                        <button
                          type="button"
                          onClick={() => copy(r.walletAddress!)}
                          title={r.walletAddress}
                          className="font-mono text-xs text-accent hover:underline"
                        >
                          {copied === r.walletAddress
                            ? 'Copied!'
                            : maskAddress(r.walletAddress)}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-red-500">
                          missing
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xs border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-bg-invert bg-bg-invert text-white'
          : 'border-border text-text-primary hover:border-bg-invert'
      }`}
    >
      {label}
    </button>
  );
}
