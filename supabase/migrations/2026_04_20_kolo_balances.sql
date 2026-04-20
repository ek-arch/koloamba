-- Phase 8 — Kolo replica integration (snapshot import)
--
-- Holds the old_points balances exported from the Kolo mini-app backend.
-- The ambassador dashboard looks up a user's balance by their (self-declared)
-- telegram_handle; once Phase 7 dual-identity auth ships, we can switch to
-- a telegram_id lookup from the session for a stronger guarantee.
--
-- Imported via `\copy kolo_balances FROM '/path/to/kolo_balances.csv' CSV HEADER`
-- against the Supabase direct connection. Re-running is idempotent: an UPSERT
-- on telegram_id replaces the balance.

CREATE TABLE IF NOT EXISTS kolo_balances (
  telegram_id      BIGINT PRIMARY KEY,
  telegram_handle  TEXT,
  token_balance    BIGINT NOT NULL DEFAULT 0,
  imported_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by handle for the dashboard today (case-insensitive).
CREATE INDEX IF NOT EXISTS idx_kolo_balances_handle_lower
  ON kolo_balances (LOWER(telegram_handle));

-- Row Level Security: no ambassador reads this table directly — it's only
-- queried server-side via the service role key. Deny everything else.
ALTER TABLE kolo_balances ENABLE ROW LEVEL SECURITY;
