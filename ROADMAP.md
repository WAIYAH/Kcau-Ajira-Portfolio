# KCA Ajira Club — System Improvement Roadmap

A grounded audit of the live system (public site + dashboard) as of 2026-08-16, with concrete, doable next steps. Every item below was checked against the actual code/schema, not guessed — file paths and table names are real.

**What exists today:** a static marketing site (`index.html`, `about.html`, etc. + `js/`) wired to Supabase for the Contact/Join forms, and a full React/Vite/Supabase member+admin dashboard (`dashboard/`) covering auth, profiles (incl. photo/bio/skills/CV as of the last change), member management, finance, events, elections, communications, reports, and a learning hub — all styled on a token-based design system with dark mode, motion, and a verified WCAG AA pass.

Items are grouped by payoff-vs-effort, not by feature area, so you can work top-down.

## Execution status

Being built in phases, each independently verified (`tsc -b`, `lint`, `build`, and live verification for anything user-facing) and committed:

- [x] **Phase 1** — CI workflow, form honeypot, storage cleanup on replace, route-level code splitting, member search
- [x] **Phase 2** — Opportunities / Gigs board (§2.1)
- [ ] **Phase 3** — Automated dues reminder emails (§2.3)
- [ ] **Phase 4** — Persisted notifications table + realtime bell (§2.2)
- [ ] **Phase 5** — Public site ↔ dashboard content unification (§2.4)
- [ ] **Phase 6** — Engineering hygiene: Vitest + first tests, error boundary, backup routine doc (§3.1–3.3)
- [ ] **Phase 7** — Remaining Tier 4 items where genuinely doable without a human in the loop (PWA, tablet sidebar default); command-palette and real screen-reader hardware testing stay explicitly deferred (see notes in that phase)

---

## Tier 1 — Small, high-leverage fixes (do these first)

### 1.1 Public contact/join forms have zero spam protection
`js/form-handler.js` posts straight to `public.inquiries` with an RLS policy of `for insert with check (true)` (`dashboard/supabase/migrations/0006_inquiries.sql`) — anyone, including bots, can write unlimited rows with no gate at all. There's no honeypot field, no rate limiting, nothing.
- **Fix:** add a hidden honeypot input (bots fill every field; humans don't) to both forms in `js/form-handler.js` and reject client-side if it's non-empty. Pair with a Postgres check constraint or trigger that rejects inserts more than, say, 5/minute from obviously identical payloads if spam becomes a real problem later.
- **Effort:** S (a few lines in `form-handler.js`, no schema change needed for the honeypot alone).

### 1.2 Uploaded avatars/CVs never get cleaned up
The new `Profile.tsx` upload/replace/remove flow updates `profiles.avatar_url`/`cv_url` but never deletes the previous object from Storage — every replace leaves an orphaned file behind. Harmless at first, but it silently eats into the free-tier Storage quota over months of "let me re-upload my photo" churn.
- **Fix:** before uploading a replacement (or on remove), parse the old `avatar_url`/`cv_url` and call `supabase.storage.from('avatars'|'cvs').remove([oldPath])`.
- **Effort:** S — isolated to `handleAvatarChange`/`handleRemoveAvatar`/`handleCvChange`/`removeCv` in `dashboard/src/pages/Profile.tsx`.

### 1.3 No CI at all
There's no `.github/workflows/` — every `tsc -b` / `lint` / `build` check this session ran was manual, by me, locally. Nothing stops a future broken PR from merging.
- **Fix:** one GitHub Actions workflow: `npm ci`, `npx tsc -b`, `npm run lint`, `npm run build` inside `dashboard/`, on every push/PR to `main`.
- **Effort:** S (one YAML file, ~20 lines) — highest leverage-per-minute item on this whole list.

### 1.4 Bundle size warning at build time
`npm run build` emits `dist/assets/index-*.js: 1,117.99 kB` with a "chunks larger than 500kB" warning — every dashboard route currently loads in one JS bundle.
- **Fix:** convert the route table in `App.tsx` to `React.lazy()` + `<Suspense>` per page (Members, Finance, Voting, Communications, Reports, Learning are all independent routes already). Mechanical change, no logic touched.
- **Effort:** S–M, real payoff for members opening the dashboard on mobile data.

### 1.5 Member search is a known, already-scoped gap
`improve.md` §11 already flags this honestly: the header search (`useGlobalSearch.ts`) only covers events + announcements, not members, because it was deferred pending an RLS-aware query design. That design question is now answered by precedent — `MemberList.tsx` already does a role-gated members query.
- **Fix:** extend `useGlobalSearch.ts` to also query `profiles` (name/email/course) when `isStaff` is true, same debounce/pattern already in place.
- **Effort:** S, since the hard design question is already resolved by existing code.

---

## Tier 2 — Mission-aligned features (medium effort, high value)

### 2.1 An Opportunities / Gigs board — the single highest-value addition
This is an **Ajira** club — its entire premise is connecting members to digital work. Right now `Resources/job-board.html` is static marketing copy with no real listings, and the dashboard has no equivalent module at all, despite already building rich CRUD patterns for events/elections/learning resources that this would directly reuse.
- **What:** a new `opportunities` table (title, org, type [job/internship/gig/freelance], skill_tags text[], description, apply_url or apply_email, posted_by, expires_at, created_at). Staff post/edit/close listings; members browse/filter, with **skill_tags matched against the `profiles.skills` array I just shipped** to power a "Recommended for you" section — zero extra data entry required from members, since the data already exists.
- **Why now, specifically:** the `skills` field added this session was scoped as a profile nicety, but it's actually the exact input this feature needs — building it now means that work compounds instead of sitting unused.
- **Effort:** M — one migration (mirrors `events`' shape closely), one new nav section, list + filter UI + staff composer, reusing `Card`/`Badge`/`EmptyState` primitives already in place.

### 2.2 A real, persisted notifications system
The header bell today (`useNotificationSignals.ts`) computes ephemeral signals on every load (pending approvals, open votes) — there's no `notifications` table, no "mark as read," and nothing pushes updates without a manual refresh (confirmed: no Supabase Realtime channel is used anywhere in the app).
- **Fix:** a `notifications` table (profile_id, type, title, body, link, read_at, created_at) written to by the existing triggers/actions that already fire (new announcement, new opportunity from 2.1, dues reminder from 2.2b, election opening) via a Postgres trigger or the app layer; subscribe to it client-side with `supabase.channel(...).on('postgres_changes', ...)` for live badge updates.
- **Effort:** M — this is the natural next step once 2.1 exists, since new opportunities are exactly the kind of event worth a push notification.

### 2.3 Automated dues reminders
The dues tracker (`Finance/Dues`) is fully manual today — a leader has to notice who's unpaid and chase them individually. The email infrastructure (Resend + `send-announcement-email` Edge Function) already exists and works.
- **Fix:** a scheduled Edge Function (Supabase Cron / `pg_cron`, both free-tier available) that runs weekly, queries `membership_dues` for `status != 'paid' and due_date < now() + interval '7 days'`, and sends a reminder email per member via the same Resend call pattern already proven in `send-announcement-email`.
- **Effort:** S–M — mostly copy-adapt of an Edge Function that's already been written once.

### 2.4 Public site ↔ dashboard content unification
The public `skills.html` and events/countdown content on `index.html` are hand-maintained static HTML, while the dashboard already has live `learning_resources` and `events` tables covering overlapping ground — meaning leaders currently have to update content in two places by hand and they will drift.
- **Fix (lower risk, do first):** have the public site's events countdown widget (`js/countdown.js`) fetch from the dashboard's `events` table via the anon key (read-only, already public-safe data) instead of a hardcoded date.
- **Fix (bigger, optional):** same for `skills.html` pulling from `learning_resources`.
- **Effort:** S for the events widget, M if extended to skills content. Explicitly optional — the current static pages work fine, this is a maintenance-burden reduction, not a functionality gap.

---

## Tier 3 — Engineering hygiene (protects everything above)

### 3.1 Zero automated test coverage
No `vitest`/`jest`/`@testing-library` in `package.json` — every verification this session (and prior sessions) was manual Playwright screenshotting, which is thorough but not repeatable or CI-enforceable.
- **Fix:** add `vitest` + `@testing-library/react`. Don't aim for 100% coverage — start with the handful of places a silent regression would actually hurt: role-gating logic (`RoleGate`, `ProtectedRoute`), the dues status calculation, the vote-uniqueness UI guard, the skill-chip add/remove logic just shipped.
- **Effort:** M to set up + first tests; ongoing cost is small once the harness exists.

### 3.2 No error monitoring in production
Supabase query failures are shown inline (good), but any unhandled JS exception in production is invisible — no error boundary, no Sentry/logging service.
- **Fix:** a top-level React error boundary in `App.tsx` (cheap, no new dependency) as a baseline; optionally wire the free tier of Sentry (5k events/month, plenty for a club-sized app) if visibility into real user errors matters.
- **Effort:** S for the boundary alone, S–M with Sentry.

### 3.3 No backup routine documented
Supabase free-tier projects don't carry point-in-time recovery. If the project were ever deleted or corrupted, there's currently no documented recovery path.
- **Fix:** not code — a monthly calendar reminder for whoever holds the Supabase account to run `supabase db dump` (CLI already linked — `dashboard/supabase/.temp/linked-project.json` shows the project is already linked) and store the file somewhere safe. Document the one command in `README.md`.
- **Effort:** S, pure process — highest value-per-minute item after the CI workflow.

---

## Tier 4 — Worth doing eventually, not urgent

- **PWA/installable dashboard** — `vite-plugin-pwa` is a small config addition; lets members "Add to Home Screen" on mobile. Cosmetic/convenience, not a gap.
- **Command palette (⌘K)** — already flagged as deferred in `improve.md` §10; revisit once the header search (1.5) and opportunities board (2.1) exist, since a palette is most useful once there's more to search/act on.
- **Sidebar auto-collapse at tablet width** — cosmetic gap already logged in `improve.md`'s Phase 6 notes; low priority, nothing is broken today.
- **Real screen-reader hardware pass (NVDA/VoiceOver)** — `improve.md` §12 already flags that only the ARIA-tree proxy was tested, not real assistive tech. Costs nothing but a member's time with existing free software — worth scheduling once, not urgent.

---

## Suggested order of attack

If tackled in one pass, this order minimizes wasted setup and maximizes compounding value:

1. **1.3 CI workflow** — protects every change after it.
2. **1.1 honeypot** + **1.2 storage cleanup** — quick, self-contained, closes real gaps.
3. **1.5 member search** — cheap, reuses existing patterns.
4. **2.1 Opportunities board** — the actual mission-critical feature; unlocks 2.2's best use case.
5. **2.3 dues reminders** — reuses existing email infra almost as-is.
6. **2.2 notifications table** — natural next step once 2.1 gives it something worth notifying about.
7. Everything else, as time/interest allows.

Nothing above requires new paid infrastructure — every suggestion stays inside Supabase's free tier and the dependencies already in `dashboard/package.json`, plus at most one or two small additions (`vitest`, optionally `vite-plugin-pwa`, optionally Sentry's free tier).
