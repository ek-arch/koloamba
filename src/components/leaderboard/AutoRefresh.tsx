'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Refresh the server-rendered parent every `intervalMs`, plus immediately when
// the tab regains focus. Cheap way to keep the leaderboard live without
// wiring Supabase realtime.
export function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => router.refresh();
    const id = window.setInterval(tick, intervalMs);
    const onFocus = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
