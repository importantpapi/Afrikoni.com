-- Allow public read access to product-images bucket
create policy "Allow Public View"
on storage.objects for select
to public
using ( bucket_id = 'product-images' );

-- Ensure authenticated users can upload to product-images
-- (Already exists based on my audit, but good to be explicit if missing)
-- create policy "Allow Authenticated Upload"
-- on storage.objects for insert
-- to authenticated
-- with check ( bucket_id = 'product-images' );
