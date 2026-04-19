# Auth — Dual-identity (X + Telegram)

**Status:** designed, not yet implemented.
**Decided:** 2026-04-19 (this session).

## Goal
One ambassador account can be signed into with either X OAuth or Telegram
Login Widget. Both identities can be linked to the same `users` row. Either
identity alone is sufficient to create an account; linking the other happens
later from an authenticated session.

## Why not a managed service (Privy / Dynamic / Clerk)?

Considered Privy (crypto-native, natively supports Telegram + X + linking).
Decided against it **for now** because:

- Only two identities to wire (X, Telegram) — DIY is ~3-4h vs. migration + vendor bill.
- Existing users are NextAuth+Supabase — migrating mid-flight adds risk.
- No wallet or email requirement yet.

**Trigger to reconsider:** if we add a third sign-in path (email, wallet, or
another social), Privy becomes the right call. The break-even is provider
count + wallet/email, not program duration.

## Schema migration

```sql
-- Make Twitter nullable
ALTER TABLE users ALTER COLUMN twitter_id       DROP NOT NULL;
ALTER TABLE users ALTER COLUMN twitter_handle   DROP NOT NULL;

-- Add Telegram identity fields
ALTER TABLE users ADD COLUMN telegram_id        BIGINT UNIQUE;
ALTER TABLE users ADD COLUMN telegram_name      TEXT;
ALTER TABLE users ADD COLUMN telegram_avatar_url TEXT;
-- telegram_handle already exists (currently free-text, becomes widget-verified)

-- At least one auth identity must be present
ALTER TABLE users ADD CONSTRAINT users_has_auth_identity
  CHECK (twitter_id IS NOT NULL OR telegram_id IS NOT NULL);
```

## Auth flow

NextAuth v5 gets a second provider:

1. **Twitter OAuth** (unchanged)
2. **Telegram** — custom `CredentialsProvider` that:
   - Accepts the Telegram Login Widget payload (id, first_name, last_name, username, photo_url, auth_date, hash)
   - Verifies HMAC-SHA256 with `TELEGRAM_BOT_TOKEN`
   - Rejects if auth_date is older than ~5 minutes (replay protection)
   - Looks up or upserts the `users` row by `telegram_id`

### Sign-in scenarios

| Scenario | Action |
|---|---|
| Telegram id seen → matches existing user | Sign into that user |
| Telegram id unseen + no current session | Create new user with only Telegram fields |
| Telegram id unseen + user already signed in (via X) | Link: set telegram_* on current user |
| Telegram id **seen on a different user** while a session is active for user A | **Refuse.** Return error "This Telegram account is linked to another ambassador — unlink it there first." |

Symmetric rules apply for Twitter-as-second-identity.

## UI changes

- **Landing page**: second button "Sign in with Telegram" next to "Sign in with X".
- **Dashboard SocialLinksCard**: the Telegram row's "Edit handle" free-text becomes an embedded Telegram Login Widget button. The free-text remains as an admin-only fallback (for manual linkage during support cases).
- **Session/display**: derive display name + avatar from whichever identity is preferred (X if both linked; fallback to Telegram).

## Submission ownership rules (unchanged + one addition)

- X post → requires `twitter_id` on user, author matches
- Reddit post → requires `reddit_username`, author matches
- Telegram post → requires `telegram_id` **linked via widget** (not just the free-text handle)

A Telegram-only user **cannot submit X posts** — the submit page will show a "Link X to submit X posts" CTA.

## Environment variables

```
TELEGRAM_BOT_TOKEN=        # from @BotFather
TELEGRAM_BOT_USERNAME=     # without the @, used in the widget embed
```

The bot must have its domain whitelisted in @BotFather (`/setdomain`).

## Open prerequisite

- Create a Kolo Telegram bot via @BotFather (if none exists), set domain to `koloamba.vercel.app`, put token in Vercel env. Blocks implementation.

## Implementation order

1. Schema migration (Supabase SQL editor)
2. Telegram bot setup + env vars
3. `lib/telegram-auth.ts` — HMAC verify helper
4. NextAuth `CredentialsProvider` for Telegram + collision-handling logic
5. Landing page: second sign-in button
6. Dashboard: Telegram widget embed for linking (replace free-text for non-admins)
7. Session hydration: dual-identity avatar/name fallback
8. Submit page: "Link X first" CTA on X platform when user has no twitter_id

Estimated 3–4 hours end-to-end after the bot is created.
