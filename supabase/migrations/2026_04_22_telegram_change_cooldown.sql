-- Cooldown tracking for Telegram handle changes, to prevent enumeration
-- of the kolo_balances snapshot via POST /api/me/telegram.
--
-- Each write to users.telegram_handle stamps telegram_last_change_at.
-- The API enforces a minimum gap between changes (see route handler).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_last_change_at TIMESTAMPTZ;
