-- Globally unique submissions: a single (platform, post_id) can only be
-- submitted once across the whole program, regardless of who submits it.
-- Replaces the per-user uniqueness so the admin queue never sees the same
-- tweet from two different ambassadors.

drop index if exists idx_submissions_post;

create unique index if not exists idx_submissions_post_global
  on submissions(platform, post_id);
