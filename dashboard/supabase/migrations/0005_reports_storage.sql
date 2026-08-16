-- Phase 4: private Storage bucket for generated reports (CSV exports).
-- Staff-only, matching the `reports_generated` table's own RLS.

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

create policy "reports bucket: staff read" on storage.objects
  for select using (bucket_id = 'reports' and public.is_staff());

create policy "reports bucket: staff insert" on storage.objects
  for insert with check (bucket_id = 'reports' and public.is_staff());

create policy "reports bucket: staff delete" on storage.objects
  for delete using (bucket_id = 'reports' and public.is_staff());
