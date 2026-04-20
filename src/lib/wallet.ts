// Payout wallet helpers — EVM addresses, one of three supported chains
// (BNB Chain, Arbitrum, Base), payable in USDC or USDT.
//
// The three chains share the same address format so we only need one
// validator. If we ever add a non-EVM chain (TON, Solana), split into
// chain-specific validators.

export type WalletChain = 'bnb' | 'arbitrum' | 'base';
export type WalletToken = 'usdc' | 'usdt';

export const WALLET_CHAINS: { value: WalletChain; label: string }[] = [
  { value: 'bnb',      label: 'BNB Chain' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'base',     label: 'Base' },
];

export const WALLET_TOKENS: { value: WalletToken; label: string }[] = [
  { value: 'usdc', label: 'USDC' },
  { value: 'usdt', label: 'USDT' },
];

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isValidEvmAddress(addr: string): boolean {
  return EVM_ADDRESS_RE.test(addr.trim());
}

/** "0x742d35Cc…f44e" — truncated display for tables. */
export function maskAddress(addr: string): string {
  const s = addr.trim();
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function chainLabel(chain: WalletChain): string {
  return WALLET_CHAINS.find((c) => c.value === chain)?.label ?? chain;
}

export function tokenLabel(token: WalletToken): string {
  return WALLET_TOKENS.find((t) => t.value === token)?.label ?? token.toUpperCase();
}
