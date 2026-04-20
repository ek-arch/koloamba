'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  WALLET_CHAINS,
  WALLET_TOKENS,
  isValidEvmAddress,
  maskAddress,
  chainLabel,
  tokenLabel,
  type WalletChain,
  type WalletToken,
} from '@/lib/wallet';

interface Props {
  initialAddress: string | null;
  initialChain: WalletChain | null;
  initialToken: WalletToken | null;
}

/**
 * Payout wallet card — ambassador sets an EVM address + chain + token so
 * admins can batch-pay reward shares at campaign end. Optional field;
 * users without a wallet saved still accrue points but get surfaced to
 * the admin payouts page as "missing wallet" when they win.
 */
export function WalletCard({ initialAddress, initialChain, initialToken }: Props) {
  const router = useRouter();
  const hasWallet = Boolean(initialAddress);
  const [editing, setEditing] = useState(!hasWallet);

  const [addr, setAddr] = useState(initialAddress ?? '');
  const [chain, setChain] = useState<WalletChain>(initialChain ?? 'base');
  const [token, setToken] = useState<WalletToken>(initialToken ?? 'usdc');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function save(payload: {
    address: string | null;
    chain?: WalletChain;
    token?: WalletToken;
  }) {
    setMessage(null);
    const res = await fetch('/api/me/wallet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setMessage(json.error ?? 'Could not save.');
      return;
    }
    setEditing(false);
    setMessage(payload.address ? 'Saved.' : 'Removed.');
    startTransition(() => router.refresh());
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addr.trim();
    if (!isValidEvmAddress(trimmed)) {
      setMessage('Invalid EVM address. Should start with 0x and be 42 characters.');
      return;
    }
    save({ address: trimmed, chain, token });
  }

  function onRemove() {
    if (!confirm('Remove your payout wallet?')) return;
    save({ address: null });
  }

  return (
    <div className="dash-card" style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <div className="dash-label">Payout wallet</div>
        <div className="mono-sm" style={{ color: 'var(--muted)' }}>
          where your reward share is paid
        </div>
      </div>

      {editing ? (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
              <span className="mono-sm" style={{ color: 'var(--muted)' }}>
                Chain
              </span>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value as WalletChain)}
                disabled={pending}
                style={{
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily:
                    'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 14,
                  color: 'inherit',
                }}
              >
                {WALLET_CHAINS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
              <span className="mono-sm" style={{ color: 'var(--muted)' }}>
                Token
              </span>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value as WalletToken)}
                disabled={pending}
                style={{
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily:
                    'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 14,
                  color: 'inherit',
                }}
              >
                {WALLET_TOKENS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="mono-sm" style={{ color: 'var(--muted)' }}>
              Address
            </span>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="0x0000000000000000000000000000000000000000"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              disabled={pending}
              style={{
                height: 44,
                padding: '0 14px',
                background: 'var(--bg)',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--radius-xs)',
                fontFamily:
                  'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 14,
                color: 'inherit',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </button>
            {hasWallet && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(false);
                  setAddr(initialAddress ?? '');
                  setChain(initialChain ?? 'base');
                  setToken(initialToken ?? 'usdc');
                  setMessage(null);
                }}
                disabled={pending}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 18,
              fontWeight: 500,
            }}
            title={initialAddress ?? undefined}
          >
            {initialAddress ? maskAddress(initialAddress) : '—'}
          </div>
          {initialChain && initialToken && (
            <div className="mono-sm" style={{ color: 'var(--muted)' }}>
              Pay in {tokenLabel(initialToken)} on {chainLabel(initialChain)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 34, padding: '0 14px', fontSize: 13 }}
              onClick={() => {
                setEditing(true);
                setMessage(null);
              }}
            >
              Edit
            </button>
            {hasWallet && (
              <button
                type="button"
                onClick={onRemove}
                className="mono-sm"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="mono-sm"
        style={{ marginTop: 10, minHeight: 16, color: 'var(--muted)' }}
        aria-live="polite"
      >
        {message ??
          'EVM address only (BNB Chain, Arbitrum, or Base). Double-check before saving.'}
      </div>
    </div>
  );
}
