# Kolo Ambassador Program: Genesis Sprint — Technical Spec & Architecture

## 1. Project Overview

**Product:** A web platform for the Kolo Ambassador Program (Genesis Sprint) — a 1-month campaign where crypto content creators (ambassadors) submit tweets about Kolo, get scored based on engagement + credibility, and earn rewards from a shared pool proportional to their weighted score.

**Core flow:**
1. Ambassador logs in via X (Twitter) OAuth
2. Submits tweet links about Kolo
3. System auto-fetches engagement metrics (likes, retweets, views) + TwitterScore from twitterscore.io API
4. Moderator reviews submissions, can adjust scores
5. Leaderboard updates with ranked ambassadors
6. Rewards calculated using weighted formula: `Reward = (S × M) / Σ(S × M) × Pool`

**Scale:** Hundreds of ambassadors. Single campaign (Genesis Sprint). 1-month duration.

**Design:** Dark theme, cyan/teal accents, card-based layout (reference: Kreators platform aesthetic). Clean and simple.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14 (App Router)** | Full-stack in one project, SSR, API routes |
| Database | **Supabase (PostgreSQL)** | Hosted DB, auth, real-time subscriptions, row-level security |
| Auth | **NextAuth.js + Twitter/X OAuth** | Handles X login, gives us user's Twitter handle/ID |
| Styling | **Tailwind CSS** | Fast, utility-first, easy dark theme |
| Deployment | **Vercel** | Zero-config for Next.js |
| External APIs | **twitterscore.io** (credibility), **Tweet scraping service** (engagement) |

---

## 3. Database Schema (Supabase/PostgreSQL)

### `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_id TEXT UNIQUE NOT NULL,
  twitter_handle TEXT NOT NULL,
  twitter_name TEXT,
  twitter_avatar_url TEXT,
  twitter_score DECIMAL(6,2) DEFAULT 0,        -- from twitterscore.io
  twitter_score_updated_at TIMESTAMPTZ,
  old_points DECIMAL(10,2) DEFAULT 0,           -- genesis points (imported)
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold')) DEFAULT 'bronze',
  tier_multiplier DECIMAL(3,2) DEFAULT 1.0,     -- 1.0 / 1.2 / 1.5
  wallet_address TEXT,                           -- optional, collected monthly
  role TEXT CHECK (role IN ('ambassador', 'moderator', 'admin')) DEFAULT 'ambassador',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `submissions` table
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'x',           -- 'x', 'reddit', 'youtube', etc. (extensible)
  post_url TEXT NOT NULL,
  post_id TEXT,                                  -- extracted from URL (tweet ID, reddit post ID, etc.)

  -- Auto-fetched metrics (platform-specific, stored as flexible fields)
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(6,4) DEFAULT 0,       -- calculated: (likes+retweets+replies)/views

  -- Scoring
  auto_score DECIMAL(6,2) DEFAULT 0,            -- system-calculated score
  moderator_score DECIMAL(6,2),                 -- moderator override (NULL = use auto_score)
  final_score DECIMAL(6,2) GENERATED ALWAYS AS (COALESCE(moderator_score, auto_score)) STORED,

  -- Review
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  moderator_id UUID REFERENCES users(id),
  moderator_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  fetched_at TIMESTAMPTZ,                       -- when metrics were last scraped
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate submissions of the same post
CREATE UNIQUE INDEX idx_submissions_post ON submissions(user_id, platform, post_id);
```

### `campaigns` table (for future extensibility)
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                            -- e.g. "Genesis Sprint"
  description TEXT,
  pool_amount DECIMAL(12,2) NOT NULL,            -- total reward pool in USD
  max_score INTEGER DEFAULT 100,                 -- max points per ambassador
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `leaderboard_view` (materialized or computed)
```sql
CREATE VIEW leaderboard AS
SELECT
  u.id,
  u.twitter_handle,
  u.twitter_name,
  u.twitter_avatar_url,
  u.tier,
  u.tier_multiplier,
  u.twitter_score,
  LEAST(COALESCE(SUM(s.final_score), 0), 100) AS total_points,  -- capped at 100
  LEAST(COALESCE(SUM(s.final_score), 0), 100) * u.tier_multiplier AS weighted_score,
  COUNT(s.id) FILTER (WHERE s.status = 'approved') AS approved_submissions
FROM users u
LEFT JOIN submissions s ON s.user_id = u.id AND s.status = 'approved'
WHERE u.role = 'ambassador'
GROUP BY u.id
ORDER BY weighted_score DESC;
```

### Tier thresholds (configurable)
```sql
CREATE TABLE tier_config (
  tier TEXT PRIMARY KEY,
  min_old_points DECIMAL(10,2) NOT NULL,
  max_old_points DECIMAL(10,2),                 -- NULL for gold (no upper limit)
  multiplier DECIMAL(3,2) NOT NULL
);

INSERT INTO tier_config VALUES
  ('bronze', 0, 999, 1.0),
  ('silver', 1000, 4999, 1.2),
  ('gold', 5000, NULL, 1.5);
```

---

## 4. Pages & Routes

### Public Pages (no auth required)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Program overview, tiers explanation, reward formula, CTA to join |
| `/leaderboard` | Public Leaderboard | Ranked list of ambassadors (viewable by anyone) |

### Authenticated Pages (ambassador)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Ambassador Dashboard | Profile card, tier badge, overall metrics, Twitter Score, projected reward |
| `/dashboard/submit` | Submit Content | Paste tweet link, see auto-fetched metrics, submission history |
| `/dashboard/submissions` | My Submissions | List of all submissions with status (pending/approved/rejected) |

### Admin/Moderator Pages

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Admin Dashboard | Overview stats (total ambassadors, submissions pending, pool info) |
| `/admin/submissions` | Review Submissions | Queue of pending submissions, approve/reject/score adjust |
| `/admin/users` | Manage Users | View all ambassadors, assign tiers, import old points |
| `/admin/campaign` | Campaign Settings | Set pool amount, tier thresholds, dates |

---

## 5. Key Features & Components

### 5.1 Authentication (X OAuth)
- Login with X via NextAuth.js
- On first login: create user record, pull Twitter handle + avatar
- Auto-fetch TwitterScore from twitterscore.io API
- Store Twitter ID for tweet ownership verification

### 5.2 Tweet Submission Flow
```
Ambassador pastes tweet URL
        ↓
System extracts tweet ID from URL
        ↓
Check: is this tweet by the logged-in user? (match Twitter ID)
        ↓
Check: is this a duplicate submission?
        ↓
Fetch engagement metrics (likes, retweets, views, replies)
        ↓
Calculate auto_score based on engagement formula
        ↓
Submission saved as "pending"
        ↓
Moderator reviews → approves/rejects/adjusts score
        ↓
If approved → points added to ambassador's total → leaderboard updates
```

### 5.3 Scoring Algorithm
The auto-score for each submission combines:
1. **Engagement metrics** from the tweet (likes, retweets, views, replies)
2. **TwitterScore** of the ambassador (credibility weight from twitterscore.io)

Suggested auto-score formula (adjustable by admin):
```
engagement_score = normalize(likes × 1 + retweets × 2 + replies × 1.5 + views × 0.01)
submission_score = engagement_score × (1 + twitter_score_weight)
```

The moderator can always override with a manual score.

### 5.4 Leaderboard
- Ranked by weighted_score (total_points × tier_multiplier)
- Shows: rank, avatar, handle, tier badge, total points, weighted score, projected reward
- Search/filter by tier
- Highlights current user's position (if logged in)
- Auto-updates (Supabase real-time or polling)

### 5.5 Reward Calculator
- Visible on dashboard: "Your projected reward"
- Formula: `(my_weighted_score / total_weighted_scores) × pool`
- Updates as leaderboard changes
- Shows breakdown: points earned, multiplier, weight, % of pool

### 5.6 Platform Extensibility (for future)
The `submissions` table has a `platform` field. When adding Reddit/YouTube/etc:
1. Add a new URL parser for that platform
2. Add a new metrics fetcher for that platform
3. The rest (scoring, leaderboard, review) works the same

---

## 6. API Routes (Next.js API)

### Auth
- `GET /api/auth/[...nextauth]` — NextAuth.js handler (X OAuth)

### Submissions
- `POST /api/submissions` — Submit a new tweet link
- `GET /api/submissions` — Get current user's submissions
- `GET /api/submissions/[id]` — Get single submission details
- `DELETE /api/submissions/[id]` — Delete own pending submission

### Leaderboard
- `GET /api/leaderboard` — Get ranked ambassador list with scores
- `GET /api/leaderboard/me` — Get current user's rank + projected reward

### TwitterScore
- `POST /api/twitter-score/refresh` — Re-fetch user's TwitterScore from API

### Admin
- `GET /api/admin/submissions` — Get all pending submissions for review
- `PATCH /api/admin/submissions/[id]` — Approve/reject/score a submission
- `GET /api/admin/users` — List all ambassadors
- `PATCH /api/admin/users/[id]` — Update user tier, old_points, role
- `POST /api/admin/users/import` — Bulk import old points (CSV)
- `PATCH /api/admin/campaign` — Update pool amount, dates, thresholds

---

## 7. Folder Structure

```
kolo-ambassador/
├── CLAUDE.md                        # Conventions for Claude Code
├── .env.local                       # Environment variables
├── next.config.js
├── tailwind.config.js
├── package.json
├── prisma/                          # (or use Supabase client directly)
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (dark theme, sidebar)
│   │   ├── page.tsx                 # Landing page
│   │   ├── leaderboard/
│   │   │   └── page.tsx             # Public leaderboard
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Dashboard layout (sidebar nav)
│   │   │   ├── page.tsx             # Ambassador dashboard
│   │   │   ├── submit/
│   │   │   │   └── page.tsx         # Submit tweets
│   │   │   └── submissions/
│   │   │       └── page.tsx         # My submissions
│   │   ├── admin/
│   │   │   ├── layout.tsx           # Admin layout
│   │   │   ├── page.tsx             # Admin overview
│   │   │   ├── submissions/
│   │   │   │   └── page.tsx         # Review queue
│   │   │   ├── users/
│   │   │   │   └── page.tsx         # Manage ambassadors
│   │   │   └── campaign/
│   │   │       └── page.tsx         # Campaign settings
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       │   └── route.ts
│   │       ├── submissions/
│   │       │   ├── route.ts         # POST + GET
│   │       │   └── [id]/route.ts    # GET + DELETE
│   │       ├── leaderboard/
│   │       │   ├── route.ts
│   │       │   └── me/route.ts
│   │       ├── twitter-score/
│   │       │   └── refresh/route.ts
│   │       └── admin/
│   │           ├── submissions/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           ├── users/
│   │           │   ├── route.ts
│   │           │   ├── [id]/route.ts
│   │           │   └── import/route.ts
│   │           └── campaign/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   ├── RewardCalculator.tsx
│   │   │   └── TierBadge.tsx
│   │   ├── submissions/
│   │   │   ├── SubmitForm.tsx
│   │   │   ├── SubmissionCard.tsx
│   │   │   └── SubmissionList.tsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx
│   │   │   ├── LeaderboardRow.tsx
│   │   │   └── MyPosition.tsx
│   │   └── admin/
│   │       ├── ReviewCard.tsx
│   │       ├── UserTable.tsx
│   │       └── CampaignForm.tsx
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── twitter-score.ts         # twitterscore.io API wrapper
│   │   ├── tweet-fetcher.ts         # Scrape/fetch tweet engagement
│   │   ├── scoring.ts              # Auto-score calculation logic
│   │   ├── rewards.ts              # Reward distribution calculator
│   │   └── url-parser.ts           # Extract post ID from URLs (X, Reddit, etc.)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── styles/
│       └── globals.css              # Tailwind + custom dark theme
```

---

## 8. Design System

### Colors
- **Background:** `#0a0a0f` (near-black)
- **Card background:** `#111118` (dark navy)
- **Card border:** `#1e1e2e` (subtle border)
- **Primary accent:** `#00f0c0` (cyan/teal — for highlights, buttons, active states)
- **Secondary accent:** `#7c3aed` (purple — for tier badges, secondary actions)
- **Text primary:** `#ffffff`
- **Text secondary:** `#9ca3af` (gray-400)
- **Success:** `#10b981`
- **Warning:** `#f59e0b`
- **Error:** `#ef4444`

### Tier Badge Colors
- Bronze: `#cd7f32`
- Silver: `#c0c0c0`
- Gold: `#ffd700`

### Typography
- Font: Inter (or system sans-serif)
- Headings: Bold, white
- Body: Regular, gray-300

### Component Patterns
- Cards with subtle border and slight glow on hover
- Stat cards: icon + big number + label + sublabel
- Tables: dark rows with hover highlight
- Buttons: solid cyan for primary, outline for secondary

---

## 9. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Twitter/X OAuth
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# TwitterScore API
TWITTER_SCORE_API_KEY=
TWITTER_SCORE_API_URL=https://api.twitterscore.io

# Campaign defaults
DEFAULT_POOL_AMOUNT=1000
```

---

## 10. Implementation Order (for Claude Code)

Build in this exact order — each step depends on the previous:

### Phase 1: Foundation
1. **Project setup** — Init Next.js, Tailwind, Supabase, folder structure
2. **Database** — Create all tables and views in Supabase
3. **Auth** — NextAuth with X OAuth, user creation on first login
4. **Root layout** — Dark theme, navbar, basic routing

### Phase 2: Ambassador Core
5. **Landing page** — Program overview, tiers, reward formula
6. **Dashboard page** — Profile card, tier badge, metrics grid
7. **Submit page** — Tweet URL input, URL parser, save to DB
8. **My submissions page** — List with status badges

### Phase 3: Scoring & Leaderboard
9. **Tweet engagement fetcher** — Scrape/API to get likes, retweets, views
10. **TwitterScore integration** — twitterscore.io API wrapper
11. **Auto-scoring logic** — Calculate score from engagement + twitter score
12. **Leaderboard page** — Ranked table with search, user highlight

### Phase 4: Admin & Moderation
13. **Admin layout + auth guard** — Only moderator/admin role can access
14. **Review queue** — List pending submissions, approve/reject/adjust
15. **User management** — View ambassadors, edit tiers, import old points
16. **Campaign settings** — Pool amount, dates, tier thresholds

### Phase 5: Polish
17. **Reward calculator widget** — Projected reward on dashboard
18. **Real-time updates** — Supabase subscriptions for leaderboard
19. **Responsive design** — Mobile-friendly
20. **Edge cases** — Duplicate detection, rate limiting, error states

---

## 11. CLAUDE.md (for Claude Code sessions)

Copy this into the project root as `CLAUDE.md`:

```markdown
# Kolo Ambassador Platform — Project Conventions

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Realtime)
- Tailwind CSS (dark theme)
- NextAuth.js for X OAuth

## Key Patterns
- All pages use server components by default; add "use client" only when needed
- API routes in src/app/api/ using Route Handlers
- Supabase client in src/lib/supabase.ts (browser + server variants)
- Types in src/types/index.ts

## Styling
- Dark theme: bg-[#0a0a0f], cards bg-[#111118], accent cyan #00f0c0
- Use Tailwind utility classes, no separate CSS files except globals.css
- All cards have rounded-xl border border-[#1e1e2e]

## Database
- Supabase PostgreSQL. Tables: users, submissions, campaigns, tier_config
- Row Level Security enabled on all tables
- Submissions have platform field for future extensibility (x, reddit, youtube)

## Auth
- X OAuth via NextAuth.js
- User roles: ambassador, moderator, admin
- Admin routes protected by role check middleware

## Scoring
- Auto-score from tweet engagement metrics + TwitterScore
- Moderator can override with moderator_score
- final_score = COALESCE(moderator_score, auto_score)
- Leaderboard: weighted_score = min(total_points, 100) × tier_multiplier

## API Conventions
- Return { data, error } from all API routes
- Use Supabase service role key for admin operations
- Validate all inputs server-side
```

---

## 12. Key Decisions & Notes

1. **No Twitter API needed** — We use tweet engagement scraping (via a service like SocialData, TweetScout, or direct scraping) + twitterscore.io API. No official Twitter API required.

2. **Platform extensibility** — The `platform` field on submissions and the URL parser module make it easy to add Reddit, YouTube, etc. later without schema changes.

3. **Moderator always has final say** — Auto-score is a suggestion. Moderator can override any submission's score. This handles edge cases the algorithm can't (spam, off-topic content, etc.).

4. **Points capped at 100** — Per the spec, max score is 100 per ambassador per sprint. The leaderboard view enforces this with `LEAST(sum, 100)`.

5. **Wallet addresses collected separately** — Not part of the app MVP. Can be added as a simple text field on the profile later if needed.

6. **Tier assignment is based on imported old_points** — Admin uploads a CSV of old points, system auto-assigns tiers based on tier_config thresholds.
