-- Persisted notifications (ROADMAP.md §2.2). Previously the header bell
-- only computed ephemeral signals on load (pending approvals, open
-- elections) -- no history, no "mark as read", no live push. This adds a
-- real table plus triggers that populate it when something worth notifying
-- about happens (new announcement, new opportunity, an election opening),
-- and Realtime is enabled on it so the client can push updates without a
-- manual refresh.
--
-- Rows are only ever created by the security-definer trigger functions
-- below, never inserted directly by the app -- there's deliberately no
-- client-facing insert policy.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_profile_unread on public.notifications (profile_id, read_at);
create index idx_notifications_created_at on public.notifications (created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: self read" on public.notifications
  for select using (profile_id = auth.uid());

create policy "notifications: self update" on public.notifications
  for update using (profile_id = auth.uid());

-- Shared fan-out helper: inserts one row per active profile matching the
-- given audience. security definer so it can read/write across profiles
-- regardless of who's logged in when the triggering insert/update happens.
create or replace function public.notify_active_profiles(
  p_type text, p_title text, p_body text, p_link text, p_audience text default 'all'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link
  from public.profiles
  where status = 'active'
    and (
      p_audience = 'all'
      or (p_audience = 'members' and role = 'member')
      or (p_audience = 'leaders' and role in ('leader', 'admin'))
    );
end;
$$;

create or replace function public.trg_notify_new_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_active_profiles('announcement', new.title, left(new.body, 140), '/communications/announcements', new.audience::text);
  return new;
end;
$$;

create trigger trg_announcement_notify
  after insert on public.announcements
  for each row execute function public.trg_notify_new_announcement();

create or replace function public.trg_notify_new_opportunity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'open' then
    perform public.notify_active_profiles('opportunity', 'New opportunity: ' || new.title, new.organization, '/opportunities', 'all');
  end if;
  return new;
end;
$$;

create trigger trg_opportunity_notify
  after insert on public.opportunities
  for each row execute function public.trg_notify_new_opportunity();

create or replace function public.trg_notify_election_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'open' and old.status is distinct from 'open' then
    perform public.notify_active_profiles('election', 'Voting is open: ' || new.title, null, '/voting', 'all');
  end if;
  return new;
end;
$$;

create trigger trg_election_notify
  after update on public.elections
  for each row execute function public.trg_notify_election_open();

-- Lets the client subscribe to new rows via supabase.channel(...).on('postgres_changes', ...)
alter publication supabase_realtime add table public.notifications;
