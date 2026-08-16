# KCA Ajira Club — Member & Admin Dashboard Platform
## Comprehensive Execution Plan

**Status:** Planning → Phase 0
**Owner:** KCA Ajira Club Leadership
**Stack decision:** Supabase (Postgres + Auth + Storage + Edge Functions) + React (Vite), free-tier hosting throughout
**Public site:** `index.html`, `about.html`, `programs.html`, etc. stay as-is (static, no login). The dashboard is a **new app** that lives alongside it.

---

## 1. What exists today vs. what's being added

**Today:** A fully static marketing site (HTML/Tailwind CDN/vanilla JS). No accounts, no database, no server. Forms just show toasts — nothing is actually stored.

**Adding:** A separate authenticated web app (`/dashboard`) with two experiences behind one login:
- **Member view** — profile, dues/balance, events, voting, learning resources, announcements
- **Leader/Admin view** — everything a member sees, plus member management, finance ledger, email composer, report generation, elections management, content/event management

These are one React app with role-based routing/UI, not two separate codebases.

---

## 2. Roles & permissions

| Role | Who | Can do |
|---|---|---|
| **Member** | Any approved club member | View/edit own profile, view balance & dues history, RSVP events, vote in open elections, access learning resources, view announcements |
| **Leader** (Exec: President, VP, Treasurer, Secretary, Dept Leads) | Elected/appointed leadership | Everything a Member can, plus: manage members, record finance transactions, create events, send emails/announcements, create & manage elections, generate reports |
| **Super Admin** | President + designated technical lead | Everything a Leader can, plus: manage leader accounts/roles, view audit log, edit system settings |

Enforced at the database layer via Supabase **Row Level Security (RLS)** policies — never trust the frontend alone. Every table checks `auth.uid()` against a `profiles.role` column server-side.

---

## 3. Core data model (Postgres tables)

```
profiles          id (=auth.users.id), full_name, email, phone, university_id,
                   course, year_of_study, role (member/leader/admin), status
                   (pending/active/suspended/alumni), avatar_url, joined_at

membership_dues    id, profile_id, term (e.g. "2026 Trimester 1"), amount_due,
                    amount_paid, status, due_date

transactions        id, type (income/expense), category, amount, description,
                    recorded_by, receipt_url, occurred_at, created_at
                    -- powers the Finance ledger + running balance

budgets             id, term, category, planned_amount

events               id, title, description, category, location, starts_at,
                     ends_at, cover_image_url, created_by

event_rsvps          id, event_id, profile_id, status (going/maybe/declined)

elections            id, title, description, opens_at, closes_at, status,
                     is_anonymous, created_by

candidates           id, election_id, profile_id or name, position, statement, photo_url

votes                id, election_id, position, candidate_id, voter_id (hashed/unique
                     constrained so one vote per voter per position; voter identity
                     stripped from tallies if is_anonymous)

announcements        id, title, body, audience (all/members/leaders), sent_by,
                     sent_via (in-app/email/both), created_at

email_log            id, subject, body, template, audience, sent_by, recipient_count,
                     status, created_at

learning_resources    id, title, type (article/video/course/link), category, skill_tag,
                     url_or_content, created_by

learning_progress    id, profile_id, resource_id, status (not_started/in_progress/done)

reports_generated    id, type (finance/membership/attendance), generated_by,
                     period_start, period_end, file_url, created_at

audit_log            id, actor_id, action, target_table, target_id, created_at
```

This is deliberately relational (not a pile of loose spreadsheets) so balances, votes, and reports can be computed with real integrity constraints instead of manual reconciliation.

---

## 4. Feature modules

### 4.1 Authentication & onboarding
- Supabase Auth (email/password + optional Google sign-in for university Gmail accounts)
- Sign-up creates a `profiles` row with `status = pending`
- Leader approves new members from an "Pending Approvals" queue → status becomes `active`
- Password reset, email verification handled by Supabase out of the box

### 4.2 Member management (Leader/Admin)
- Searchable/filterable member table (name, course, year, status, dues status)
- Bulk actions: approve, suspend, tag as alumni, export to CSV
- Individual profile drawer: edit details, view dues history, view event attendance, promote to Leader role

### 4.3 Finance / Treasury
- Ledger view: chronological list of all income/expense transactions with running balance
- **Balance shown on both dashboards** — headline number on the overview page for everyone; full ledger detail restricted to Leaders
- Add transaction form (Leader/Treasurer only): amount, category, description, optional receipt image upload to Supabase Storage
- Per-member dues tracker: who has paid, who owes, auto-flag overdue
- Budget vs. actual view per term/category
- Exportable finance report (CSV + PDF) for a date range

### 4.4 Voting / Elections system
- Leader creates an election: title, positions (e.g. President, Treasurer), candidates per position, open/close datetime, anonymous toggle
- Members vote once per position while the election is open (DB constraint prevents double-voting)
- Live results only visible to Leaders while open; auto-published to everyone when closed
- Results view with vote counts and simple bar chart
- Optional: require member `status = active` and dues-paid to be eligible to vote (configurable rule)

### 4.5 Communications / Email
- Composer: pick audience (all members / leaders / a saved segment), subject, body (rich text or simple markdown), optional template
- Sends via a Supabase Edge Function calling **Resend** (free tier: 100 emails/day / 3,000/month — sufficient for a club)
- In-app announcement feed mirrors every email sent, so members without email access still see it in the dashboard
- Send log with delivery status per campaign

### 4.6 Reports
- One-click generated reports (PDF via a lightweight lib like `@react-pdf/renderer`, or CSV): membership roster, finance statement, event attendance, election results
- Report history stored in `reports_generated` with a downloadable file link (Supabase Storage)

### 4.7 Events / Upcoming activities
- Admin creates events (title, date/time, location, category)
- Every dashboard user sees an "Upcoming Activities" widget (next 3–5 events, countdown)
- Members RSVP; Leaders see attendance counts per event
- Feeds the same event data the public site's countdown widget already displays (shared source of truth eventually)

### 4.8 Learning Hub (online skills)
- Category-tagged resources (matches existing Skills page categories: Web, AI, Data, Marketing, Soft Skills, etc.)
- Members mark resources as in-progress/complete; simple progress bar per category
- Leaders curate/add resources (link out to external courses, or host short articles)

### 4.9 Dashboard overview (landing screen after login)
- **Member view:** welcome banner, my dues/balance status, upcoming events, open elections needing my vote, latest announcements, learning progress snapshot
- **Leader/Admin view:** same, plus club-wide KPIs (total members, total balance, pending approvals, overdue dues count, open elections, recent transactions) as stat cards + a couple of charts (membership growth, income vs expense trend)

---

## 5. Security & data integrity

- RLS on every table; members can only read/write their own rows, Leaders/Admins get broadened policies checked against `profiles.role`
- Treasurer-only write access to `transactions`/`budgets` (even other Leaders are read-only unless also tagged Treasurer, if the club wants that granularity — confirm during Phase 2)
- Vote table structured so raw ballots are never joinable back to a voter identity when `is_anonymous = true` (store a one-way hash for the uniqueness constraint, not the plain voter_id)
- Audit log for all destructive/financial actions (edits, deletions, role changes)
- All secrets (Supabase keys, Resend key) in environment variables, never committed

---

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS | Fast dev, matches existing Tailwind visual language, type safety for a data-heavy app |
| Routing | React Router | Standard, simple role-based route guards |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) | One free-tier platform covers DB + auth + file storage + serverless functions |
| Email | Resend (via Edge Function) | Generous free tier, simple API, good deliverability |
| Charts | Recharts | Lightweight, matches dataviz needs (balances, trends, results) |
| PDF export | `@react-pdf/renderer` | Client-side report generation, no extra backend service |
| Hosting | Vercel or Netlify (free tier) for the dashboard app; existing static site stays wherever it is now | Zero-cost, git-push deploys |

---

## 7. Phased execution plan

**Phase 0 — Foundation ✅ done**
- [x] Schema & RLS policies written (`dashboard/supabase/migrations/0001_init.sql`) — run this once against a Supabase project to create it
- [x] React/Vite dashboard app scaffolded at [`dashboard/`](dashboard/), Tailwind v4 config matching current brand colors
- [x] Auth flows: sign up, log in, log out, password reset, pending-approval gate
- [x] Role-aware shell layout (sidebar nav differs for Member vs Leader/Admin)
- [x] Dashboard overview wired to real data: club balance, upcoming events, open elections, announcements, staff-only KPIs
- [x] Self-service profile page
- Placeholder "Coming soon" screens mark where every later phase plugs in

**You still need to:** create a free Supabase project and follow [`dashboard/README.md`](dashboard/README.md) to connect it — the app won't run without real `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` values.

**Phase 1 — Members & Profiles ✅ done**
- [x] Member self-service profile page
- [x] Leader member-management table + search/filter + approval queue + role promotion (drawer per member)
- [x] DB-level guard: only an existing Admin can grant the Admin role (`0003_restrict_admin_promotion.sql`)

**Phase 2 — Finance / Treasury ✅ done**
- [x] Transactions ledger (add/list/delete-by-admin), running income/expense/balance stats, receipt upload to a private Storage bucket (`0004_finance_storage.sql`) with on-demand signed-URL viewing
- [x] Dues tracker per member/term, inline "record payment" with auto status (unpaid/partial/paid)
- [x] Balance widget already live on both dashboard views (Overview page, Phase 0)
- [x] Budget vs actual view (planned per category/term vs. all-time actual expenses in that category)

**Phase 3 — Events & Voting ✅ done**
- [x] Events CRUD (staff) + RSVP (everyone: going/maybe/declined) + upcoming/past split view; upcoming-activities widget already live on Overview (Phase 0)
- [x] Elections: draft → open → closed lifecycle, candidates per position, one-ballot-per-position voting (DB-enforced), live results for staff while open, published to everyone once closed

**Phase 4 — Communications & Reports ✅ done** (email sending needs one manual step — see below)
- [x] In-app announcements feed — composer + audience targeting + feed, works immediately, no setup needed
- [x] Email composer + Resend integration + send log — Edge Function written (`dashboard/supabase/functions/send-announcement-email`), but **requires you to create your own Resend account, set `RESEND_API_KEY`, and deploy the function** (steps in `dashboard/README.md`) — this is a real external account/API key that only you can create, not something that can be provisioned automatically
- [x] Report generation (finance, membership, attendance, election) as CSV (not PDF — CSV covers the same need with far less complexity/dependencies), with history + re-download via `dashboard/supabase/migrations/0005_reports_storage.sql`

**Phase 5 — Learning Hub & Polish ✅ done** (core items; full accessibility/mobile audit not separately performed)
- [x] Learning resources CRUD (staff) + member progress tracking (not started/in progress/done), grouped by category with a filter bar and an overall completion meter
- [x] Admin overview KPIs/charts — added a 6-month income vs. expense bar chart to the Overview page (staff-only), built per the dataviz skill's validated categorical palette
- [x] Audit log surfaced in an **Admin-only** settings view (`/settings/audit-log`) — matches the RLS already built in Phase 0 (`is_admin()`, tighter than "Leader-only"); instrumented at the highest-value actions: member role/status changes, transaction deletions, election status changes
- [x] Accessibility pass — every form input across all modules now has a properly associated `<label htmlFor>` (or `aria-label` for compact inline fields); toggle-style buttons (RSVP, learning progress, category filters) carry `aria-pressed`; the Member drawer is a real `role="dialog"` with `aria-modal`, a labelled heading, and closes on Escape; added a skip-to-content link and `aria-label`/`aria-expanded` on the mobile nav toggle. Not done: a full WCAG contrast audit or real mobile-device testing — responsive Tailwind layout is inherited from earlier phases but untested on-device.

**Phase 6 — Launch**
- Data migration/import of real current member list (if one exists in a spreadsheet)
- Leadership training on the admin tools
- Soft launch to a small group, then full member rollout

---

## 8. Open questions to confirm before/at Phase 2–3

- Does "leader" mean the full exec committee, or should finance write-access be restricted to Treasurer + President only?
- Should elections be open to all active members, or only dues-paid members?
- Is there an existing spreadsheet of current members/finance history to migrate in Phase 6?
- Preferred email sending identity (e.g. a club Gmail vs a custom domain via Resend)?

---

## Next step

Confirm this plan, then Phase 0 begins: Supabase project setup + dashboard app scaffold + auth.
