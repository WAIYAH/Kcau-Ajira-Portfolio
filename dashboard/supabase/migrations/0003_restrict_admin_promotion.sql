-- Phase 1 hardening: previously any Leader could grant the Admin role to
-- anyone (including themselves) via the "profiles: self or staff update"
-- RLS policy, since it only checks is_staff() (leader OR admin), not
-- is_admin(). Only an existing Admin should be able to mint new Admins.
--
-- Same auth.uid() = null carve-out as 0002: SQL Editor / service_role /
-- migrations are trusted contexts and are left alone, so bootstrapping
-- the first admin via SQL still works.

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

  if new.role = 'admin' and old.role <> 'admin' and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an existing admin can grant the admin role';
  end if;

  return new;
end;
$$;
