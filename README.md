# The Zed Project

The all-in-one digital OS for Nigerian Gen Z: civil guides, skills, freelance work, community, campus life, creator resources and safety, with off-chain $ZED rewards.

This repository is **Phase 1 (Days 1-30, Core Foundation)**: a Next.js PWA, authentication, a NIN verification pipeline and the Zed Nav civil process engine. Other modules are shown as "Coming soon".

Live: https://zedng.vercel.app

## Status

| Area | Status |
|---|---|
| Next.js PWA shell, offline caching | Built |
| Authentication (email + password, phone saved to profile) | Built |
| NIN verification pipeline | Built, **demo provider** (mocked) |
| Zed Nav engine (JSON flows, state machine) | Built |
| Flows: Passport, NYSC, NIN/BVN, CAC | Built |
| Document checker (client-side) | Built |
| Offline progress, synced to Supabase | Built |
| Centre tracker | Built |
| Admin console (users, reports, audit log, charts) | Built (extra) |
| Marketing site, privacy, terms, cookies | Built (extra) |
| CDS Logger (personal attendance tracker) | Built |
| NYSC Call-up Letter Parser (client-side) | Built |
| Zed Mining (daily $ZED point claim, level matrix, Turnstile) | Built |
| Zed Skill (career playbooks, lesson progress, skill points) | Built |
| White Paper (`/whitepaper`, PDF download) | Built |
| Fund your idea (`/fund`, submissions, admin review) | Built |
| PPA Hub | Planned |
| Phone OTP sign-in | Planned |
| Zed Market, Meet, Communities, Campus Hubs, Live Audio Rooms, Creator Lab, Zed SOS, $ZED rewards | Planned (Phases 2-3), shown as Coming soon |

## Tech stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- shadcn/ui and Recharts (dashboard and admin)
- Supabase: Auth, Postgres, Row Level Security
- Zustand, Zod, React Hook Form
- Serwist (service worker and offline support)
- Vitest

## Getting started

Requirements: Node.js 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Where it is used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Never expose or commit. Used for admin actions |
| `NIN_HASH_SALT` | **Server only** | At least 32 characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser | Cloudflare Turnstile site key. Omit in dev to use the always-pass test key. |
| `TURNSTILE_SECRET_KEY` | **Server only** | Cloudflare Turnstile secret key. Required in production. |
| `FUNDING_IP_SALT` | **Server only** | Salt for client IP SHA-256 hash in /fund submissions (fail-closed if missing). |
| `RESEND_API_KEY` | **Server only** | Resend API key for best-effort email notifications on funding submissions. |
| `FUNDING_FROM_EMAIL` | **Server only** | Sender email address for funding emails (e.g. `Zed Funding <onboarding@resend.dev>`). |
| `FUNDING_NOTIFY_EMAIL` | **Server only** | Team inbox receiving pitch submissions (defaults to `thezedprojectng@gmail.com`). |

Never commit `.env.local`. Set the same variables in Vercel for Production **and** Preview.

## Database

SQL migrations are in `supabase/migrations/`. Run them in order in the Supabase SQL editor (or via the Supabase CLI):

1. `0001_init.sql`: users, trigger, RLS, nav progress, centre reports
2. `0002_admin_role.sql`: role column, `is_admin()`, admin policies
3. `0003_admin_audit_log.sql`: append-only audit log
4. `0004_module_interest.sql`: module interest registry
5. `0005_cds_logs.sql`: CDS logs table with RLS (user-scoped + admin select)
6. `0006_zed_mining.sql`: `token_wallets`, `mining_logs`, and `claim_daily_mining()` RPC (auth.uid() security definer, no user id parameter, unique(user_id, claim_date))
7. `0007_zed_skill.sql`: `skill_tracks`, `skill_lessons`, `skill_progress`, and `complete_lesson()` RPC (auth.uid() security definer, idempotent)
8. `0008_zed_withdrawals.sql`: manual bank withdrawals and admin-set token price
9. `0009_referrals.sql`: referral codes, attribution, and anti-abuse mechanisms
10. `0010_funding_submissions.sql`: project idea submissions, salted IP rate limiting, admin review and audit logging

Authentication is configured with email + password. The sign-up flow creates a `public.users` row from auth metadata through a security-definer trigger.

### Creating an admin

In the Supabase SQL editor:

```sql
update public.users
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Admin pages are protected server-side. Non-admins receive a 404.

## Security notes

- The NIN is validated (11 digits) and **only a salted SHA-256 hash is stored**. The raw NIN is never stored or logged.
- NIN verification currently uses a mock provider and the UI labels it "Demo verification".
- The service role key is used only in server code.
- Row Level Security is enabled. Users can read and update only their own profile, and column grants limit what can be edited.
- Admin actions are written to an append-only audit log.

## Scripts

```bash
npm run dev         # local development
npm run build       # production build
npm run lint        # lint
npm run test        # unit tests (Zed Nav engine)
```

## Zed Nav flows

Flows are JSON files in `src/data/nav/` and are validated against a Zod schema. Step types: `info`, `checklist`, `link`, `decision`, `document-check`. The engine in `src/lib/nav/engine.ts` is a pure state machine and has unit tests.

## Differences from the specification

- Email + password sign-in instead of phone OTP (OTP is planned).
- Supabase (Auth, Postgres, RLS) instead of a separate Fastify or FastAPI service with Redis.
- NIN provider is mocked. A real provider integration is needed for production.
- The marketing site and admin console are additions beyond the Phase 1 scope.

## Roadmap

- Days 1-30: Core Foundation (this repository)
- Days 31-60: Zed Meet, database expansion, daily $ZED mining, campus hubs
- Days 61-90: Paystack/Flutterwave escrow, Zed SOS, creator asset library, beta launch

## Zed Mining

$ZED is an **off-chain engagement point with no cash value** in Phase 1.

- Users claim once per Lagos calendar day (Africa/Lagos timezone).
- Level 1 (Rookie) gives 100 $ZED/day with a 1.0× multiplier. Levels 2-5 are locked.
- Claims are bot-protected via Cloudflare Turnstile.

**Planned (not yet implemented):**
- Device fingerprinting (additional bot protection layer)
- $ZED conversion and withdrawal to real value