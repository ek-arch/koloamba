# Kolo Ambassador Platform

Web app for the ongoing Kolo Ambassador Program — for Kolo creators, early adopters, and mini-app farmers. Submit posts about Kolo across X, Reddit, and Telegram; posts are scored on engagement + credibility; rewards are distributed from per-campaign pools. Your farmed KOLO balance sets a tier multiplier that applies to every campaign — two years of tapping carries forward. Genesis Sprint is the first campaign; more follow.

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
