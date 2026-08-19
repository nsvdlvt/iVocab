insert into storage.buckets (id, name, public)
values ('reading-covers', 'reading-covers', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "reading_covers_public_select_policy" on storage.objects;
create policy "reading_covers_public_select_policy"
on storage.objects
for select
using (bucket_id = 'reading-covers');

drop policy if exists "reading_covers_admin_insert_policy" on storage.objects;
create policy "reading_covers_admin_insert_policy"
on storage.objects
for insert
with check (
  bucket_id = 'reading-covers'
  and (auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com'
);

drop policy if exists "reading_covers_admin_update_policy" on storage.objects;
create policy "reading_covers_admin_update_policy"
on storage.objects
for update
using (
  bucket_id = 'reading-covers'
  and (auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com'
)
with check (
  bucket_id = 'reading-covers'
  and (auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com'
);

drop policy if exists "reading_covers_admin_delete_policy" on storage.objects;
create policy "reading_covers_admin_delete_policy"
on storage.objects
for delete
using (
  bucket_id = 'reading-covers'
  and (auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com'
);
