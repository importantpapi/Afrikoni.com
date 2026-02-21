-- ============================================================================
-- MARKETPLACE PUBLIC VISIBILITY - Afrikoni 2026
-- Date: 2026-02-21
-- Purpose: Ensure everyone (connected or guest) can see the marketplace content.
--          Relaxes RLS for companies and products to allow anonymous read access.
-- ============================================================================

BEGIN;

-- 1. COMPANIES: Allow anonymous users to view company profiles
-- This is necessary because the marketplace joins products with companies.
DROP POLICY IF EXISTS "companies_select_public_anon" ON public.companies;
CREATE POLICY "companies_select_public_anon" ON public.companies
  FOR SELECT TO anon
  USING (true);

-- 2. PRODUCTS: Explicitly allow anonymous users to view active products
-- The existing "products_select_unified" might handle this if it doesn't specify "TO authenticated",
-- but we add an explicit anon policy to be certain.
DROP POLICY IF EXISTS "products_select_public_anon" ON public.products;
CREATE POLICY "products_select_public_anon" ON public.products
  FOR SELECT TO anon
  USING (status = 'active' OR status = 'published');

-- 3. CATEGORIES: Ensure public read access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT TO public
  USING (true);

-- 4. PRODUCT IMAGES: Ensure public read access
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_images_select_public" ON public.product_images;
CREATE POLICY "product_images_select_public" ON public.product_images
  FOR SELECT TO public
  USING (true);

-- 5. PRODUCT VARIANTS: Ensure public read access (used in detail pages)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR SELECT TO public
  USING (true);

-- 6. GRANTS: Ensure anonymous role has select permissions
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_variants TO anon;

COMMIT;
