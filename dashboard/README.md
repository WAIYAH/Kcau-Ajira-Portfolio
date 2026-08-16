# KCA Ajira Club — Member Dashboard

Authenticated React app for the member/leader dashboard described in [`../PLAN.md`](../PLAN.md). Separate app from the public marketing site (`../index.html` etc.) — it doesn't touch that site at all.

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4, backed by Supabase (Postgres + Auth + Storage + Edge Functions). UI built on Lucide icons, Motion (Framer Motion) for animation, and self-hosted Inter/Plus Jakarta Sans fonts — see [Design system](#design-system) below.

## Status

Functionality (see [`../PLAN.md`](../PLAN.md) for the full build history):

- [x] **Phase 0** — schema + RLS, auth flows, role-aware shell, dashboard overview, profile page
- [x] **Phase 1** — member management (search/filter, approval queue, role promotion)
- [x] **Phase 2** — finance ledger, dues tracking, budgets vs. actuals, receipt uploads
- [x] **Phase 3** — events + RSVP, elections + voting + results
- [x] **Phase 4** — in-app announcements + email sending (Edge Function, needs your own Resend account — see below), CSV reports (membership/finance/attendance/election)
- [x] **Phase 5** — learning hub, accessibility pass

UI/UX redesign — see [`improve.md`](improve.md) for the full plan and rationale:

- [x] **Phases 1–7** — design system (tokens, dark mode, component primitives), collapsible sidebar + real header, Overview rebuild, full page-by-page consistency pass, motion/reduced-motion, WCAG AA contrast audit, docs

## One-time setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. In the SQL Editor, run every file in [`supabase/migrations/`](supabase/migrations/) **in order** (0001 → 0010). Note: 0009 needs manual edits first (project ref + a secret) — see step 6 below; skip it initially and come back once you've done step 5. Each is safe to run once; re-running an already-applied one is usually harmless (`create or replace`, `on conflict do nothing`) but they're not designed to be re-run out of order.
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

### 6. (Optional) Enable automated weekly dues reminders

Once step 5 is done (Resend is already configured), members with unpaid/partial dues that are overdue or due within 7 days can get an automatic reminder email every Monday, instead of a Leader manually checking the Dues tab.

```bash
# from inside the dashboard/ folder, after steps above
npx supabase secrets set CRON_SECRET=<any random string you choose>
npx supabase functions deploy send-dues-reminder --no-verify-jwt
```

Then either open [`supabase/migrations/0009_dues_reminder_cron.sql`](supabase/migrations/0009_dues_reminder_cron.sql), fill in your project ref and the same `CRON_SECRET` value, and run it in the SQL Editor — or skip that file and create the equivalent schedule from **Database → Cron Jobs** in the Supabase dashboard UI, which fills in the project URL for you.

To test it immediately rather than waiting for Monday:
```bash
curl -X POST https://<your-project-ref>.functions.supabase.co/send-dues-reminder -H "x-cron-secret: <your CRON_SECRET>"
```

## Design system

The UI runs on a token-based design system — see [`improve.md`](improve.md) for the full rationale, phase-by-phase history, and the WCAG contrast audit. The short version:

- **Tokens** live in `src/index.css` under a single `@theme` block (Tailwind v4 CSS-first config, no separate config file) — semantic names only (`bg-surface`, `text-fg-muted`, `text-primary`), never raw hex or raw Tailwind gray classes. Each status color (`secondary`/`success`/`danger`) has three deliberately different values — a vivid **base** for icons/charts, a darker light-mode **`-ink`** for badge/error text, and a theme-independent **`-solid`** for white-text button fills — because a single value can't pass WCAG AA in all three roles at once (see `improve.md` §12 for why).
- **Dark mode** is class-based (`<html class="dark">`, not just `prefers-color-scheme`), driven by `ThemeContext` (light/dark/system, persisted to `localStorage`, no-flash boot script in `index.html`). Toggle it from the header.
- **Component primitives** live in `src/components/ui/` (`Card`, `Button`, `Input`, `Select`, `Textarea`, `Modal`, `Drawer`, `Dropdown`, `Tooltip`, `Skeleton`, `Avatar`, `EmptyState`, `ProgressRing`) — every page consumes these instead of hand-typing Tailwind strings.
- **`/dev/ui-kit`** (admin-only route) is a living reference rendering every primitive and token swatch in both themes — check it first before hand-rolling a new pattern, and add to it if you add a new primitive.
- **Motion** uses the `motion` package, wrapped in `<MotionConfig reducedMotion="user">` at the app root — every animation automatically respects the OS-level "reduce motion" setting with zero per-component code.

## Project structure

```
src/
  lib/
    supabaseClient.ts        Supabase client (reads env vars)
    csv.ts                   CSV building + browser download helper
    format.ts                Currency formatting
    cn.ts                    clsx wrapper for conditional className composition
  contexts/
    AuthContext.tsx           Session + profile state, sign in/up/out, role helpers
    ThemeContext.tsx           Light/dark/system theme state + localStorage persistence
  hooks/
    useOverviewData.ts         All of the Overview page's Supabase queries, in one place
    useGlobalSearch.ts          Header search (debounced, events + opportunities + announcements)
    useNotificationSignals.ts   Header notification-bell: ephemeral staff signals + real
                                 persisted notifications (mark-as-read, live via Realtime)
  components/
    ui/                        Design-system primitives — Card, Button, Input, Select,
                                Textarea, TagInput, Modal, Drawer, Dropdown, Tooltip, Skeleton,
                                Avatar, EmptyState, ProgressRing (see Design system above)
    Logo.tsx                    Shared brand mark (sidebar, header, auth pages)
    ProtectedRoute.tsx           Redirects unauthenticated / pending users
    RoleGate.tsx                  Hides staff-only routes from plain members
    Badge.tsx                     Status/role pill components
    layout/                       DashboardLayout, Sidebar, SidebarNav, Header,
                                   MobileNavDrawer, AuthLayout, navConfig
    overview/                     Overview page's presentational pieces — HeroBanner,
                                   KpiCard, IncomeExpenseChart, ActivityFeed,
                                   UpcomingEventsCard, OpenElectionsCard,
                                   AnnouncementsCard, OverviewSkeleton
    members/MemberDrawer.tsx      Member detail/edit slide-over (built on ui/Drawer)
    voting/ElectionCard.tsx       Election display, candidates, voting, results
  pages/
    dev/UiKit.tsx              Admin-only design-system reference (see Design system above)
    auth/                     Login, SignUp, ForgotPassword, PendingApproval
    Overview.tsx              Role-aware landing dashboard
    Profile.tsx               Self-service profile editor
    opportunities/Opportunities.tsx  Jobs/internships/gigs/freelance board, skill-matched
                                      "Recommended for you" (ROADMAP.md Phase 2)
    members/MemberList.tsx    Member management (Phase 1)
    finance/                  Ledger, Dues, Budgets tabs (Phase 2)
    events/Events.tsx         Events + RSVP (Phase 3)
    voting/Voting.tsx         Elections list + create (Phase 3)
    communications/           Announcements composer + feed + email log (Phase 4)
    reports/Reports.tsx       CSV report generation + history (Phase 4)
    learning/Learning.tsx     Learning Hub — resources + per-member progress (Phase 5)

supabase/
  migrations/    0001 schema+RLS, 0002/0003 bootstrap-admin trigger fixes,
                 0004 receipts storage bucket, 0005 reports storage bucket,
                 0006 inquiries table (public Contact + Join forms -> Inbox),
                 0007 profile bio/skills/CV columns + avatars/cvs storage buckets,
                 0008 opportunities table (jobs/internships/gigs/freelance board),
                 0009 weekly dues-reminder cron schedule (needs manual edits, see step 6),
                 0010 notifications table + triggers + Realtime (announcements/
                 opportunities/election-open fan out to a per-member bell)
  functions/
    send-announcement-email/  Edge Function: verifies caller is staff,
                               sends via Resend, logs to email_log
    send-dues-reminder/       Edge Function: emails members with overdue/
                               soon-due dues, shared-secret auth (cron-only)
```

## Notes on the security model

- Every table has Row Level Security enabled — the frontend never gets broader access than the database grants, regardless of what the UI shows.
- `profiles.role` / `profiles.status` can only be changed by an existing Leader/Admin (enforced by a Postgres trigger, not just RLS) — a member can't self-promote, and only an existing Admin can grant the Admin role (`0003`).
- Raw financial transactions and raw ballots are staff-only / nobody-reads-directly respectively. Everyone else only ever sees an aggregate (`club_balance` view, `get_election_results()` function) — see the comments in the migration files for why.
- The `send-announcement-email` function independently re-checks the caller's role server-side against `profiles` (using the service role key) before sending anything — it doesn't trust the client's claim of being staff.
- Receipts and generated reports live in private Storage buckets, staff-only, downloaded via short-lived signed URLs rather than public links.
