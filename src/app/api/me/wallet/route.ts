// POST /api/me/wallet  { address, chain, token }   — save wallet
// POST /api/me/wallet  { address: null }            — clear wallet
//
// All three fields must be set together or all null. Address is EVM
// (0x + 40 hex); chain is one of bnb/arbitrum/base; token is usdc/usdt.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  isValidEvmAddress,
  WALLET_CHAINS,
  WALLET_TOKENS,
  type WalletChain,
  type WalletToken,
} from '@/lib/wallet';

function err(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return err('Not signed in', 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err('Missing body', 400);

  const { address, chain, token } = body as {
    address?: string | null;
    chain?: string | null;
    token?: string | null;
  };

  // Clear-wallet path — any falsy `address` clears all three fields.
  if (address === null || address === '' || address === undefined) {
    const admin = supabaseAdmin();
    const { data, error: dbErr } = await admin
      .from('users')
      .update({
        wallet_address: null,
        wallet_chain:   null,
        wallet_token:   null,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select('wallet_address, wallet_chain, wallet_token')
      .single();
    if (dbErr) return err(dbErr.message, 500);
    return NextResponse.json({ data, error: null });
  }

  // Save-wallet path — validate all three.
  if (typeof address !== 'string' || !isValidEvmAddress(address)) {
    return err('Invalid wallet address. Use a 0x-prefixed EVM address.', 400);
  }
  if (typeof chain !== 'string' || !WALLET_CHAINS.some((c) => c.value === chain)) {
    return err('Invalid chain. Pick BNB, Arbitrum, or Base.', 400);
  }
  if (typeof token !== 'string' || !WALLET_TOKENS.some((t) => t.value === token)) {
    return err('Invalid token. Pick USDC or USDT.', 400);
  }

  const admin = supabaseAdmin();
  const { data, error: dbErr } = await admin
    .from('users')
    .update({
      wallet_address: address.trim(),
      wallet_chain:   chain as WalletChain,
      wallet_token:   token as WalletToken,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('wallet_address, wallet_chain, wallet_token')
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return NextResponse.json({ data, error: null });
}
