-- Retune tier bands + multipliers to match the 2026-04-17 kolo_balances
-- snapshot distribution (4.21M holders, median 1,460, p90 41,000, max 2.67B).
--
-- Old tiers assumed everyone was sub-10k, so 0/1k/5k bands produced ~100% gold.
-- New bands + multipliers produce a ~54/37/9 bronze/silver/gold split:
--
--   Bronze 0 – 1,999      × 1.0  (~54%)
--   Silver 2,000 – 49,999 × 1.3  (~37%)
--   Gold   50,000+        × 1.7  (~9%)
--
-- Also adds a backfill pass: for every existing user whose telegram_handle
-- matches a kolo_balances row, copy the balance into users.old_points and
-- recompute tier + tier_multiplier. Going forward this happens automatically
-- in /api/me/telegram when the user links/edits their handle.

BEGIN;

-- 1. New tier bands
UPDATE tier_config SET min_old_points = 0,      max_old_points = 1999,   multiplier = 1.0 WHERE tier = 'bronze';
UPDATE tier_config SET min_old_points = 2000,   max_old_points = 49999,  multiplier = 1.3 WHERE tier = 'silver';
UPDATE tier_config SET min_old_points = 50000,  max_old_points = NULL,   multiplier = 1.7 WHERE tier = 'gold';

-- 2. Backfill: pull token_balance from kolo_balances, set old_points + tier
--    for every user who has linked a telegram_handle present in the snapshot.
WITH resolved AS (
  SELECT
    u.id,
    kb.token_balance::numeric AS balance
  FROM users u
  JOIN kolo_balances kb ON LOWER(kb.telegram_handle) = LOWER(u.telegram_handle)
  WHERE u.telegram_handle IS NOT NULL
)
UPDATE users SET
  old_points      = resolved.balance,
  tier            = CASE
    WHEN resolved.balance >= 50000 THEN 'gold'
    WHEN resolved.balance >= 2000  THEN 'silver'
    ELSE 'bronze'
  END,
  tier_multiplier = CASE
    WHEN resolved.balance >= 50000 THEN 1.7
    WHEN resolved.balance >= 2000  THEN 1.3
    ELSE 1.0
  END,
  updated_at = now()
FROM resolved
WHERE users.id = resolved.id;

COMMIT;
