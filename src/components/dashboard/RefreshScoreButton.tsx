'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshScoreButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch('/api/twitter-score/refresh', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErr(json.error ?? 'Refresh failed');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline disabled:opacity-50"
      >
        {pending ? 'Refreshing…' : 'Refresh'}
      </button>
      {err && <span className="text-[10px] text-red-400">{err}</span>}
    </div>
  );
}
