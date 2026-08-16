-- KCA Ajira Club dashboard: initial schema + Row Level Security
-- Run this against a fresh Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists "pgcrypto";

-- ========================================================================
-- ENUMS
-- ========================================================================
create type member_role as enum ('member', 'leader', 'admin');
create type member_status as enum ('pending', 'active', 'suspended', 'alumni');
create type transaction_type as enum ('income', 'expense');
create type rsvp_status as enum ('going', 'maybe', 'declined');
create type election_status as enum ('draft', 'open', 'closed');
create type resource_status as enum ('not_started', 'in_progress', 'done');
create type resource_type as enum ('article', 'video', 'course', 'link');
create type report_type as enum ('finance', 'membership', 'attendance', 'election');
create type announcement_audience as enum ('all', 'members', 'leaders');

-- ========================================================================
-- HELPER: updated_at trigger
-- ========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ========================================================================
-- PROFILES
-- ========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  university_id text,
  course text,
  year_of_study text,
  role member_role not null default 'member',
  status member_status not null default 'pending',
  avatar_url text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role-check helpers. security definer so they can read profiles.role
-- without RLS on `profiles` recursing back into itself.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('leader', 'admin') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Prevent members from promoting themselves / un-suspending themselves via
-- the app's own "update own profile" RLS policy. Only kicks in when a
-- non-staff user is editing their OWN row through an authenticated
-- session (auth.uid() = old.id). Updates run with no PostgREST session --
-- SQL Editor, service_role, migrations -- have auth.uid() = null and are
-- left alone, since those are already trusted/privileged contexts.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id and not public.is_staff() then
    new.role := old.role;
    new.status := old.status;
  end if;

  -- Only an existing admin can grant the admin role (a Leader can still
  -- approve/suspend members and promote them to Leader).
  if new.role = 'admin' and old.role <> 'admin' and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an existing admin can grant the admin role';
  end if;

  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

alter table public.profiles enable row level security;

create policy "profiles: self or staff read" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles: self or staff update" on public.profiles
  for update using (id = auth.uid() or public.is_staff());

create policy "profiles: staff insert" on public.profiles
  for insert with check (public.is_staff());

create policy "profiles: admin delete" on public.profiles
  for delete using (public.is_admin());

-- ========================================================================
-- MEMBERSHIP DUES
-- ========================================================================
create table public.membership_dues (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  term text not null,
  amount_due numeric(10, 2) not null default 0,
  amount_paid numeric(10, 2) not null default 0,
  status text not null default 'unpaid',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_membership_dues_profile on public.membership_dues (profile_id);

create trigger trg_dues_updated_at
  before update on public.membership_dues
  for each row execute function public.set_updated_at();

alter table public.membership_dues enable row level security;

create policy "dues: self or staff read" on public.membership_dues
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "dues: staff insert" on public.membership_dues
  for insert with check (public.is_staff());

create policy "dues: staff update" on public.membership_dues
  for update using (public.is_staff());

create policy "dues: staff delete" on public.membership_dues
  for delete using (public.is_staff());

-- ========================================================================
-- FINANCE: TRANSACTIONS + BUDGETS
-- ========================================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type transaction_type not null,
  category text not null,
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  recorded_by uuid references public.profiles(id),
  receipt_url text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_transactions_occurred_at on public.transactions (occurred_at desc);

alter table public.transactions enable row level security;

-- Raw transaction rows are staff-only. Everyone else sees only the
-- aggregate balance via the `club_balance` view below.
create policy "transactions: staff read" on public.transactions
  for select using (public.is_staff());

create policy "transactions: staff insert" on public.transactions
  for insert with check (public.is_staff());

create policy "transactions: staff update" on public.transactions
  for update using (public.is_staff());

create policy "transactions: admin delete" on public.transactions
  for delete using (public.is_admin());

-- Aggregate-only balance, safe to expose to every logged-in member.
-- Views run with the definer's privileges by default, so this
-- deliberately bypasses the staff-only RLS on `transactions` above --
-- it only ever returns a single summed number, never raw rows.
create view public.club_balance as
  select coalesce(sum(case when type = 'income' then amount else -amount end), 0) as balance
  from public.transactions;

grant select on public.club_balance to authenticated;

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  category text not null,
  planned_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

create policy "budgets: staff read" on public.budgets
  for select using (public.is_staff());

create policy "budgets: staff insert" on public.budgets
  for insert with check (public.is_staff());

create policy "budgets: staff update" on public.budgets
  for update using (public.is_staff());

create policy "budgets: staff delete" on public.budgets
  for delete using (public.is_staff());

-- ========================================================================
-- EVENTS + RSVPS
-- ========================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cover_image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_events_starts_at on public.events (starts_at);

alter table public.events enable row level security;

create policy "events: authenticated read" on public.events
  for select using (auth.role() = 'authenticated');

create policy "events: staff insert" on public.events
  for insert with check (public.is_staff());

create policy "events: staff update" on public.events
  for update using (public.is_staff());

create policy "events: staff delete" on public.events
  for delete using (public.is_staff());

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index idx_event_rsvps_event on public.event_rsvps (event_id);

alter table public.event_rsvps enable row level security;

create policy "rsvps: self or staff read" on public.event_rsvps
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "rsvps: self insert" on public.event_rsvps
  for insert with check (profile_id = auth.uid());

create policy "rsvps: self or staff update" on public.event_rsvps
  for update using (profile_id = auth.uid() or public.is_staff());

create policy "rsvps: self or staff delete" on public.event_rsvps
  for delete using (profile_id = auth.uid() or public.is_staff());

-- ========================================================================
-- ELECTIONS / VOTING
-- ========================================================================
create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status election_status not null default 'draft',
  is_anonymous boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.elections enable row level security;

create policy "elections: authenticated read" on public.elections
  for select using (auth.role() = 'authenticated');

create policy "elections: staff insert" on public.elections
  for insert with check (public.is_staff());

create policy "elections: staff update" on public.elections
  for update using (public.is_staff());

create policy "elections: staff delete" on public.elections
  for delete using (public.is_staff());

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  display_name text not null,
  position_title text not null,
  statement text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index idx_candidates_election on public.candidates (election_id);

alter table public.candidates enable row level security;

create policy "candidates: authenticated read" on public.candidates
  for select using (auth.role() = 'authenticated');

create policy "candidates: staff insert" on public.candidates
  for insert with check (public.is_staff());

create policy "candidates: staff update" on public.candidates
  for update using (public.is_staff());

create policy "candidates: staff delete" on public.candidates
  for delete using (public.is_staff());

-- Ballots. Nobody -- not even staff -- can SELECT raw rows directly;
-- results are only readable through `get_election_results()` below,
-- which enforces "open results are staff-only, closed results are public".
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  position_title text not null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (election_id, position_title, voter_id)
);

create index idx_votes_election_position on public.votes (election_id, position_title);

alter table public.votes enable row level security;

create policy "votes: member casts own ballot once" on public.votes
  for insert
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.elections e
      where e.id = election_id
        and e.status = 'open'
        and now() between e.opens_at and e.closes_at
    )
  );

create or replace function public.get_election_results(p_election_id uuid)
returns table (position_title text, candidate_id uuid, vote_count bigint)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_status election_status;
begin
  select status into v_status from public.elections where id = p_election_id;

  if v_status is null then
    raise exception 'Election not found';
  end if;

  if v_status = 'closed' or public.is_staff() then
    return query
      select v.position_title, v.candidate_id, count(*)::bigint as vote_count
      from public.votes v
      where v.election_id = p_election_id
      group by v.position_title, v.candidate_id;
  else
    raise exception 'Results are not available until the election closes';
  end if;
end;
$$;

-- ========================================================================
-- ANNOUNCEMENTS + EMAIL LOG
-- ========================================================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience announcement_audience not null default 'all',
  sent_by uuid references public.profiles(id),
  sent_via text not null default 'in-app',
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements: read by audience" on public.announcements
  for select using (
    audience = 'all'
    or (audience = 'members' and auth.role() = 'authenticated')
    or (audience = 'leaders' and public.is_staff())
  );

create policy "announcements: staff insert" on public.announcements
  for insert with check (public.is_staff());

create policy "announcements: staff update" on public.announcements
  for update using (public.is_staff());

create policy "announcements: staff delete" on public.announcements
  for delete using (public.is_staff());

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  template text,
  audience announcement_audience not null default 'all',
  sent_by uuid references public.profiles(id),
  recipient_count int not null default 0,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

alter table public.email_log enable row level security;

create policy "email_log: staff read" on public.email_log
  for select using (public.is_staff());

create policy "email_log: staff insert" on public.email_log
  for insert with check (public.is_staff());

create policy "email_log: staff update" on public.email_log
  for update using (public.is_staff());

-- ========================================================================
-- LEARNING HUB
-- ========================================================================
create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type resource_type not null default 'article',
  category text not null,
  skill_tag text,
  url_or_content text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.learning_resources enable row level security;

create policy "resources: authenticated read" on public.learning_resources
  for select using (auth.role() = 'authenticated');

create policy "resources: staff insert" on public.learning_resources
  for insert with check (public.is_staff());

create policy "resources: staff update" on public.learning_resources
  for update using (public.is_staff());

create policy "resources: staff delete" on public.learning_resources
  for delete using (public.is_staff());

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.learning_resources(id) on delete cascade,
  status resource_status not null default 'not_started',
  updated_at timestamptz not null default now(),
  unique (profile_id, resource_id)
);

create index idx_learning_progress_profile on public.learning_progress (profile_id);

create trigger trg_progress_updated_at
  before update on public.learning_progress
  for each row execute function public.set_updated_at();

alter table public.learning_progress enable row level security;

create policy "progress: self or staff read" on public.learning_progress
  for select using (profile_id = auth.uid() or public.is_staff());

create policy "progress: self insert" on public.learning_progress
  for insert with check (profile_id = auth.uid());

create policy "progress: self update" on public.learning_progress
  for update using (profile_id = auth.uid());

create policy "progress: self delete" on public.learning_progress
  for delete using (profile_id = auth.uid());

-- ========================================================================
-- REPORTS + AUDIT LOG
-- ========================================================================
create table public.reports_generated (
  id uuid primary key default gen_random_uuid(),
  type report_type not null,
  generated_by uuid references public.profiles(id),
  period_start date,
  period_end date,
  file_url text,
  created_at timestamptz not null default now()
);

alter table public.reports_generated enable row level security;

create policy "reports: staff read" on public.reports_generated
  for select using (public.is_staff());

create policy "reports: staff insert" on public.reports_generated
  for insert with check (public.is_staff());

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log: admin read" on public.audit_log
  for select using (public.is_admin());

create policy "audit_log: staff insert" on public.audit_log
  for insert with check (public.is_staff());
