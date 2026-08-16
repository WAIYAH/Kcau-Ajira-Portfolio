# KCA Ajira Club — Member Dashboard

Authenticated React app for the member/leader dashboard described in [`../PLAN.md`](../PLAN.md). Separate app from the public marketing site (`../index.html` etc.) — it doesn't touch that site at all.

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4, backed by Supabase (Postgres + Auth + Storage + Edge Functions).

## Status

- [x] **Phase 0** — schema + RLS, auth flows, role-aware shell, dashboard overview, profile page
- [x] **Phase 1** — member management (search/filter, approval queue, role promotion)
- [x] **Phase 2** — finance ledger, dues tracking, budgets vs. actuals, receipt uploads
- [x] **Phase 3** — events + RSVP, elections + voting + results
- [x] **Phase 4** — in-app announcements + email sending (Edge Function, needs your own Resend account — see below), CSV reports (membership/finance/attendance/election)
- [ ] **Phase 5** — learning hub, remaining polish (see `PLAN.md`)

## One-time setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. In the SQL Editor, run every file in [`supabase/migrations/`](supabase/migrations/) **in order** (0001 → 0005). Each is safe to run once; re-running an already-applied one is usually harmless (`create or replace`, `on conflict do nothing`) but they're not designed to be re-run out of order.
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 1. `.env.local` is gitignored — never commit real keys.

### 3. Install & run

```bash
npm install
npm run dev
```

### 4. Create the first admin account

Sign up through the app UI, then in the Supabase SQL Editor promote yourself:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'you@example.com';
```

Every account after that starts as `member` / `pending` — approve it from the **Members** page in the dashboard (or the same SQL pattern).

### 5. (Optional) Enable real email sending

Posting an announcement to the in-app feed works out of the box. Actually emailing it out requires deploying the `send-announcement-email` Edge Function with your own [Resend](https://resend.com) account (free tier: 100 emails/day, 3,000/month) — Claude cannot create or hold this account/key for you.

```bash
# from inside the dashboard/ folder
npx supabase login
npx supabase link --project-ref <your-project-ref>   # found in your Supabase project URL
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
npx supabase secrets set RESEND_FROM_EMAIL="KCA Ajira Club <you@yourdomain.com>"
npx supabase functions deploy send-announcement-email
```

Notes:
- Without a verified sending domain on Resend, use their sandbox address `onboarding@resend.dev` as `RESEND_FROM_EMAIL` (it only delivers to your own verified Resend account email until you verify a domain).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function automatically by Supabase — you don't set those.
- Until this is deployed, checking "Also send by email" in Communications will still post the in-app announcement, but will show a clear error instead of silently pretending to send.

## Project structure

```
src/
  lib/
    supabaseClient.ts        Supabase client (reads env vars)
    csv.ts                   CSV building + browser download helper
    format.ts                Currency formatting
  contexts/AuthContext.tsx   Session + profile state, sign in/up/out, role helpers
  components/
    ProtectedRoute.tsx       Redirects unauthenticated / pending users
    RoleGate.tsx              Hides staff-only routes from plain members
    Badge.tsx                 Status/role pill components
    layout/                   DashboardLayout (role-aware sidebar), AuthLayout
    members/MemberDrawer.tsx  Member detail/edit side panel
    voting/ElectionCard.tsx   Election display, candidates, voting, results
  pages/
    auth/                     Login, SignUp, ForgotPassword, PendingApproval
    Overview.tsx              Role-aware landing dashboard
    Profile.tsx               Self-service profile editor
    members/MemberList.tsx    Member management (Phase 1)
    finance/                  Ledger, Dues, Budgets tabs (Phase 2)
    events/Events.tsx         Events + RSVP (Phase 3)
    voting/Voting.tsx         Elections list + create (Phase 3)
    communications/           Announcements composer + feed + email log (Phase 4)
    reports/Reports.tsx       CSV report generation + history (Phase 4)
    learning/Learning.tsx     Still a "Coming soon" placeholder (Phase 5)

supabase/
  migrations/    0001 schema+RLS, 0002/0003 bootstrap-admin trigger fixes,
                 0004 receipts storage bucket, 0005 reports storage bucket,
                 0006 inquiries table (public Contact + Join forms -> Inbox)
  functions/
    send-announcement-email/  Edge Function: verifies caller is staff,
                               sends via Resend, logs to email_log
```

## Notes on the security model

- Every table has Row Level Security enabled — the frontend never gets broader access than the database grants, regardless of what the UI shows.
- `profiles.role` / `profiles.status` can only be changed by an existing Leader/Admin (enforced by a Postgres trigger, not just RLS) — a member can't self-promote, and only an existing Admin can grant the Admin role (`0003`).
- Raw financial transactions and raw ballots are staff-only / nobody-reads-directly respectively. Everyone else only ever sees an aggregate (`club_balance` view, `get_election_results()` function) — see the comments in the migration files for why.
- The `send-announcement-email` function independently re-checks the caller's role server-side against `profiles` (using the service role key) before sending anything — it doesn't trust the client's claim of being staff.
- Receipts and generated reports live in private Storage buckets, staff-only, downloaded via short-lived signed URLs rather than public links.
