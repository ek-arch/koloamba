-- Add telegram_handle to users so we can cross-reference the ambassador with
-- their row in the Kolo product's replica DB and surface token balances on
-- the dashboard. Handle is stored normalized (lowercase, no leading @).
--
-- Idempotent: safe to run multiple times.

alter table users
  add column if not exists telegram_handle text;

-- Unique when set; allows multiple NULLs.
create unique index if not exists users_telegram_handle_key
  on users (telegram_handle)
  where telegram_handle is not null;
