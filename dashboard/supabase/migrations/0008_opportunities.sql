-- Opportunities / Gigs board (ROADMAP.md §2.1). This is an Ajira club --
-- connecting members to real digital work is the actual point, and this
-- was previously just static marketing copy (Resources/job-board.html)
-- with no real listings and no dashboard equivalent.
--
-- skill_tags is matched client-side against profiles.skills (added in
-- 0007) to power a "Recommended for you" section -- no extra data entry
-- required from members, that field already exists.

create type opportunity_type as enum ('job', 'internship', 'gig', 'freelance', 'scholarship');
create type opportunity_status as enum ('open', 'closed');

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  type opportunity_type not null,
  location text,
  is_remote boolean not null default false,
  skill_tags text[] not null default '{}',
  description text not null,
  apply_url text,
  apply_email text,
  status opportunity_status not null default 'open',
  expires_at timestamptz,
  posted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_opportunities_created_at on public.opportunities (created_at desc);
create index idx_opportunities_status on public.opportunities (status);

create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

alter table public.opportunities enable row level security;

-- Every signed-in member can browse -- staff-only would defeat the point.
create policy "opportunities: members read" on public.opportunities
  for select using (auth.uid() is not null);

create policy "opportunities: staff insert" on public.opportunities
  for insert with check (public.is_staff());

create policy "opportunities: staff update" on public.opportunities
  for update using (public.is_staff());

create policy "opportunities: staff delete" on public.opportunities
  for delete using (public.is_staff());
