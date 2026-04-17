'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Campaign, CampaignStatus } from '@/types';

const STATUSES: CampaignStatus[] = ['draft', 'active', 'completed'];

export function CampaignForm({ campaign }: { campaign: Campaign | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(campaign?.name ?? 'Genesis Sprint');
  const [description, setDescription] = useState(campaign?.description ?? '');
  const [pool, setPool] = useState(String(campaign?.pool_amount ?? 0));
  const [maxScore, setMaxScore] = useState(String(campaign?.max_score ?? 100));
  const [startDate, setStartDate] = useState(toDate(campaign?.start_date));
  const [endDate, setEndDate] = useState(toDate(campaign?.end_date));
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? 'active');

  function onSave() {
    setErr(null);
    setSaved(false);

    const poolNum = Number(pool);
    const maxNum = Number(maxScore);
    if (!Number.isFinite(poolNum) || poolNum < 0) return setErr('Pool must be non-negative');
    if (!Number.isFinite(maxNum) || maxNum <= 0) return setErr('Max score must be positive');
    if (!startDate || !endDate) return setErr('Start and end dates are required');

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      pool_amount: poolNum,
      max_score: maxNum,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    startTransition(async () => {
      const res = await fetch('/api/admin/campaign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErr(json.error ?? 'Failed');
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-4">
      <Row label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </Row>
      <Row label="Description">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
        />
      </Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Pool amount (USD)">
          <input
            type="number"
            min="0"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
            className="input font-mono"
          />
        </Row>
        <Row label="Max score per submission">
          <input
            type="number"
            min="1"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="input font-mono"
          />
        </Row>
        <Row label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input font-mono"
          />
        </Row>
        <Row label="End date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input font-mono"
          />
        </Row>
        <Row label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
            className="input capitalize"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Row>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-xs text-accent">Saved</span>}
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="stat-label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function toDate(iso: string | undefined | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}
