# KCA Ajira Club — Dashboard Redesign
## Comprehensive UI/UX & Frontend Execution Plan

**Status:** Planning
**Scope:** `dashboard/` only — the authenticated React app. The public marketing site (`../index.html` etc.) is untouched.
**Relationship to `../PLAN.md`:** That document built the dashboard's *functionality* (Phases 0–5, all shipped). This document redesigns its *interface* on top of that finished functionality — no schema changes, no new RLS policies, no new tables. Every data source referenced below already exists.
**Author's role for this doc:** senior UI/UX designer + frontend engineer, writing this as the design brief and build plan I'd hand to myself before touching a single component.

---

## 0. Where we're starting from

A short, honest audit of the current app, because a redesign plan is only as good as its grip on the baseline:

- **Shell:** sidebar is fixed-width, text-only (no icons), hidden entirely on mobile behind a plain toggle. No collapse state. No desktop header at all — content starts right under a bare `<main>`. Account controls are a name + "Sign out" button at the bottom of the sidebar.
- **Visual system:** flat, near-shadowless (`shadow-*` appears twice in the whole app). Every card is the same hand-typed string — `bg-white rounded-2xl border border-gray-200 p-5/p-6` — repeated across ~20 files with no shared `Card` component. One accent color (`kca-blue`) actually gets used; `kca-orange` and `kca-teal` exist as tokens but are functionally decorative today.
- **Icons:** none. Zero icon library installed. "Icons" today are literal characters (`&larr;`, `&times;`, `+`).
- **Dark mode:** none. `color-scheme: light` is hardcoded.
- **Typography:** system font stack only, no webfont loaded.
- **Overview page:** 3–7 `StatCard`s (label + number, no icon, no trend), one recharts bar chart (income vs. expense, staff-only), two list sections (upcoming activities, open elections), one announcements list. All plain white cards, no motion.
- **Data available but unused on Overview:** `event_rsvps` (attendance/RSVP rates), `membership_dues` (collection rate), `learning_progress` (engagement). These are real tables already in production — new KPIs below pull from them, not from anything hypothetical.

This is a clean, well-structured, *visually unfinished* app. That's the good version of this problem: no fighting entrenched patterns, no CSS debt to unwind — mostly net-new surface area.

---

## 1. Design principles

Five rules I'll hold every screen to, in priority order when they conflict:

1. **Numbers read before labels.** On a dashboard, the KPI value is the headline; everything else (icon, label, trend) is caption. If a user can't tell the club's balance from three feet away, the hierarchy is wrong.
2. **One accent does the pointing.** Color is a signal, not decoration. Primary indigo/cyan means "actionable or active." Amber means "attention." Green/red mean "good/bad." If everything is colorful, nothing is.
3. **Motion explains, it doesn't perform.** Every animation earns its frame count by clarifying state change (collapsing, loading, succeeding) — never motion for its own sake, never anything that delays a leader trying to approve a member at 11pm before a deadline.
4. **Same component, everywhere.** One `Card`, one `Button`, one `Badge`. A treasurer looking at Finance and a member looking at Learning Hub should feel it's the same product, not two contractors' work stitched together.
5. **Staff-grade density, member-grade warmth.** Leadership screens (Finance, Reports, Members) can hold more data per view. Member-facing screens (Overview, Profile, Learning) get more breathing room and encouragement — this is still a student club, not a bank.

---

## 2. Design system foundations

### 2.1 Color

Semantic tokens, not raw Tailwind grays, defined once in `src/index.css` under `@theme` (Tailwind v4 CSS-first config, same mechanism already in use — no new tooling). Every token gets a light *and* dark value; components consume the semantic name only (`bg-surface`, `text-fg-muted`), never a raw hex or a raw Tailwind color class, so theming is a token swap, not a find-replace.

**Brand accents**

| Token | Light value | Dark value | Used for |
|---|---|---|---|
| `--color-primary` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) | Primary buttons, active nav, links, focus rings, chart series 1 |
| `--color-primary-hover` | `#4338CA` | `#6366F1` | Hover/active states on primary |
| `--color-accent` | `#06B6D4` (cyan-500) | `#22D3EE` | Gradient partner for primary (hero banner, chart area fill, active glow) |
| `--color-secondary` | `#F59E0B` (amber-500) | `#FBBF24` | Secondary CTAs, "needs attention" highlights, pending states |
| `--color-success` | `#10B981` | `#34D399` | Positive trend, active/paid/open status |
| `--color-danger` | `#EF4444` | `#F87171` | Negative trend, suspended/overdue status, destructive actions |

**Surfaces & text**

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#F6F7FB` (cool off-white) | `#0B1120` (deep slate-navy) |
| `--color-surface` | `#FFFFFF` | `#141B2E` |
| `--color-surface-raised` | `#FFFFFF` + shadow | `#1B2439` + shadow |
| `--color-border` | `#E7E9F0` | `#242E47` |
| `--color-border-strong` | `#D6D9E4` | `#33405F` |
| `--color-fg` | `#0F1222` | `#EEF1FA` |
| `--color-fg-muted` | `#6B7280` | `#93A0C2` |
| `--color-fg-subtle` | `#9CA3AF` | `#5C6788` |

The old `kca-blue`/`kca-dark`/`kca-orange`/`kca-teal` tokens are retired in favor of the semantic set above — `kca-blue` maps almost exactly onto `--color-primary` so no visual whiplash, it's a rename-with-intent, not a hue change.

**Gradients** (used sparingly — hero banner, primary button sheen, active sidebar item, chart fills): `linear-gradient(135deg, var(--color-primary), var(--color-accent))`.

### 2.2 Dark mode mechanism

Class-based (`<html class="dark">`), not media-only, so the in-app toggle can actually override the OS. A small `ThemeContext` (`src/contexts/ThemeContext.tsx`):

- Three states: `light` / `dark` / `system`. Persisted to `localStorage` (`kca-theme`).
- `system` subscribes to `matchMedia('(prefers-color-scheme: dark)')` and updates live if the OS theme changes mid-session.
- Applies/removes `.dark` on `document.documentElement` in a `useLayoutEffect` (before paint, so there's no light-mode flash on load).
- Tailwind v4 dark variant wired via `@custom-variant dark (&:where(.dark, .dark *));` in `index.css`.
- Theme switch itself gets a ~200ms `transition-colors` on `body`/major surfaces — the "smooth theme transition" the brief asks for, done with CSS, not JS animation.

### 2.3 Typography

- **UI/body text:** Inter — already the closest thing to what the system stack was approximating; making it explicit adds consistency across OSes.
- **Display/headings/KPI numbers:** Plus Jakarta Sans — slightly warmer and more geometric than Inter, gives large numbers personality without sacrificing legibility. Used for `h1`/`h2`, KPI values, and the hero greeting.
- Loaded via `@fontsource/inter` and `@fontsource/plus-jakarta-sans` (self-hosted npm packages, not a Google Fonts CDN call) — no external network request, no render-blocking `<link>`, no CDN privacy/consent concern for a university app.
- Scale (Tailwind defaults, used deliberately rather than ad hoc): `text-xs` (labels/eyebrows, uppercase, tracked), `text-sm` (secondary/meta), `text-base` (body), `text-lg`/`text-xl` (card titles), `text-3xl`/`text-4xl` (KPI values, Plus Jakarta Sans, tabular-nums so digits don't jitter on live updates).

### 2.4 Elevation, radius, spacing

- **Radius:** collapse the current messy mix (`rounded-lg`/`rounded-xl`/`rounded-2xl` used inconsistently) into three deliberate tiers — `--radius-sm: 8px` (badges, small buttons, inputs), `--radius-md: 12px` (buttons, inputs, list rows), `--radius-lg: 16px` (cards, modals, drawers). Matches the brief's 12–16px spec exactly.
- **Elevation:** introduce a real shadow scale instead of border-only flatness — `--shadow-xs` (input focus), `--shadow-sm` (resting card), `--shadow-md` (hovered card / dropdown), `--shadow-lg` (modal/drawer/popover), `--shadow-glow-primary` (a soft indigo glow used *only* on the active sidebar item and primary-button hover — the one deliberately "vibrant" moment). Dark mode shadows use higher opacity black + a faint colored edge, since flat black shadows disappear against dark surfaces.
- **Spacing:** keep the page's already-consistent rhythm (`p-4 md:p-8` page padding, `gap-6` grids) — no need to reinvent what isn't broken.

### 2.5 Icons

**Lucide** (`lucide-react`) — matches the brief's request directly (rounded stroke caps, 24px grid, consistent 1.5–2px stroke), tree-shakeable so bundle cost is per-icon, and has full coverage for every nav item and KPI below. Every icon in the app renders at `size={18}` (dense contexts: sidebar, table rows) or `size={20}` (KPI cards, header) with `strokeWidth={1.75}` as the one house setting, so the icon language never looks mismatched.

### 2.6 Motion

**Motion** (`motion`, the current name for the Framer Motion engine) for anything that isn't a simple hover/focus state achievable in pure CSS:

- Sidebar collapse/expand (width + icon/label crossfade)
- Staggered entrance for KPI cards and chart on route mount
- Drawer/modal enter-exit (slide + fade, replaces the current instant-appear `MemberDrawer`)
- Route transitions kept intentionally minimal (fade only, ~150ms) — a dashboard that leaders live in all day should never feel like it's making them wait on page-transition choreography.

Everything else (button press, card hover lift, badge color change) stays CSS `transition` — no need to pay JS animation cost for a `translateY` and a shadow.

### 2.7 New dependencies (the full list, nothing extra)

| Package | Why |
|---|---|
| `lucide-react` | Icon set |
| `motion` | Sidebar/drawer/stagger animation |
| `@fontsource/inter`, `@fontsource/plus-jakarta-sans` | Self-hosted webfonts |
| `clsx` | Conditional className composition for the new primitives (tiny, no runtime cost) |

No UI kit (no MUI/Chakra/shadcn scaffold) — the component layer below is hand-built on Tailwind to match the existing project's philosophy and keep bundle size and design control tight. `recharts` (already installed) stays as the charting library; nothing else needed there.

### 2.8 Housekeeping that pays for itself immediately

Add a `@/*` → `src/*` path alias (`tsconfig.app.json` `paths` + `vite.config.ts` `resolve.alias`). Every new component below is written against `@/` imports; existing files keep their relative imports until they're touched in Phase 3, so this is zero-risk and incremental.

---

## 3. Information architecture

### 3.1 Sidebar

Persistent, collapsible between two states:

- **Expanded (default, `w-64`):** section eyebrow labels ("MEMBER" / "LEADERSHIP" / "ADMIN"), icon + label per item, active item gets a filled soft-indigo background, a 3px left accent bar, and the `--shadow-glow-primary` glow on the icon.
- **Collapsed (`w-[76px]`):** icons only, centered; label reappears as a floating tooltip on hover (200ms delay, matches the rest of the app's restraint); section eyebrows collapse to a thin divider so the icon column doesn't feel orphaned.
- Toggle lives as a dedicated chevron/panel icon at the top of the sidebar, next to the logo — persists across sessions via `localStorage` (`kca-sidebar-collapsed`).
- Width transition: `250ms cubic-bezier(0.4, 0, 0.2, 1)` (Motion), content crossfades rather than reflowing mid-animation.
- **Nav map** (icons finalized, Lucide names):

| Section | Item | Route | Icon |
|---|---|---|---|
| Member | Overview | `/` | `LayoutDashboard` |
| Member | My Profile | `/profile` | `UserCircle` |
| Member | Events | `/events` | `CalendarDays` |
| Member | Voting | `/voting` | `Vote` |
| Member | Learning Hub | `/learning` | `GraduationCap` |
| Leadership | Members | `/members` | `Users` |
| Leadership | Finance | `/finance/*` | `Wallet` |
| Leadership | Communications | `/communications/*` | `Megaphone` |
| Leadership | Reports | `/reports` | `FileBarChart` |
| Admin | Audit Log | `/settings/audit-log` | `ShieldCheck` |

- Mobile (`< md`): sidebar becomes a full-height drawer sliding in from the left over a scrim, triggered from the header's hamburger — not the current bare "Menu" text button. Closes on route change, on scrim tap, and on `Escape`.
- Bottom of sidebar keeps the account block but upgrades it: avatar (initials-based gradient circle, matching the logo treatment) + name + role badge, click opens the same dropdown as the header avatar (see below) rather than a bare sign-out button — one less inconsistent pattern.

### 3.2 Header (net-new — currently doesn't exist on desktop)

A real sticky top header (`h-16`, `sticky top-0`, `backdrop-blur` + translucent surface so content scrolling underneath still reads as "behind glass," border-bottom hairline):

- **Left:** on mobile, hamburger; club mark (gradient "KA" roundel, reused from the sidebar logo so there's one logo asset, not two divergent hand-rolled ones) + "KCA Ajira Club" wordmark — hidden on the smallest breakpoint once the sidebar already shows it, so it's not duplicated on phones.
- **Center-left:** search bar (`⌘K` hinted, `rounded-md` input with a `Search` icon) — scoped for this phase to client-side search over members/events/announcements the current role can already see; a proper command palette is a stretch goal, not a blocker (see §7 non-goals).
- **Right, in order:** theme toggle (three-way `Sun`/`Moon`/`Monitor` segmented control, or a single icon button that cycles + shows current state on hover — final call in Phase 1 based on how much header width survives at `md`), notification bell (`Bell` icon + red dot/count badge — Phase 1 ships the UI wired to existing signals: pending approvals count for staff, open elections needing this user's vote for members; a true notifications table is future scope), avatar + name + `ChevronDown` opening a dropdown (Profile, Settings→Audit Log if admin, divider, Sign out).
- Header never scrolls away; only the `<main>` content area scrolls, sidebar and header both pinned — this is the "sticky header, fixed sidebar" behavior called out explicitly in the brief, achieved with a `grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-screen` shell rather than fighting document flow with multiple `position: fixed` elements.

---

## 4. Component primitive layer (net-new — closes the biggest gap found in the audit)

Every screen in the app currently re-types the same Tailwind string for "white card with rounded corners and a border." That duplication is the main reason the redesign risks looking inconsistent if done page-by-page. Fix at the root: build these once in `src/components/ui/`, then every page (existing and new) consumes them.

| Component | Replaces | Notes |
|---|---|---|
| `Card` | `bg-white rounded-2xl border border-gray-200 p-5` (30+ inline occurrences) | `surface` \| `raised` \| `interactive` (hover lift + shadow) variants |
| `Button` | ad hoc `bg-kca-blue hover:bg-kca-dark ...` strings | `primary` \| `secondary` \| `ghost` \| `danger` variants × `sm`/`md` sizes, built-in loading spinner state |
| `Input` / `Select` / `Textarea` | native elements styled inline per-file | consistent focus ring (`--color-primary`), consistent error state |
| `Badge` | existing `Badge.tsx` (`StatusBadge`/`RoleBadge`) | kept, restyled onto the new token set, same API — no call-site changes needed |
| `Modal` | none exists today | for anything that isn't a full drawer (confirm-delete, quick forms) |
| `Drawer` | `MemberDrawer`'s bespoke fixed-panel markup | generalized so `MemberDrawer` becomes a thin content wrapper around it |
| `Tooltip` | none | powers collapsed-sidebar labels, chart legend hints, icon-only buttons |
| `Dropdown` / `Menu` | none | header avatar menu, table row actions |
| `Skeleton` | none (loading states currently just don't render, or briefly flash empty) | shimmer block, used for KPI cards/charts/lists while fetching |
| `Avatar` | duplicated gradient-circle-with-initials markup (logo, account block) | one component, deterministic color from name hash |
| `EmptyState` | ad hoc "No X yet." gray text lines | icon + message + optional action, used everywhere a list can be empty |

This layer is the single highest-leverage phase in the whole plan — it's what makes "Finance" and "Learning Hub" feel like the same product instead of two different afternoons of work.

---

## 5. Overview page redesign (the centerpiece)

### 5.1 Hero section

Full-width gradient banner (`--color-primary` → `--color-accent`, subtle, ~10% opacity wash over `--color-surface` rather than a loud solid block) containing:

- Personalized greeting — time-aware ("Good morning/afternoon/evening, Lucky") + role-aware status line (member: "Your dues are up to date · 2 upcoming events" / staff: "3 pending approvals · 2 new inquiries need a look").
- Right-aligned quick-actions row (see 5.5) so the highest-frequency staff tasks are one click from login, not buried in nav.

### 5.2 KPI cards

Every card upgraded to: icon (top-left, in a soft tinted circle using that KPI's semantic color) → label (`text-xs uppercase tracking-wide text-fg-muted`) → large value (`text-3xl`, Plus Jakarta Sans, tabular-nums) → trend row (↑/↓ delta vs. previous period in success/danger color, or a 7-point inline sparkline for time-series-friendly metrics) → hover: 2px lift + `shadow-md` + border color shifts to `--color-border-strong`.

**Member-visible cards** (always shown):

| Card | Value source | Trend/extra |
|---|---|---|
| Club Balance | `club_balance` view (existing) | Δ vs. last month's closing balance |
| Upcoming Events | `events` count, next 30 days | none — count is the story |
| Open Elections | `elections` where `status='open'` | "Closes in Xd" if ≤3 days |
| My Learning Progress | `learning_progress` for this user | % complete ring, not a bar — visually distinct from other cards, deliberately |

**Staff-only additional cards:**

| Card | Value source | Trend/extra |
|---|---|---|
| Active Members | `profiles` where `status='active'` | Δ vs. last month (new activations) |
| Pending Approvals | `profiles` where `status='pending'` | amber accent when > 0, links to Members |
| New Inquiries | `inquiries` where `status='new'` | links to Communications → Inbox (kept, it's the one existing card that already does this right) |
| Event Attendance Rate | `event_rsvps` going ÷ invited, last 3 events | new query, no schema change |
| Dues Collection Rate | `membership_dues` paid ÷ due, current term | new query, no schema change |
| Engagement Score | composite: RSVP rate + vote turnout + learning completion, weighted, last 30 days | the one genuinely new metric — computed client-side from three existing tables, documented inline with its formula since it's a derived number, not a raw count |

Grid: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, staggered entrance (Motion, 40ms stagger, fade+rise 8px) on mount — fast enough to never feel like it's blocking the user, present enough to feel considered.

### 5.3 Income vs. Expenses chart

Upgrade from grouped bar to a **combo chart**: monthly income and expense as soft gradient-filled areas (using `--color-primary`/`--color-secondary` at low opacity, matching the token system instead of the current hardcoded hex constants) with a **net balance line** overlaid (stroke `--color-accent`, dots on hover). Animated draw-in on mount (recharts' built-in `isAnimationActive`, ~800ms). Custom tooltip redesigned to match the new `Card`/`Badge` visual language instead of recharts' default box. Legend becomes interactive (click a series to toggle visibility) rather than static text. Six-month window kept as-is — it's the right amount of data for a club-sized ledger.

### 5.4 Recent activity feed

New section — a unified, reverse-chronological timeline merging the last ~15 events across `audit_log` (staff-visible entries only), `announcements`, and RSVP/vote activity, each row with an icon by type, actor, action, relative timestamp (`date-fns`, already a dependency). This replaces nothing — it's additive — and gives leaders the "what happened while I was away" scan the brief asks for.

### 5.5 Quick actions row

Icon + label pill buttons, staff-only, role-checked per action (only shows what this user can actually do): **Create Event**, **Start Election**, **Approve Members** (badge with pending count), **Post Announcement**. Each opens the relevant existing page/modal directly rather than requiring a sidebar detour — pure navigation shortcut, no new business logic.

### 5.6 Upcoming events & open elections

Kept as two side-by-side list cards (existing pattern is sound), upgraded visually: event rows get a small date-block chip (day-of-month large, month abbreviation small — calendar-app convention) instead of plain text, category icon, and — for staff — a live RSVP count pill. Elections rows get a countdown chip when closing soon and a "your vote" indicator (voted/not-voted) for members.

---

## 6. Interaction, motion & loading detail

- **Sidebar:** 250–300ms width/icon crossfade (spec'd above).
- **Cards:** `transition: transform 150ms ease, box-shadow 150ms ease`; hover = `translateY(-2px)` + `shadow-md`. Applied via the `Card` primitive's `interactive` variant, not per-page.
- **Page/section entrance:** KPI grid and chart stagger in on first mount only (not on every re-render/refetch) — a `hasMountedRef` guard prevents the "re-animates every time data refreshes" annoyance that makes dashboards feel jumpy.
- **Loading states:** `Skeleton` blocks matching each target shape (KPI card skeleton, chart skeleton, list-row skeleton) replace the current "just don't render yet" gap — every async section has a designed loading state, not an absence of one.
- **Scrolling:** shell uses `h-screen` grid with `overflow-y-auto` scoped to `<main>` only; sidebar and header never move. Smooth scroll (`scroll-behavior: smooth`) for in-page anchors (e.g., jumping to a specific report section).
- **Focus & keyboard:** every interactive primitive (`Button`, `Input`, `Dropdown`, nav items) gets a visible `focus-visible:ring-2 ring-primary ring-offset-2` — currently inconsistent/absent on most controls. Drawer/Modal trap focus and restore it to the trigger on close (upgrading `MemberDrawer`, which today has no focus management). Sidebar collapse toggle, theme toggle, and notification bell are all reachable and operable by keyboard alone.
- **Reduced motion:** every Motion animation respects `prefers-reduced-motion` (Motion's built-in `useReducedMotion` hook) — stagger and slide effects collapse to instant/opacity-only.

---

## 7. Responsive behavior

| Breakpoint | Sidebar | Header | KPI grid | Chart |
|---|---|---|---|---|
| `< 768px` (mobile) | Drawer (overlay, closed by default) | Full width, hamburger + avatar only, search collapses to an icon that expands to a full-width overlay input | `grid-cols-2` | Full-width, height reduced, legend moves below |
| `768–1279px` (tablet) | Collapsed by default (icons only), user-togglable | Search bar reappears, condensed | `grid-cols-3` | Full-width |
| `≥ 1280px` (desktop) | Expanded by default, user-togglable | Full header, all elements | `grid-cols-4` | Full-width, side-by-side with a future secondary chart if added |

Non-goal for this pass: a bespoke phone-native experience (bottom tab bar, etc.) — the brief asks for "usable on mobile," not a mobile redesign, and the member base primarily manages this from laptops during club sessions per current usage patterns.

---

## 8. Accessibility checklist (carried into every phase, not a separate cleanup pass)

- Color contrast: every text/background pairing in both themes checked against WCAG AA (4.5:1 body, 3:1 large text) — the vibrant accent palette gets tuned against this constraint, not the other way around (e.g., `--color-primary` on `--color-bg` light is verified before it's finalized, not after).
- All icon-only controls (sidebar collapse toggle, theme toggle, notification bell, mobile hamburger) get `aria-label`.
- Sidebar nav uses a real `<nav aria-label="Main">`; active route additionally marked `aria-current="page"`.
- Charts get a visually-hidden text summary (`sr-only`) alongside the SVG for screen reader users — recharts renders no accessible text by default.
- Skeleton loaders marked `aria-busy` on their container; live-updating KPI values use `aria-live="polite"` region so screen reader users hear balance/count updates without a full page reannouncement.
- Existing accessibility work from `PLAN.md` Phase 5 (labelled inputs, `aria-pressed` toggles, dialog semantics on the drawer, skip link) is preserved and extended, not redone.

---

## 9. Phased execution plan

Each phase ships independently reviewable/deployable — the app is never left in a half-migrated visual state for long, since old and new primitives can coexist during the transition (pages not yet touched keep working, just look like "before").

### **Phase 1 — Design system foundation**
- [ ] Install new dependencies (`lucide-react`, `motion`, `@fontsource/inter`, `@fontsource/plus-jakarta-sans`, `clsx`)
- [ ] Rewrite `src/index.css`: semantic color tokens (light + dark), retire `kca-*` tokens, radius/shadow scale, `@custom-variant dark`, font-face imports, tabular-nums utility
- [ ] `ThemeContext` + `localStorage` persistence + system-preference listener, wired to a no-flash boot script
- [ ] `@/*` path alias (`tsconfig.app.json`, `vite.config.ts`)
- [ ] Build `src/components/ui/`: `Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge` (restyle existing), `Modal`, `Drawer`, `Tooltip`, `Dropdown`, `Skeleton`, `Avatar`, `EmptyState`
- [ ] Ship a `/dev/ui-kit` internal-only route rendering every primitive/variant — cheap insurance so light/dark and every state (hover/focus/disabled/loading) is checked once in isolation before it's load-bearing across 15 pages
- **Acceptance:** primitives render correctly in both themes, WCAG AA contrast verified, zero visual change yet to real pages (this phase is pure infrastructure)

### **Phase 2 — Shell: sidebar + header**
- [ ] New `Sidebar` component: collapsible, icon+tooltip collapsed state, section eyebrows, active-item glow, persisted collapse state
- [ ] New `Header` component: logo, search (client-side scoped search), theme toggle, notification bell (wired to real pending-approval/open-vote signals), avatar dropdown
- [ ] New `DashboardLayout` shell: `h-screen` grid, sticky header, fixed sidebar, scoped-scroll main
- [ ] Mobile drawer behavior (open/close, scrim, escape-to-close, close-on-navigate)
- [ ] Retire the old inline sidebar/mobile-bar markup in `DashboardLayout.tsx`
- **Acceptance:** every existing route renders inside the new shell with no broken navigation; collapse/expand and mobile drawer both smooth at 250–300ms; keyboard-only pass confirms full operability

### **Phase 3 — Overview page rebuild**
- [ ] Hero banner (time+role-aware greeting, quick actions)
- [ ] KPI cards on the new `Card` primitive: icon, trend/sparkline, hover lift, stagger-in
- [ ] Three new staff KPIs (Event Attendance Rate, Dues Collection Rate, Engagement Score) — new read-only queries against existing tables, documented formulas
- [ ] Combo chart upgrade (gradient areas + net-balance line, interactive legend, token-based colors, `sr-only` summary)
- [ ] Recent activity feed (merged `audit_log`/`announcements`/RSVP-vote timeline)
- [ ] Upgraded upcoming-events and open-elections list cards (date chips, RSVP/vote-status indicators)
- [ ] Skeleton loading states for every async section
- **Acceptance:** Overview is the flagship screen — feature-complete against §5, tested with an empty-data account (new club, nothing populated yet) and a fully-populated one

### **Phase 4 — Page-by-page consistency pass**
Apply the Phase 1 primitives across every remaining screen so the redesign isn't Overview-only:
- [ ] `MemberDrawer` → rebuilt on the `Drawer` primitive (adds focus trap, Escape-close, real `role="dialog"` semantics it's missing today)
- [ ] `ElectionCard` + `Voting` page → `Card`/`Badge`/`Button` primitives, restyled status pills
- [ ] `MemberList` (Members) → `Card`/`Badge`/`Input` (search/filter), table row hover states
- [ ] `Finance` (Ledger/Budgets/Dues tabs) → primitives + chart token colors carried through any secondary charts
- [ ] `Communications` (Announcements/Inbox) → primitives, `EmptyState` for zero-announcement/zero-inquiry states
- [ ] `Reports`, `Events`, `Learning Hub`, `Profile`, `AuditLog` → primitives pass
- [ ] `AuthLayout` + auth pages (Login/SignUp/ForgotPassword/PendingApproval) → new token/font system, logo consolidated to the single shared `Avatar`/logo asset
- [ ] `ComingSoon` → restyled `EmptyState` variant (Learning Hub's remaining placeholder pieces, if any linger)
- **Acceptance:** grep for the old raw patterns (`bg-white rounded-2xl border border-gray-200`, `bg-kca-blue`) returns zero hits outside the primitive components themselves

### **Phase 5 — Motion, micro-interactions & polish**
- [ ] Full motion pass: sidebar, drawers/modals, KPI/chart stagger, reduced-motion fallback verified
- [ ] Button/toggle/chart micro-interactions (press states, legend toggle, tooltip transitions)
- [ ] Empty-state and error-state illustrations/messaging pass (replace remaining "No X yet." plain text)
- [ ] Cross-browser + cross-OS check (Windows/Mac font rendering, Safari backdrop-blur fallback)
- **Acceptance:** nothing animates without purpose; `prefers-reduced-motion` users get an equally usable, just calmer, app

### **Phase 6 — Responsive, accessibility & QA**
- [ ] Full responsive pass at the three breakpoints in §7, real-device spot check (not just devtools resize)
- [ ] WCAG AA contrast audit across both themes (automated + manual spot-check of the accent palette specifically, since vibrant colors are the most likely to fail contrast)
- [ ] Full keyboard-only walkthrough: sign in → navigate every nav item → open a drawer/modal → toggle theme → sign out, no mouse
- [ ] Screen reader spot-check (NVDA or VoiceOver) on Overview and one data-table-heavy page (Members)
- **Acceptance:** matches the accessibility checklist in §8 with zero regressions from the pre-redesign baseline

### **Phase 7 — Documentation & handoff**
- [ ] Update `dashboard/README.md`: new dependencies, theme system, `/dev/ui-kit` reference route
- [ ] Short design-tokens reference (the tables in §2 of this doc, kept as the source of truth for future pages)
- [ ] Remove/gate the `/dev/ui-kit` route behind a dev-only check (or keep it admin-only as a living style guide — decide based on how useful it proved during Phases 2–6)

---

## 10. Non-goals (explicitly out of scope for this pass)

- No changes to the data model, RLS policies, or any Supabase migration — this is a frontend/visual redesign on top of a finished, working backend.
- No command-palette (`⌘K` full app search/actions) — the header search ships scoped to current-role-visible records; a true palette is a future enhancement once the primitive layer exists to build it fast.
- No real-time notifications table/system — the bell surfaces existing derivable signals (pending approvals, open votes); a persisted notifications feed is future scope.
- No bespoke mobile-native navigation pattern (bottom tab bar, swipe gestures) — responsive-but-desktop-first remains correct for this user base.
- No change to the public marketing site — confirmed out of scope per the dashboard README's own boundary statement.

---

## 11. Open questions to confirm before Phase 2

- **Theme default:** should new sessions default to `system`, or to `light` (matching the club's current brand presentation on the public site, which is light-only)? Recommendation: default `system`, since it costs nothing and respects the user's OS choice, but the public site's light-only branding is worth a conscious decision either way.
- **Search scope:** confirm client-side search over already-loaded/visible records is sufficient for Phase 2, versus needing a real Postgres full-text query — likely fine at current club size, worth revisiting if membership grows substantially.
- **`/dev/ui-kit` route:** keep as a permanent admin-only style-guide page after launch, or strip it once the redesign ships? Leaning keep (near-zero cost, real value for the next contributor), but flagging as a call worth making explicitly.

---

## Next step

Confirm this plan, then Phase 1 begins: dependencies, tokens, dark mode wiring, and the `src/components/ui/` primitive layer — the foundation everything else in Phases 2–7 builds on.
