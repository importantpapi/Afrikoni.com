-- ============================================================================
-- PHASE 2: Security Hardening (Remove Dangerous Access)
-- Date: 2025-01-27
--
-- Goal:
--   - Remove ALL GRANT ... TO anon statements
--   - Replace permissive "qual=true" policies with company-scoped rules
--   - Fix rfqs policies that reference non-existent company_id column
--   - Secure companies, profiles, orders, rfqs, products, notifications
--   - Make safe_create_profile authenticated-only
-- ============================================================================

-- ============================================================================
-- PART 1: REVOKE DANGEROUS GRANTS TO ANON
-- ============================================================================

-- Revoke anon access to products (only authenticated should access)
REVOKE ALL ON public.products FROM anon;
GRANT ALL ON public.products TO authenticated;

-- Revoke anon access to categories (only authenticated should access)
REVOKE ALL ON public.categories FROM anon;
GRANT ALL ON public.categories TO authenticated;

-- Revoke anon access to product_images (only authenticated should access)
REVOKE ALL ON public.product_images FROM anon;
GRANT ALL ON public.product_images TO authenticated;

-- Revoke anon execute on safe_create_profile (only authenticated should use)
-- Only revoke if function exists (it may have been removed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'safe_create_profile'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.safe_create_profile(uuid, text) FROM anon;
    GRANT EXECUTE ON FUNCTION public.safe_create_profile(uuid, text) TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- PART 2: FIX COMPANIES TABLE RLS (Company-scoped access only)
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "authenticated_users_can_insert_companies" ON public.companies;
DROP POLICY IF EXISTS "authenticated_users_can_view_companies" ON public.companies;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users to create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies they are members of" ON public.companies;
DROP POLICY IF EXISTS "Company owners can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone authenticated can create companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update companies" ON public.companies;

-- Secure INSERT: Users can create companies (needed during onboarding)
CREATE POLICY "companies_insert_own"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow during onboarding, RLS on profiles will protect updates

-- Secure SELECT: Users can only view their own company
CREATE POLICY "companies_select_own"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    -- OR allow if user_id matches (for legacy compatibility)
    OR user_id = auth.uid()
  );

-- Secure UPDATE: Users can only update their own company
CREATE POLICY "companies_update_own"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR user_id = auth.uid()
  );

-- ============================================================================
-- PART 3: FIX PROFILES TABLE RLS (User can only access own profile)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (will recreate secure ones)
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Secure SELECT: Users can only view their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Secure INSERT: Users can only create their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Secure UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- PART 4: FIX PRODUCTS TABLE RLS (Company-scoped access only)
-- ============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "anyone_can_view_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_users_can_insert_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_users_can_update_products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Company owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;
DROP POLICY IF EXISTS "Users can update their company products" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

-- Secure SELECT: Users can view products from their company (sellers)
-- OR all active products (buyers browsing marketplace - this is public viewing)
-- NOTE: For public marketplace, we allow viewing active products, but only authenticated can see inactive
CREATE POLICY "products_select_active"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure INSERT: Users can only create products for their company
CREATE POLICY "products_insert_own"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure UPDATE: Users can only update products from their company
CREATE POLICY "products_update_own"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure DELETE: Users can only delete products from their company
CREATE POLICY "products_delete_own"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- PART 5: FIX CATEGORIES TABLE (Public read-only for marketplace browsing)
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "anyone_can_view_categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

-- Categories are public read-only (authenticated only for security)
CREATE POLICY "categories_select_authenticated"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Categories are managed by admin/service_role only (no INSERT/UPDATE/DELETE for regular users)

-- ============================================================================
-- PART 6: FIX PRODUCT_IMAGES TABLE (Company-scoped access)
-- ============================================================================

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "anyone_can_view_product_images" ON public.product_images;
DROP POLICY IF EXISTS "authenticated_users_can_insert_product_images" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product images" ON public.product_images;

-- Secure SELECT: Users can view images for active products OR products from their company
CREATE POLICY "product_images_select"
  ON public.product_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND (
          p.status = 'active'
          OR p.company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE id = auth.uid() 
              AND company_id IS NOT NULL
          )
        )
    )
  );

-- Secure INSERT: Users can only insert images for products from their company
CREATE POLICY "product_images_insert_own"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.company_id IN (
          SELECT company_id 
          FROM public.profiles 
          WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    )
  );

-- Secure UPDATE/DELETE: Users can only modify images for products from their company
CREATE POLICY "product_images_update_own"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.company_id IN (
          SELECT company_id 
          FROM public.profiles 
          WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.company_id IN (
          SELECT company_id 
          FROM public.profiles 
          WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    )
  );

CREATE POLICY "product_images_delete_own"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.company_id IN (
          SELECT company_id 
          FROM public.profiles 
          WHERE id = auth.uid() 
            AND company_id IS NOT NULL
        )
    )
  );

-- ============================================================================
-- PART 7: FIX RFQS TABLE RLS (Fix company_id reference, buyer-scoped access)
-- ============================================================================

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they reference non-existent company_id)
DROP POLICY IF EXISTS "rfqs_select" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_insert" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_update" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_delete" ON public.rfqs;
DROP POLICY IF EXISTS "RFQs are viewable by everyone" ON public.rfqs;
DROP POLICY IF EXISTS "anon_view_open_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "auth_users_rfqs_all" ON public.rfqs;

-- Secure SELECT: 
-- - Buyers can view their own RFQs
-- - Sellers can view open RFQs (for responding, but this will be refined in PHASE 6)
-- For now: only buyers can view their RFQs
CREATE POLICY "rfqs_select_buyer"
  ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure INSERT: Only buyers can create RFQs for their company
CREATE POLICY "rfqs_insert_buyer"
  ON public.rfqs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure UPDATE: Only buyers can update RFQs from their company
CREATE POLICY "rfqs_update_buyer"
  ON public.rfqs
  FOR UPDATE
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure DELETE: Only buyers can delete RFQs from their company
CREATE POLICY "rfqs_delete_buyer"
  ON public.rfqs
  FOR DELETE
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- PART 8: FIX ORDERS TABLE RLS (Already secure, but verify)
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;

-- Recreate secure policies using current_company_id() helper
-- SELECT: Buyers and sellers can view orders they're involved in
CREATE POLICY "orders_select_involved"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR seller_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- INSERT: Buyers can create orders for their company
CREATE POLICY "orders_insert_buyer"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- UPDATE: Buyers and sellers can update orders they're involved in
CREATE POLICY "orders_update_involved"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR seller_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR seller_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- DELETE: Only buyers can delete orders (or we can restrict this further)
CREATE POLICY "orders_delete_buyer"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- PART 9: FIX NOTIFICATIONS TABLE RLS (User and company-scoped)
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON public.notifications;

-- Secure SELECT: Users can view notifications for their user_id or company_id
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Notifications INSERT/UPDATE/DELETE are typically system-generated (service_role only)
-- But we allow users to mark as read, so UPDATE policy:
CREATE POLICY "notifications_update_read"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- PART 10: FIX MESSAGES TABLE RLS (Company-scoped, if RLS is enabled)
-- ============================================================================

-- Messages table currently has RLS disabled (RLS_ENABLED = false)
-- We'll enable it and add secure policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- Secure SELECT: Users can view messages where their company is sender or receiver
CREATE POLICY "messages_select_company"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    sender_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
    OR receiver_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure INSERT: Users can send messages from their company
CREATE POLICY "messages_insert_own"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Secure UPDATE: Users can mark messages as read (their company must be receiver)
CREATE POLICY "messages_update_read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    receiver_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    receiver_company_id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND company_id IS NOT NULL
    )
  );

-- Messages are typically not deleted (keep history), but if needed:
-- DELETE policy can be restricted to service_role only

-- ============================================================================
-- VERIFICATION QUERIES (For testing)
-- ============================================================================

-- Uncomment to verify policies:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('companies', 'profiles', 'products', 'orders', 'rfqs', 'notifications', 'messages')
-- ORDER BY tablename, policyname;

-- Verify no anon grants:
-- SELECT grantee, privilege_type, table_name
-- FROM information_schema.role_table_grants
-- WHERE grantee = 'anon'
--   AND table_schema = 'public';
