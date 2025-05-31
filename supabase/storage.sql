-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('products', 'products', true);

-- Create storage policies
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Product images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'products' );

create policy "Users can upload product images."
  on storage.objects for insert
  with check ( bucket_id = 'products' );

create policy "Users can update own product images."
  on storage.objects for update
  using ( bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1] );