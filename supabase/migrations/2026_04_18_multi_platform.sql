-- Reward program expands beyond X to Reddit and Telegram.
--
-- Per-platform scoring (see src/lib/scoring.ts):
--   X        — engagement × (1 + twitter_score/100)
--   Reddit   — engagement × (1 + min(karma/10000, 1))
--   Telegram — flat 1.0 per post (no external signal available; moderator
--              can override via moderator_score)
--
-- This migration:
--   1. Normalizes any legacy platform values (youtube → x just in case).
--   2. Locks platform to {x, reddit, telegram} via check constraint.
--   3. Adds reddit_username + reddit_karma + reddit_karma_updated_at to users
--      so the same credibility-weight pattern TwitterScore uses can apply.
--
-- Idempotent: safe to run more than once.

-- 1. Clean up any old value (defensive — prod should only have 'x' today)
update submissions set platform = 'x' where platform not in ('x', 'reddit', 'telegram');

-- 2. Redefine the allowed-values constraint
alter table submissions drop constraint if exists submissions_platform_check;
alter table submissions
  add constraint submissions_platform_check
  check (platform in ('x', 'reddit', 'telegram'));

-- 3. Reddit credibility fields on users
alter table users
  add column if not exists reddit_username          text,
  add column if not exists reddit_karma             decimal(10,0) default 0,
  add column if not exists reddit_karma_updated_at  timestamptz;

-- Unique when set; allow multiple NULLs.
create unique index if not exists users_reddit_username_key
  on users (reddit_username)
  where reddit_username is not null;
