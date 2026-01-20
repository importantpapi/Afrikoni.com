-- ============================================================================
-- KERNEL BACKEND ALIGNMENT: Role-to-Capability Migration
-- Date: 2026-01-20
--
-- Goal:
--   - Replace all role-based checks with capability-based checks
--   - Standardize admin checks to use profiles.is_admin boolean
--   - Migrate seller policies to use company_capabilities.can_sell
--   - Deprecate JWT role dependency (current_app_role function)
--   - Add deprecation comment to profiles.role column
--
-- This migration aligns the backend with the Afrikoni Kernel Manifesto:
--   - Admin access: profiles.is_admin = true
--   - Seller access: company_capabilities.can_sell = true AND sell_status = 'approved'
--   - Buyer access: company_capabilities.can_buy = true (default)
--   - Logistics access: company_capabilities.can_logistics = true AND logistics_status = 'approved'
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE is_admin() HELPER FUNCTION
-- ============================================================================

-- Replace current_app_role() dependency with is_admin() function
-- This function checks profiles.is_admin instead of JWT claims
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 
'Kernel-compliant admin check. Returns true if the current authenticated user has is_admin = true in profiles table. Replaces JWT-based current_app_role() function.';

-- ============================================================================
-- PART 2: STANDARDIZE ADMIN CHECKS IN RLS POLICIES
-- ============================================================================

-- 2.1 Fix admin_orders policy (3 instances across different migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    -- Drop existing admin_orders policies (may exist in multiple migrations)
    DROP POLICY IF EXISTS "admin_orders" ON public.orders;
    
    -- Create standardized admin_orders policy using is_admin()
    CREATE POLICY "admin_orders"
    ON public.orders
    FOR SELECT
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
    );
  END IF;
END
$$;

-- 2.2 Fix admin_revenue policy on platform_revenue table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_revenue'
  ) THEN
    DROP POLICY IF EXISTS "admin_revenue" ON public.platform_revenue;
    
    CREATE POLICY "admin_revenue"
    ON public.platform_revenue
    FOR SELECT
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
    );
  END IF;
END
$$;

-- 2.3 Fix contact_submissions admin policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_submissions'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all submissions" ON public.contact_submissions;
    
    CREATE POLICY "Admins can view all submissions"
    ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING (
      (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())) = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 3: DEPRECATE JWT ROLE DEPENDENCY
-- ============================================================================

-- 3.1 Update admin_full_update_products policy to use is_admin() function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    DROP POLICY IF EXISTS "admin_full_update_products" ON public.products;
    
    CREATE POLICY "admin_full_update_products"
    ON public.products
    FOR UPDATE
    USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);
  END IF;
END
$$;

-- 3.2 Update enforce_standardized_description_lock trigger to use is_admin()
-- This trigger function currently uses current_app_role() - update to use is_admin()
CREATE OR REPLACE FUNCTION public.enforce_standardized_description_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  is_user_admin boolean := public.is_admin();
  pg_role text := current_user;
BEGIN
  -- Only apply on UPDATE
  IF tg_op <> 'UPDATE' THEN
    RETURN new;
  END IF;

  -- If not standardized, nothing to enforce here
  IF COALESCE(old.is_standardized, false) = false THEN
    RETURN new;
  END IF;

  -- If description is not changing, allow
  IF new.description IS NOT DISTINCT FROM old.description THEN
    RETURN new;
  END IF;

  -- Privileged callers:
  -- - Admin (is_admin() = true)
  -- - service_role (backend / governed AI)
  IF is_user_admin THEN
    RETURN new;
  END IF;

  IF pg_role = 'service_role' THEN
    RETURN new;
  END IF;

  -- Everyone else (including suppliers) is blocked from changing description
  RAISE EXCEPTION
    'Description is locked by Afrikoni to protect buyers and platform trust.'
    USING hint = 'Update factual fields (price, MOQ, specs, packaging) instead. Description can only be updated by Afrikoni AI or admins.';
END;
$$;

-- ============================================================================
-- PART 4: CAPABILITY-BASED SELLER POLICIES
-- ============================================================================

-- 4.1 Refactor supplier_read_own_products to use capability checks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    DROP POLICY IF EXISTS "supplier_read_own_products" ON public.products;
    
    -- New policy: Check company_id match AND can_sell capability
    CREATE POLICY "supplier_read_own_products"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (
      -- User's company_id matches product's company_id
      company_id = public.current_company_id()
      -- AND user's company has can_sell capability approved
      AND EXISTS (
        SELECT 1
        FROM public.company_capabilities cc
        JOIN public.profiles p ON p.company_id = cc.company_id
        WHERE p.id = (SELECT auth.uid())
          AND cc.company_id = products.company_id
          AND cc.can_sell = true
          AND cc.sell_status = 'approved'
      )
    );
  END IF;
END
$$;

-- 4.2 Refactor supplier_update_own_products to use capability checks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    DROP POLICY IF EXISTS "supplier_update_own_products" ON public.products;
    
    -- New policy: Check company_id match AND can_sell capability
    CREATE POLICY "supplier_update_own_products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (
      -- User's company_id matches product's company_id
      company_id = public.current_company_id()
      -- AND user's company has can_sell capability approved
      AND EXISTS (
        SELECT 1
        FROM public.company_capabilities cc
        JOIN public.profiles p ON p.company_id = cc.company_id
        WHERE p.id = (SELECT auth.uid())
          AND cc.company_id = products.company_id
          AND cc.can_sell = true
          AND cc.sell_status = 'approved'
      )
    )
    WITH CHECK (
      -- Same check for WITH CHECK clause
      company_id = public.current_company_id()
      AND EXISTS (
        SELECT 1
        FROM public.company_capabilities cc
        JOIN public.profiles p ON p.company_id = cc.company_id
        WHERE p.id = (SELECT auth.uid())
          AND cc.company_id = products.company_id
          AND cc.can_sell = true
          AND cc.sell_status = 'approved'
      )
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 5: SCHEMA CLEANUP - DEPRECATE profiles.role COLUMN
-- ============================================================================

-- Add deprecation comment to profiles.role column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    COMMENT ON COLUMN public.profiles.role IS 
    'DEPRECATED: Use is_admin boolean and company_capabilities table instead. This column will be removed in a future migration after frontend fully migrates to capability-based access.';
  END IF;
END
$$;

-- ============================================================================
-- PART 6: VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  -- Verify is_admin() function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'is_admin() function was not created';
  END IF;

  -- Success message
  RAISE NOTICE '✅ Kernel Backend Alignment Migration Complete!';
  RAISE NOTICE '✅ is_admin() function created';
  RAISE NOTICE '✅ Admin policies standardized (orders, platform_revenue, contact_submissions)';
  RAISE NOTICE '✅ JWT role dependency deprecated';
  RAISE NOTICE '✅ Seller policies migrated to capability-based checks';
  RAISE NOTICE '✅ profiles.role column marked as deprecated';
END
$$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- ============================================================================

-- Uncomment to verify after migration:
--
-- 1. Test is_admin() function
-- SELECT public.is_admin();
--
-- 2. Verify admin policies use is_admin
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   qual
-- FROM pg_policies
-- WHERE policyname LIKE '%admin%'
--   AND (qual::text LIKE '%is_admin%' OR qual::text LIKE '%is_admin()%')
-- ORDER BY tablename, policyname;
--
-- 3. Verify supplier policies use capability checks
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   qual
-- FROM pg_policies
-- WHERE policyname LIKE '%supplier%'
--   AND qual::text LIKE '%company_capabilities%'
-- ORDER BY tablename, policyname;
--
-- 4. Check profiles.role deprecation comment
-- SELECT 
--   col_description('public.profiles'::regclass, 
--     (SELECT ordinal_position FROM information_schema.columns 
--      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role')
--   ) AS role_column_comment;
