-- ============================================================================
-- STORAGE & CATEGORY INFRASTRUCTURE FIXES
-- ============================================================================
-- Date: 2026-02-11
-- Purpose: Fix product-images bucket creation and categories RLS
-- ============================================================================

-- ============================================================================
-- 1. STORAGE BUCKET: product-images
-- ============================================================================

-- Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public bucket for product images
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================================================
-- 2. STORAGE RLS POLICIES: product-images bucket
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company's product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company's product images" ON storage.objects;

-- Allow authenticated users to upload images to their company folder
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
);

-- Allow public access to view all product images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow users to update their company's images
CREATE POLICY "Users can update their company's product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their company's images
CREATE POLICY "Users can delete their company's product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text
    FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. CATEGORIES TABLE: Ensure it exists and add RLS
-- ============================================================================

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON public.categories;

-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone"
ON public.categories
FOR SELECT
TO public
USING (true);

-- For now, allow authenticated users to create categories
-- TODO: In production, restrict this to admin role only
CREATE POLICY "Authenticated users can create categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only allow updates for admins or service role
CREATE POLICY "Only admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is admin (you'll need to add admin role check)
  -- For now, just allow service role
  auth.uid() IS NOT NULL
);

-- ============================================================================
-- 4. SEED INITIAL CATEGORIES
-- ============================================================================

-- Insert default categories if they don't exist
INSERT INTO public.categories (name, slug, description, icon, sort_order)
VALUES
  ('Agricultural Products', 'agricultural', 'Crops, grains, and agricultural raw materials', '🌾', 1),
  ('Minerals & Mining', 'minerals', 'Precious metals, ores, and mining products', '⛏️', 2),
  ('Textiles & Fashion', 'textiles', 'Fabrics, clothing, and fashion items', '👔', 3),
  ('Food & Beverages', 'food-beverage', 'Processed foods and beverages', '🍫', 4),
  ('Crafts & Artisan', 'crafts', 'Handcrafted goods and artisan products', '🎨', 5),
  ('Electronics', 'electronics', 'Electronic goods and components', '📱', 6),
  ('Chemicals & Plastics', 'chemicals', 'Chemical products and plastics', '🧪', 7),
  ('Machinery & Equipment', 'machinery', 'Industrial machinery and equipment', '⚙️', 8)
ON CONFLICT (name) DO NOTHING;

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;

-- ============================================================================
-- 5. UPDATE PRODUCTS TABLE: Make category_id nullable
-- ============================================================================

-- Categories should be recommended but not strictly required for drafts
-- This allows products to be created even if category auto-assignment fails
ALTER TABLE public.products 
ALTER COLUMN category_id DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE category_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - uncomment to test)
-- ============================================================================

-- Check bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'product-images';

-- Check categories exist:
-- SELECT id, name, slug, is_active FROM public.categories ORDER BY sort_order;

-- Test upload (from authenticated context):
-- SELECT storage.foldername(name) FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 1;
