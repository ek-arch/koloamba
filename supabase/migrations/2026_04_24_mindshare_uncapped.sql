-- Switch the leaderboard scoring from "capped points × multiplier" to
-- uncapped mindshare-style: weighted_score = total_points × tier_multiplier
-- with NO 100-point ceiling. The public leaderboard renders this as a
-- percentage of the campaign's total weighted score (mindshare), hiding
-- raw point counts from non-admin views.
--
-- Original (schema.sql):
--   least(coalesce(sum(s.final_score), 0), 100)                       as total_points
--   least(coalesce(sum(s.final_score), 0), 100) * u.tier_multiplier   as weighted_score
--
-- After this migration: no LEAST() / no cap.

create or replace view leaderboard as
select
  u.id,
  u.twitter_handle,
  u.twitter_name,
  u.twitter_avatar_url,
  u.tier,
  u.tier_multiplier,
  u.twitter_score,
  coalesce(sum(s.final_score), 0)                                     as total_points,
  coalesce(sum(s.final_score), 0) * u.tier_multiplier                 as weighted_score,
  count(s.id) filter (where s.status = 'approved')                    as approved_submissions
from users u
left join submissions s on s.user_id = u.id and s.status = 'approved'
where u.role = 'ambassador'
group by u.id
order by weighted_score desc;
