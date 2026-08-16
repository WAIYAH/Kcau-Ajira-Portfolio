-- Profile enrichment: bio, skills, CV, and a public avatars bucket + private
-- CV bucket. Follows the same self-or-staff storage policy pattern as
-- receipts (0004) and reports (0005) -- path convention is `${auth.uid()}/...`
-- so `storage.foldername(name)[1]` doubles as the ownership check.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists cv_url text;

-- Avatars: public read so they render as plain <img src> everywhere in the
-- app (header, sidebar, member list) without signed-URL churn on every
-- render. Write access is still locked to the owner's own folder (or staff).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: self or staff insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

create policy "avatars: self or staff update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

create policy "avatars: self or staff delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

-- CVs: private, like receipts -- résumés carry personal info, so no public
-- link. Served via short-lived signed URLs from the client.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "cvs: self or staff read" on storage.objects
  for select using (
    bucket_id = 'cvs' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

create policy "cvs: self or staff insert" on storage.objects
  for insert with check (
    bucket_id = 'cvs' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

create policy "cvs: self or staff update" on storage.objects
  for update using (
    bucket_id = 'cvs' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

create policy "cvs: self or staff delete" on storage.objects
  for delete using (
    bucket_id = 'cvs' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );
