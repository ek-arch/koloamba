'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SubmitForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

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
      <div>
        <label htmlFor="url" className="mb-2 block text-sm font-semibold text-muted">
          Post URL
        </label>
        <input
          id="url"
          type="url"
          required
          placeholder="https://x.com/yourhandle/status/1234567890"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xs border border-border bg-white px-4 py-2.5 text-text-primary placeholder:text-muted focus:border-bg-invert focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted">
          Paste a tweet URL you authored. Only X/Twitter is supported right now.
        </p>
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
