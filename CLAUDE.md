# Kolo Ambassador Platform — Project Conventions

Full spec: [docs/kolo-ambassador-spec.md](docs/kolo-ambassador-spec.md)

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS (dark theme, custom tokens in `tailwind.config.ts`)
- NextAuth.js v5 (beta) for X OAuth 2.0
- Deploys to Vercel

## Key Patterns
- Server components by default; `"use client"` only when needed (forms, interactive widgets)
- API routes live under `src/app/api/` using Route Handlers
- Supabase clients in `src/lib/supabase.ts`:
  - `supabaseBrowser()` — client components
  - `supabaseServer()` — server components / route handlers (reads cookies)
  - `supabaseAdmin()` — service-role key, server only, bypasses RLS
- Shared TS types in `src/types/index.ts`
- All API routes return `{ data, error }`

## Styling
- Tailwind tokens (see `tailwind.config.ts`):
  - `bg-bg-base` (#0a0a0f), `bg-bg-card` (#111118), `border-border` (#1e1e2e)
  - `text-accent` / `bg-accent` (cyan #00f0c0)
  - `text-tier-{bronze,silver,gold}`
- Utility classes in `globals.css`: `.card`, `.btn-primary`, `.btn-outline`, `.stat-number`, `.stat-label`
- Cards: `rounded-xl` with glow-on-hover

## Database
- Schema lives in `supabase/schema.sql` — run once in Supabase SQL editor
- Tables: `users`, `submissions`, `campaigns`, `tier_config` + `leaderboard` view
- RLS enabled; service role key bypasses for admin operations
- `submissions.platform` field enables future Reddit/YouTube support

## Auth
- X OAuth 2.0 via NextAuth v5 (`src/lib/auth.ts`)
- On sign-in: upsert row in `users`, hydrate JWT with Supabase user id + role
- Roles: `ambassador` | `moderator` | `admin`
- Route protection by role (middleware + server checks) — to be added in Phase 4

## Scoring
- `auto_score` computed from tweet engagement + TwitterScore
- Moderator can override via `moderator_score`
- `final_score = COALESCE(moderator_score, auto_score)` (stored generated column)
- Leaderboard `weighted_score = LEAST(total_points, 100) × tier_multiplier`

## Implementation Order (spec §10)
1. ✅ **Phase 1 — Foundation** — Project setup, DB schema, auth wiring, root layout
2. ✅ **Phase 2 — Ambassador Core** — Landing, dashboard, submit, my submissions
3. ✅ **Phase 3 — Scoring & Leaderboard** — Tweet fetcher, TwitterScore, auto-scoring, leaderboard
4. ✅ **Phase 4 — Admin & Moderation** — Admin layout, review queue, user management, campaign settings
5. ✅ **Phase 5 — Polish** — Reward calculator, auto-refresh leaderboard, responsive, edge cases
6. ✅ **Phase 6 — Multi-platform scoring** — Reddit + Telegram submissions, per-platform scoring (X cap 30 w/ TS-50 saturation, Reddit cap 10, Telegram 0.5/1/2/3), moderator scoring guide modal
7. 🟡 **Phase 7 — Dual-identity auth (X + Telegram)** — designed, deferred. See [docs/auth-multi-identity.md](docs/auth-multi-identity.md). **Blocked on:** Kolo Telegram bot creation + env vars.
8. ✅ **Phase 8 — Kolo token balance (snapshot import)** — `kolo_balances` table in Supabase holds 3.25M rows imported from the mini-app backend dump; dashboard looks up balance by the user's linked Telegram handle. See [docs/session-2026-04-20.md](docs/session-2026-04-20.md).
9. ⏸ **Phase 9 — Bulk CSV old_points import** — admin upload flow for onboarding Genesis-era users in bulk.

Lower-priority follow-ups (no phase, pick up anytime): rate-limiting on `POST /api/submissions`, Supabase realtime subscriptions to replace 20s leaderboard polling.

## Getting Started
```bash
cp .env.local.example .env.local  # fill in Supabase + Twitter creds
npm install
# Run supabase/schema.sql in your Supabase SQL Editor
npm run dev
```
