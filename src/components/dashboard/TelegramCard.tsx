'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  /** Current saved handle (lowercase, no @) or null if not linked yet. */
  initialHandle: string | null;
  /**
   * Current token balance, if the replica has been wired. `null` means either
   * the handle isn't linked yet, or the replica couldn't resolve it. Pass
   * `undefined` to show the "syncing…" placeholder.
   */
  balance?: number | null;
}

/**
 * Dashboard card for linking a Telegram handle. Once linked we can look the
 * user up in the Kolo replica DB to display their token balance.
 *
 * States:
 * - Unlinked: input + Save
 * - Linked:   shows handle, token balance (or "—" placeholder), + edit button
 */
export function TelegramCard({ initialHandle, balance }: Props) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [editing, setEditing] = useState(initialHandle === null);
  const [draft, setDraft] = useState(initialHandle ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function save(newHandle: string | null) {
    setMessage(null);
    const res = await fetch('/api/me/telegram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle: newHandle }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setMessage(json.error ?? 'Could not save handle.');
      return;
    }
    setHandle(json.data.telegram_handle ?? null);
    setEditing(false);
    setMessage(newHandle ? 'Linked. Balance will appear once it syncs.' : 'Handle removed.');
    startTransition(() => router.refresh());
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim().replace(/^@/, '');
    if (!trimmed) return;
    save(trimmed);
  }

  function onClear() {
    if (!confirm('Unlink this Telegram handle?')) return;
    save(null);
  }

  const balanceText =
    balance === undefined
      ? 'Syncing…'
      : balance === null
      ? '—'
      : balance.toLocaleString('en-US', { maximumFractionDigits: 2 });

  return (
    <div className="dash-card" style={{ padding: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 24,
          alignItems: 'center',
        }}
        className="telegram-row"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="dash-label">Telegram</div>

          {editing ? (
            <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 'var(--radius-xs)',
                  gap: 6,
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 14,
                }}
              >
                <span style={{ color: 'var(--muted)' }}>@</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="your_telegram_handle"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={pending}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Save'}
              </button>
              {handle !== null && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditing(false);
                    setDraft(handle);
                    setMessage(null);
                  }}
                  disabled={pending}
                >
                  Cancel
                </button>
              )}
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                @{handle}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ height: 34, padding: '0 14px', fontSize: 13 }}
                onClick={() => {
                  setEditing(true);
                  setDraft(handle ?? '');
                  setMessage(null);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onClear}
                className="mono-sm"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Unlink
              </button>
            </div>
          )}

          <div
            className="mono-sm"
            style={{ marginTop: 4, minHeight: 16 }}
            aria-live="polite"
          >
            {message ?? (handle === null
              ? 'Link your Telegram handle to sync your Kolo token balance.'
              : 'Synced. Balance appears once your handle matches a Kolo user.')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
          <div className="dash-label">Token balance</div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: '-0.035em',
              color: balance && balance > 0 ? 'var(--accent)' : 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {balanceText}
          </div>
          <div className="mono-sm" style={{ opacity: 0.7 }}>
            KOLO
          </div>
        </div>
      </div>
    </div>
  );
}
