-- Phase 2: private Storage bucket for transaction receipts.
-- Only Leaders/Admins can upload, view, or delete receipts, matching the
-- staff-only RLS already on the `transactions` table itself.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts: staff read" on storage.objects
  for select using (bucket_id = 'receipts' and public.is_staff());

create policy "receipts: staff insert" on storage.objects
  for insert with check (bucket_id = 'receipts' and public.is_staff());

create policy "receipts: staff delete" on storage.objects
  for delete using (bucket_id = 'receipts' and public.is_staff());
