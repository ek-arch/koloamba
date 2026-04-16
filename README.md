# Kolo Ambassador Platform

Web app for the Kolo Ambassador Program (Genesis Sprint) — crypto creators submit posts about Kolo, get scored on engagement + credibility, earn rewards from a shared pool.

See [`docs/kolo-ambassador-spec.md`](docs/kolo-ambassador-spec.md) for the full spec.

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
