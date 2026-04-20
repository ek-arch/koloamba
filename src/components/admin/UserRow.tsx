'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Role, Tier, User } from '@/types';

const TIERS: Tier[] = ['bronze', 'silver', 'gold'];
const ROLES: Role[] = ['ambassador', 'moderator', 'admin'];

export function UserRow({ user, canChangeRole }: { user: User; canChangeRole: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tier, setTier] = useState<Tier>(user.tier);
  const [oldPoints, setOldPoints] = useState<string>(String(user.old_points));
  const [role, setRole] = useState<Role>(user.role);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    tier !== user.tier ||
    role !== user.role ||
    Number(oldPoints) !== Number(user.old_points);

  function onSave() {
    setErr(null);
    setSaved(false);

    const n = Number(oldPoints);
    if (!Number.isFinite(n) || n < 0) {
      setErr('KOLO points must be a non-negative number');
      return;
    }

    const body: Record<string, unknown> = {};
    if (tier !== user.tier) body.tier = tier;
    if (Number(oldPoints) !== Number(user.old_points)) body.old_points = n;
    if (canChangeRole && role !== user.role) body.role = role;

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
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
    <div className="card grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center">
      <div className="flex items-center gap-3">
        {user.twitter_avatar_url ? (
          <Image
            src={user.twitter_avatar_url}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
            unoptimized
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-bg-card" />
        )}
        <div className="min-w-0">
          <div className="truncate font-medium">{user.twitter_name ?? user.twitter_handle}</div>
          <div className="truncate text-xs text-muted">@{user.twitter_handle}</div>
        </div>
      </div>

      <label className="text-sm">
        <span className="stat-label">Tier</span>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as Tier)}
          className="mt-1 w-full rounded-xs border border-border bg-white px-2 py-1.5 capitalize outline-none focus:border-bg-invert"
        >
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className="text-sm">
        <span className="stat-label">KOLO points</span>
        <input
          type="number"
          min="0"
          value={oldPoints}
          onChange={(e) => setOldPoints(e.target.value)}
          className="mt-1 w-full rounded-xs border border-border bg-white px-2 py-1.5 font-mono outline-none focus:border-bg-invert"
        />
      </label>

      <label className="text-sm">
        <span className="stat-label">Role</span>
        <select
          value={role}
          disabled={!canChangeRole}
          onChange={(e) => setRole(e.target.value as Role)}
          className="mt-1 w-full rounded-xs border border-border bg-white px-2 py-1.5 capitalize outline-none focus:border-bg-invert disabled:opacity-50"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || pending}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? '…' : 'Save'}
        </button>
        {saved && <span className="text-xs text-accent">Saved</span>}
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
    </div>
  );
}
