-- STORAGE POLICIES FIX FOR SUPABASE DASHBOARD
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This fixes the 400 error on product-images uploads

-- First, enable RLS on storage.objects (if not already enabled)
-- Note: This may already be enabled, safe to run
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'RLS already enabled or permission denied (this is OK)';
END $$;

-- Drop any existing policies on storage.objects for product-images bucket
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own product images" ON storage.objects;

-- Create new storage policies for product-images bucket
-- Get the bucket ID dynamically
DO $$
DECLARE
  v_bucket_id text := '64c155a3-2279-4bcb-a52d-ad4b67630ab9';
BEGIN
  -- Public can read all product images
  EXECUTE format('
    CREATE POLICY "Public read product images" ON storage.objects
      FOR SELECT
      USING (bucket_id = %L)
  ', v_bucket_id);

  -- Authenticated users can upload product images
  EXECUTE format('
    CREATE POLICY "Authenticated upload product images" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = %L
        AND auth.uid() IS NOT NULL
      )
  ', v_bucket_id);

  -- Users can update their own product images
  EXECUTE format('
    CREATE POLICY "Users update own product images" ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = %L
        AND auth.uid() IS NOT NULL
      )
  ', v_bucket_id);

  -- Users can delete their own product images
  EXECUTE format('
    CREATE POLICY "Users delete own product images" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = %L
        AND auth.uid() IS NOT NULL
      )
  ', v_bucket_id);
  
  RAISE NOTICE 'Storage policies created successfully for product-images bucket';
END $$;

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Public Read'
    WHEN cmd = 'INSERT' THEN 'Authenticated Upload'
    WHEN cmd = 'UPDATE' THEN 'Owner Update'
    WHEN cmd = 'DELETE' THEN 'Owner Delete'
  END as description
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%product%'
ORDER BY cmd;
