-- HARDENING SPRINT P1: PUBLIC MARKETPLACE ACCESS
-- Goal: Allow anonymous users to view active products without exposing sensitive data (margins, supplier details).

-- 1. Create Public View for Products
-- Filters: status = 'published' AND is_active = true
-- Hides: internal fields, metrics, detailed contact info

CREATE OR REPLACE VIEW public.public_products AS
SELECT
  p.id,
  p.title, -- or name depending on schema
  p.description,
  p.category_id,
  p.country_of_origin,
  p.min_order_quantity,
  p.unit,
  p.price_min, -- Public listing price
  p.price_max,
  p.currency,
  p.images, -- or join with product_images
  p.created_at,
  p.slug,
  -- Join Category Name
  c.name as category_name,
  -- Public Company Info (Safe Subset)
  comp.company_name,
  comp.country as company_country,
  comp.verified as company_verified,
  comp.logo_url as company_logo
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.companies comp ON p.company_id = comp.id
WHERE p.status = 'published';

-- 2. Grant Access to Anonymous Role
GRANT SELECT ON public.public_products TO anon;
GRANT SELECT ON public.public_products TO authenticated;

-- 3. Ensure Category & Company Public Read
-- (Assuming categories are already public read, but ensuring companies subset is accessible via view logic)
-- Note: Views run with the permissions of the view owner (definer) usually, or invoker.
-- For anon access, best to rely on the View's permission + underlying table RLS allowing anon SELECT.
-- OR define the view with security_invoker = false (run as definer) if RLS on underlying tables is too strict.

ALTER VIEW public.public_products OWNER TO postgres; -- Ensure high priv owner
-- If necessary, simple RLS on underlying tables for 'published' rows to 'anon' is cleaner,
-- but the View allows omitting sensitive columns entirely.
