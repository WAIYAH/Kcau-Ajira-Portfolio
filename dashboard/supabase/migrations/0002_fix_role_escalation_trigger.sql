-- Fixes prevent_role_escalation() from 0001_init.sql: it was blocking
-- role/status updates run from the SQL Editor (or any context with no
-- PostgREST session, where auth.uid() is null) by treating "no user
-- context" the same as "not staff". That made it impossible to promote
-- the very first admin account via SQL.
--
-- Fix: only revert role/status when a logged-in NON-STAFF user is
-- updating their OWN row (auth.uid() = old.id) through the app. SQL
-- Editor / service_role / migrations have auth.uid() = null and are
-- left alone, since those are already trusted contexts.

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
  return new;
end;
$$;
