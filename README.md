# Kolo Ambassador Platform

Web app for the ongoing Kolo Ambassador Program — crypto creators submit posts about Kolo across X, Reddit, and Telegram; posts are scored on engagement + credibility; rewards are distributed from per-campaign pools. Genesis Sprint is the first campaign; more follow.

See [`docs/kolo-ambassador-spec.md`](docs/kolo-ambassador-spec.md) for the full spec and [`docs/auth-multi-identity.md`](docs/auth-multi-identity.md) for the planned X + Telegram dual-identity auth.

## Stack

Next.js 14 · TypeScript · Supabase · Tailwind · NextAuth v5 · Vercel

## Quick Start

```bash
cp .env.local.example .env.local      # fill in keys
npm install
npm run dev                           # http://localhost:3000
```

Then run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

## Project Conventions

See [`CLAUDE.md`](CLAUDE.md).
