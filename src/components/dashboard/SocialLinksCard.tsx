'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Platform = 'telegram' | 'reddit';

interface Props {
  telegramHandle: string | null;
  /** Current token balance from the Kolo replica (null = not wired yet). */
  tokenBalance: number | null;
  redditUsername: string | null;
}

interface RowProps {
  platform: Platform;
  label: string;
  prefix: string;
  valueLabel?: string;
  valueDisplay?: React.ReactNode;
  initialHandle: string | null;
  placeholder: string;
  hint: string;
  /** If true, once a handle is linked it cannot be edited or unlinked from the UI. */
  lockOnLink?: boolean;
  /** Warning shown in a confirm() before the first link when lockOnLink is true. */
  linkConfirm?: string;
  /** Message shown in place of Edit/Unlink once locked. */
  lockedHint?: string;
}

/**
 * Dashboard card that holds the two platform links we cross-reference off-site:
 *   - Telegram → token balance via the Kolo replica DB (balance slot)
 *   - Reddit   → ownership verification for Reddit submissions
 */
export function SocialLinksCard({
  telegramHandle,
  tokenBalance,
  redditUsername,
}: Props) {
  return (
    <div className="dash-card" style={{ padding: 24, gap: 20 }}>
      <LinkRow
        platform="telegram"
        label="Telegram"
        prefix="@"
        placeholder="your_telegram_handle"
        initialHandle={telegramHandle}
        lockOnLink
        linkConfirm={
          'Link this Telegram handle?\n\n' +
          'This is permanent. Once linked, you will NOT be able to change or unlink your Telegram handle yourself — only Kolo support can update it.\n\n' +
          'Double-check the handle is correct and belongs to you before confirming.'
        }
        lockedHint="Telegram is locked once linked. Contact support to change it."
        valueLabel="Token balance"
        valueDisplay={
          <span
            style={{
              color: tokenBalance && tokenBalance > 0 ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {tokenBalance === null
              ? '—'
              : tokenBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            <span
              style={{
                fontSize: 13,
                marginLeft: 6,
                color: 'var(--muted)',
                fontFamily:
                  'var(--font-jetbrains-mono), ui-monospace, monospace',
              }}
            >
              KOLO
            </span>
          </span>
        }
        hint="Used to sync your Kolo token balance from the main product."
      />

      <div style={{ height: 1, background: 'var(--line)' }} />

      <LinkRow
        platform="reddit"
        label="Reddit"
        prefix="u/"
        placeholder="your_reddit_username"
        initialHandle={redditUsername}
        hint="Links ownership. Reddit submissions must match this handle."
      />
    </div>
  );
}

function LinkRow({
  platform,
  label,
  prefix,
  valueLabel,
  valueDisplay,
  initialHandle,
  placeholder,
  hint,
  lockOnLink,
  linkConfirm,
  lockedHint,
}: RowProps) {
  const hasValueColumn = valueLabel !== undefined;
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [editing, setEditing] = useState(initialHandle === null);
  const [draft, setDraft] = useState(initialHandle ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = Boolean(lockOnLink && handle);

  async function save(next: string | null) {
    setMessage(null);
    const endpoint = platform === 'telegram' ? '/api/me/telegram' : '/api/me/reddit';
    const payload = platform === 'telegram' ? { handle: next } : { username: next };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setMessage(json.error ?? 'Could not save.');
      return;
    }
    const saved =
      platform === 'telegram'
        ? json.data.telegram_handle ?? null
        : json.data.reddit_username ?? null;
    setHandle(saved);
    setEditing(false);
    setMessage(next === null ? 'Removed.' : 'Linked.');
    startTransition(() => router.refresh());
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim().replace(/^[@/]|^u\//i, '');
    if (!trimmed) return;
    // First-time link on a locked platform: force the user to read the
    // permanence warning and explicitly confirm before we hit the API.
    if (lockOnLink && !handle && linkConfirm && !confirm(linkConfirm)) return;
    save(trimmed);
  }

  function onUnlink() {
    if (!confirm(`Unlink your ${label} handle?`)) return;
    save(null);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasValueColumn ? '1.4fr 1fr' : '1fr',
        gap: 24,
        alignItems: 'center',
      }}
      className="telegram-row"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="dash-label">{label}</div>

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
              <span style={{ color: 'var(--muted)' }}>{prefix}</span>
              <input
                autoFocus
                type="text"
                placeholder={placeholder}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {prefix}
              {handle}
            </span>
            {locked ? (
              <span
                className="mono-sm"
                title={lockedHint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--muted)',
                }}
              >
                <span aria-hidden>🔒</span> Locked
              </span>
            ) : (
              <>
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
                  onClick={onUnlink}
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
              </>
            )}
          </div>
        )}

        <div className="mono-sm" style={{ marginTop: 4, minHeight: 16 }} aria-live="polite">
          {message ?? (locked && lockedHint ? lockedHint : hint)}
        </div>
      </div>

      {hasValueColumn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
          <div className="dash-label">{valueLabel}</div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: '-0.035em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {valueDisplay}
          </div>
        </div>
      )}
    </div>
  );
}
