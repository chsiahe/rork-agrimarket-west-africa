-- Enable storage
create extension if not exists "uuid-ossp";

-- Create buckets
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict do nothing;

insert into storage.buckets (id, name)
values ('products', 'products')
on conflict do nothing;

-- Set up storage policies
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars."
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own avatar."
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Product images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'products' );

create policy "Authenticated users can upload product images."
  on storage.objects for insert
  with check (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own product images."
  on storage.objects for update
  using (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
  );