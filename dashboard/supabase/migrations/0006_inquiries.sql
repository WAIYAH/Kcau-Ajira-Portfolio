-- Public website automation: the marketing site's Contact form and Join
-- "quick interest" form previously only showed a fake success toast --
-- nothing was ever saved or reached a leader. This table gives both a
-- real destination.
--
-- Anonymous (anon key) INSERT is allowed on purpose -- these forms are
-- filled out by prospective members who aren't logged in. Only staff can
-- read or triage them; the general public write-only policy mirrors a
-- typical public contact-form pattern (no read-back of others' inquiries).

create type inquiry_type as enum ('contact', 'join_interest');
create type inquiry_status as enum ('new', 'in_progress', 'resolved');

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type inquiry_type not null,
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text,
  newsletter_opt_in boolean not null default false,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create index idx_inquiries_created_at on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

create policy "inquiries: anyone can submit" on public.inquiries
  for insert with check (true);

create policy "inquiries: staff read" on public.inquiries
  for select using (public.is_staff());

create policy "inquiries: staff update" on public.inquiries
  for update using (public.is_staff());

create policy "inquiries: staff delete" on public.inquiries
  for delete using (public.is_staff());
