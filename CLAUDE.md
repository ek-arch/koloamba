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
1. **Phase 1 — Foundation** ← current
   Project setup, DB schema, auth wiring, root layout
2. **Phase 2 — Ambassador Core**
   Landing, dashboard, submit page, my submissions
3. **Phase 3 — Scoring & Leaderboard**
   Tweet fetcher, TwitterScore, auto-scoring, leaderboard page
4. **Phase 4 — Admin & Moderation**
   Admin layout, review queue, user management, campaign settings
5. **Phase 5 — Polish**
   Reward calculator, real-time updates, responsive, edge cases

## Getting Started
```bash
cp .env.local.example .env.local  # fill in Supabase + Twitter creds
npm install
# Run supabase/schema.sql in your Supabase SQL Editor
npm run dev
```
