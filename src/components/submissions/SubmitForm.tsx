'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { detectPlatformFromUrl } from '@/lib/url-parser';
import { twitterCredibilityMultiplier } from '@/lib/scoring';
import type { Platform } from '@/types';

const PLATFORMS: { k: Platform; label: string; placeholder: string; hint: string }[] = [
  {
    k: 'x',
    label: 'X',
    placeholder: 'https://x.com/yourhandle/status/1234567890',
    hint: 'Auto-scored from likes, retweets, replies, views × your TwitterScore.',
  },
  {
    k: 'reddit',
    label: 'Reddit',
    placeholder: 'https://www.reddit.com/r/subname/comments/abc123/title/',
    hint: 'Auto-scored from ups + comments. Link u/ on the dashboard first to verify ownership.',
  },
  {
    k: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/channel/123  or  t.me/channel/123?comment=456',
    hint: 'Scored manually by a moderator. Posts in public channels, comments in groups, all work.',
  },
];

export function SubmitForm({ twitterScore = 0 }: { twitterScore?: number }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [manualPlatform, setManualPlatform] = useState<Platform | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const detected = useMemo(() => detectPlatformFromUrl(url), [url]);
  const active: Platform = manualPlatform ?? detected ?? 'x';
  const activeMeta = PLATFORMS.find((p) => p.k === active)!;
  const xMultiplier = twitterCredibilityMultiplier(twitterScore);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setMessage({ kind: 'err', text: json.error ?? `HTTP ${res.status}` });
      } else {
        setMessage({ kind: 'ok', text: 'Submitted! A moderator will review it shortly.' });
        setUrl('');
        router.refresh();
      }
    } catch (e) {
      setMessage({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Platform chips — auto-highlight from URL; user can click to override */}
      <div className="lb-filters" style={{ marginBottom: 0 }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.k}
            type="button"
            className={`chip${active === p.k ? ' active' : ''}`}
            onClick={() => setManualPlatform(p.k)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="url" className="mb-2 block text-sm font-semibold text-muted">
          Post URL
        </label>
        <input
          id="url"
          type="url"
          required
          placeholder={activeMeta.placeholder}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            // Let URL drive the chip again once the user types
            setManualPlatform(null);
          }}
          className="w-full rounded-xs border border-border bg-white px-4 py-2.5 font-mono text-text-primary placeholder:text-muted focus:border-bg-invert focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted">{activeMeta.hint}</p>
        {active === 'x' && (
          <p className="mt-1 text-xs text-muted">
            Your TwitterScore is <b>{twitterScore.toFixed(0)}</b>, giving X posts a{' '}
            <b style={{ color: 'var(--ink)' }}>×{xMultiplier.toFixed(2)}</b> credibility boost on
            top of engagement.
          </p>
        )}
      </div>

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit post'}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.kind === 'ok' ? 'text-[#10b981]' : 'text-[#ef4444]'
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
