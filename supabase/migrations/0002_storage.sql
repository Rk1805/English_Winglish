-- Storage bucket for PDFs (public read; only admins can write).
-- Run this in the Supabase SQL Editor after 0001_initial_schema.sql.

insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do nothing;

create policy "admin upload pdfs" on storage.objects
  for insert with check (bucket_id = 'pdfs' and public.is_admin());

create policy "admin update pdfs" on storage.objects
  for update using (bucket_id = 'pdfs' and public.is_admin());

create policy "admin delete pdfs" on storage.objects
  for delete using (bucket_id = 'pdfs' and public.is_admin());
