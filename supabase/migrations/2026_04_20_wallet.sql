-- Ambassador payout wallet fields.
--
-- users.wallet_address already exists (nullable TEXT). Add the chain + token
-- metadata so admins can issue payouts to the right chain. All three supported
-- chains are EVM-compatible so the address format is the same 0x + 40 hex.

ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_chain TEXT
  CHECK (wallet_chain IN ('bnb', 'arbitrum', 'base'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_token TEXT
  CHECK (wallet_token IN ('usdc', 'usdt'));

-- If either piece of wallet metadata is set, all three must be (enforced at
-- API layer; DB constraint would be tricky with existing nulls).
