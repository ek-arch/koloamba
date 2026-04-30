-- Kolo Ambassador Program — Genesis Sprint
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor → New query)

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists users (
  id                      uuid primary key default gen_random_uuid(),
  twitter_id              text unique not null,
  twitter_handle          text not null,
  twitter_name            text,
  twitter_avatar_url      text,
  twitter_score           decimal(6,2) default 0,
  twitter_score_updated_at timestamptz,
  old_points              decimal(10,2) default 0,
  tier                    text check (tier in ('bronze', 'silver', 'gold')) default 'bronze',
  tier_multiplier         decimal(3,2) default 1.0,
  wallet_address          text,
  telegram_handle         text,  -- lowercase, no leading @; unique when set (see index below)
  reddit_username         text,  -- no leading u/; unique when set
  reddit_karma            decimal(10,0) default 0,  -- total_karma from reddit.com/user/{name}/about.json
  reddit_karma_updated_at timestamptz,
  role                    text check (role in ('ambassador', 'moderator', 'admin')) default 'ambassador',
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  pool_amount    decimal(12,2) not null,
  max_score      integer default 100,
  start_date     timestamptz not null,
  end_date       timestamptz not null,
  status         text check (status in ('draft', 'active', 'completed')) default 'draft',
  created_at     timestamptz default now()
);

create table if not exists submissions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  platform          text not null default 'x' check (platform in ('x', 'reddit', 'telegram')),
  post_url          text not null,
  post_id           text,

  likes             integer default 0,
  retweets          integer default 0,
  replies           integer default 0,
  views             integer default 0,
  engagement_rate   decimal(6,4) default 0,

  auto_score        decimal(6,2) default 0,
  moderator_score   decimal(6,2),
  final_score       decimal(6,2) generated always as (coalesce(moderator_score, auto_score)) stored,

  status            text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  moderator_id      uuid references users(id),
  moderator_notes   text,
  reviewed_at       timestamptz,

  fetched_at        timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Globally unique: a (platform, post_id) can only be submitted once across
-- the entire program, regardless of submitter.
create unique index if not exists idx_submissions_post_global
  on submissions(platform, post_id);

-- telegram_handle is unique when present; allows multiple NULLs.
create unique index if not exists users_telegram_handle_key
  on users (telegram_handle)
  where telegram_handle is not null;

create unique index if not exists users_reddit_username_key
  on users (reddit_username)
  where reddit_username is not null;

create table if not exists tier_config (
  tier            text primary key,
  min_old_points  decimal(10,2) not null,
  max_old_points  decimal(10,2),
  multiplier      decimal(3,2) not null
);

insert into tier_config (tier, min_old_points, max_old_points, multiplier) values
  ('bronze', 0,    999,  1.0),
  ('silver', 1000, 4999, 1.2),
  ('gold',   5000, null, 1.5)
on conflict (tier) do nothing;

-- =====================================================================
-- Leaderboard view
-- total_points capped at 100; weighted_score = capped total × tier multiplier
-- =====================================================================

create or replace view leaderboard as
select
  u.id,
  u.twitter_handle,
  u.twitter_name,
  u.twitter_avatar_url,
  u.tier,
  u.tier_multiplier,
  u.twitter_score,
  least(coalesce(sum(s.final_score), 0), 100)                         as total_points,
  least(coalesce(sum(s.final_score), 0), 100) * u.tier_multiplier     as weighted_score,
  count(s.id) filter (where s.status = 'approved')                    as approved_submissions
from users u
left join submissions s on s.user_id = u.id and s.status = 'approved'
where u.role = 'ambassador'
group by u.id
order by weighted_score desc;

-- =====================================================================
-- Row Level Security
-- Service role (server-side API routes) bypasses RLS, so most writes
-- happen via the service role key. Policies below cover browser reads.
-- =====================================================================

alter table users        enable row level security;
alter table submissions  enable row level security;
alter table campaigns    enable row level security;
alter table tier_config  enable row level security;

-- Public can read campaigns and tier_config
create policy "public read campaigns"   on campaigns    for select using (true);
create policy "public read tier_config" on tier_config  for select using (true);

-- Public can read ambassador users (for leaderboard) but not PII
-- Note: view `leaderboard` exposes only safe columns anyway.
create policy "public read ambassador users" on users
  for select using (role = 'ambassador');

-- Public can read approved submissions (for leaderboard drilldown)
create policy "public read approved submissions" on submissions
  for select using (status = 'approved');

-- =====================================================================
-- Seed: first campaign (Genesis Sprint)
-- Update pool_amount, dates in admin panel later
-- =====================================================================

insert into campaigns (name, description, pool_amount, max_score, start_date, end_date, status)
select 'Genesis Sprint', '1-month launch campaign for Kolo Ambassadors.', 1000, 100,
       now(), now() + interval '30 days', 'active'
where not exists (select 1 from campaigns where name = 'Genesis Sprint');
