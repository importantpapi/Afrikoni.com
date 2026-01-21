-- ============================================================================
-- KERNEL BACKEND FINAL ALIGNMENT
-- Date: 2026-01-21
-- Purpose: Ensure 100% Kernel Manifesto compliance across all RLS policies
--          Replace all role-based checks with is_admin boolean
--          Replace all nested subqueries with current_company_id() function
--          Standardize all company scoping to use Kernel patterns
-- ============================================================================

-- ============================================================================
-- PART 1: ENSURE CORE FUNCTIONS EXIST
-- ============================================================================

-- Ensure current_company_id() function exists
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public -- ✅ Add this to harden against search path attacks
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Ensure is_admin() function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public -- ✅ Add this to harden against search path attacks
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- PART 2: FIX COMPANY_TEAM TABLE - Use current_company_id()
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "company_team_select" ON public.company_team;
DROP POLICY IF EXISTS "company_team_insert" ON public.company_team;
DROP POLICY IF EXISTS "company_team_update" ON public.company_team;
DROP POLICY IF EXISTS "company_team_delete" ON public.company_team;

-- Create optimized SELECT policy using current_company_id()
CREATE POLICY "company_team_select"
ON public.company_team
FOR SELECT
USING (
  -- Team members can view their own record
  (user_id = auth.uid() OR member_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR
  -- Users can view team members of their company
  company_id = public.current_company_id()
  OR
  -- Admins can view all
  public.is_admin() = true
);

-- Create optimized INSERT policy using current_company_id()
CREATE POLICY "company_team_insert"
ON public.company_team
FOR INSERT
WITH CHECK (
  company_id = public.current_company_id()
  OR
  public.is_admin() = true
);

-- Create optimized UPDATE policy using current_company_id()
CREATE POLICY "company_team_update"
ON public.company_team
FOR UPDATE
USING (
  company_id = public.current_company_id()
  OR
  public.is_admin() = true
)
WITH CHECK (
  company_id = public.current_company_id()
  OR
  public.is_admin() = true
);

-- Create optimized DELETE policy using current_company_id()
CREATE POLICY "company_team_delete"
ON public.company_team
FOR DELETE
USING (
  company_id = public.current_company_id()
  OR
  public.is_admin() = true
);

-- ============================================================================
-- PART 3: FIX CUSTOMS_CLEARANCE TABLE - Use current_company_id()
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customs_clearance'
  ) THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "customs_clearance_select" ON public.customs_clearance;
    DROP POLICY IF EXISTS "customs_clearance_insert" ON public.customs_clearance;
    DROP POLICY IF EXISTS "customs_clearance_update" ON public.customs_clearance;

    -- Create optimized SELECT policy
    CREATE POLICY "customs_clearance_select"
    ON public.customs_clearance
    FOR SELECT
    USING (
      -- Users can see customs for orders where they are buyer or seller
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = customs_clearance.order_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    );

    -- Create optimized INSERT policy
    CREATE POLICY "customs_clearance_insert"
    ON public.customs_clearance
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = customs_clearance.order_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    );

    -- Create optimized UPDATE policy
    CREATE POLICY "customs_clearance_update"
    ON public.customs_clearance
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = customs_clearance.order_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = customs_clearance.order_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 4: FIX SHIPMENT_TRACKING_EVENTS TABLE - Use current_company_id()
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipment_tracking_events'
  ) THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "shipment_tracking_events_select" ON public.shipment_tracking_events;
    DROP POLICY IF EXISTS "shipment_tracking_events_insert" ON public.shipment_tracking_events;

    -- Create optimized SELECT policy
    -- Note: Removed logistics_partner_id check as column doesn't exist in shipments table
    CREATE POLICY "shipment_tracking_events_select"
    ON public.shipment_tracking_events
    FOR SELECT
    USING (
      -- Users can see tracking for shipments where they are involved
      EXISTS (
        SELECT 1 FROM public.shipments s
        JOIN public.orders o ON o.id = s.order_id
        WHERE s.id = shipment_tracking_events.shipment_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    );

    -- Create optimized INSERT policy
    -- Note: Removed logistics_partner_id check as column doesn't exist in shipments table
    CREATE POLICY "shipment_tracking_events_insert"
    ON public.shipment_tracking_events
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.shipments s
        JOIN public.orders o ON o.id = s.order_id
        WHERE s.id = shipment_tracking_events.shipment_id
        AND (
          o.buyer_company_id = public.current_company_id()
          OR o.seller_company_id = public.current_company_id()
        )
      )
      OR
      public.is_admin() = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 5: FIX ESCROW_PAYMENTS TABLE - Use current_company_id()
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'escrow_payments'
  ) THEN
    -- Drop existing policies (both optimized names and legacy names)
    DROP POLICY IF EXISTS "escrow_payments_select" ON public.escrow_payments;
    DROP POLICY IF EXISTS "escrow_payments_insert" ON public.escrow_payments;
    DROP POLICY IF EXISTS "escrow_payments_update" ON public.escrow_payments;
    -- Drop legacy-named policies (if they exist)
    DROP POLICY IF EXISTS "Users can view escrow for their company" ON public.escrow_payments;
    DROP POLICY IF EXISTS "Users can insert escrow for their company" ON public.escrow_payments;
    DROP POLICY IF EXISTS "Users can update escrow for their company" ON public.escrow_payments;

    -- Create optimized SELECT policy
    CREATE POLICY "escrow_payments_select"
    ON public.escrow_payments
    FOR SELECT
    USING (
      buyer_company_id = public.current_company_id()
      OR
      seller_company_id = public.current_company_id()
      OR
      public.is_admin() = true
    );

    -- Create optimized INSERT policy
    CREATE POLICY "escrow_payments_insert"
    ON public.escrow_payments
    FOR INSERT
    WITH CHECK (
      buyer_company_id = public.current_company_id()
      OR
      seller_company_id = public.current_company_id()
      OR
      public.is_admin() = true
    );

    -- Create optimized UPDATE policy
    CREATE POLICY "escrow_payments_update"
    ON public.escrow_payments
    FOR UPDATE
    USING (
      buyer_company_id = public.current_company_id()
      OR
      seller_company_id = public.current_company_id()
      OR
      public.is_admin() = true
    )
    WITH CHECK (
      buyer_company_id = public.current_company_id()
      OR
      seller_company_id = public.current_company_id()
      OR
      public.is_admin() = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 6: FIX TESTIMONIALS TABLE - Replace role checks with is_admin()
-- ============================================================================

DO $$
DECLARE
  has_published_column BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'testimonials'
  ) THEN
    -- Check if published column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'testimonials'
      AND column_name = 'published'
    ) INTO has_published_column;

    -- Drop existing policies that use role checks
    DROP POLICY IF EXISTS "testimonials_select" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_insert" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_update" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_delete" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_select_published" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_admin_all" ON public.testimonials;
    DROP POLICY IF EXISTS "testimonials_admin_write" ON public.testimonials;

    -- Create optimized SELECT policy using is_admin()
    -- If published column exists, allow public access to published testimonials
    IF has_published_column THEN
      CREATE POLICY "testimonials_select"
      ON public.testimonials
      FOR SELECT
      USING (
        published = true
        OR
        public.is_admin() = true
      );
    ELSE
      -- If no published column, only admins can view
      CREATE POLICY "testimonials_select"
      ON public.testimonials
      FOR SELECT
      USING (
        public.is_admin() = true
      );
    END IF;

    -- Create optimized INSERT policy
    CREATE POLICY "testimonials_insert"
    ON public.testimonials
    FOR INSERT
    WITH CHECK (
      public.is_admin() = true
    );

    -- Create optimized UPDATE policy
    CREATE POLICY "testimonials_update"
    ON public.testimonials
    FOR UPDATE
    USING (
      public.is_admin() = true
    )
    WITH CHECK (
      public.is_admin() = true
    );

    -- Create optimized DELETE policy
    CREATE POLICY "testimonials_delete"
    ON public.testimonials
    FOR DELETE
    USING (
      public.is_admin() = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 7: FIX PARTNER_LOGOS TABLE - Replace role checks with is_admin()
-- ============================================================================

DO $$
DECLARE
  has_published_column BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'partner_logos'
  ) THEN
    -- Check if published column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'partner_logos'
      AND column_name = 'published'
    ) INTO has_published_column;

    -- Drop existing policies that use role checks
    DROP POLICY IF EXISTS "partners_select" ON public.partner_logos;
    DROP POLICY IF EXISTS "partners_insert" ON public.partner_logos;
    DROP POLICY IF EXISTS "partners_update" ON public.partner_logos;
    DROP POLICY IF EXISTS "partners_delete" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_select" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_insert" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_update" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_delete" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_select_published" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_admin_all" ON public.partner_logos;
    DROP POLICY IF EXISTS "partner_logos_admin_write" ON public.partner_logos;

    -- Create optimized SELECT policy using is_admin()
    -- If published column exists, allow public access to published partner logos
    IF has_published_column THEN
      CREATE POLICY "partner_logos_select"
      ON public.partner_logos
      FOR SELECT
      USING (
        published = true
        OR
        public.is_admin() = true
      );
    ELSE
      -- If no published column, only admins can view
      CREATE POLICY "partner_logos_select"
      ON public.partner_logos
      FOR SELECT
      USING (
        public.is_admin() = true
      );
    END IF;

    -- Create optimized INSERT policy
    CREATE POLICY "partner_logos_insert"
    ON public.partner_logos
    FOR INSERT
    WITH CHECK (
      public.is_admin() = true
    );

    -- Create optimized UPDATE policy
    CREATE POLICY "partner_logos_update"
    ON public.partner_logos
    FOR UPDATE
    USING (
      public.is_admin() = true
    )
    WITH CHECK (
      public.is_admin() = true
    );

    -- Create optimized DELETE policy
    CREATE POLICY "partner_logos_delete"
    ON public.partner_logos
    FOR DELETE
    USING (
      public.is_admin() = true
    );
  END IF;
END
$$;

-- ============================================================================
-- PART 8: FIX PLATFORM_REVENUE TABLE - Use is_admin()
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_revenue'
  ) THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "admin_revenue" ON public.platform_revenue;
    DROP POLICY IF EXISTS "platform_revenue_select" ON public.platform_revenue;
    DROP POLICY IF EXISTS "logistics_revenue" ON public.platform_revenue;

    -- Create optimized SELECT policy using is_admin()
    CREATE POLICY "platform_revenue_select"
    ON public.platform_revenue
    FOR SELECT
    USING (
      public.is_admin() = true
    );

    -- Add comment for documentation
    COMMENT ON POLICY "platform_revenue_select" ON public.platform_revenue IS 
    'Kernel-compliant: Only admins can view platform revenue using is_admin().';
  END IF;
END
$$;

-- ============================================================================
-- PART 9: FIX CONTACT_SUBMISSIONS TABLE - Use is_admin()
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_submissions'
  ) THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Admins can view all submissions" ON public.contact_submissions;
    DROP POLICY IF EXISTS "contact_submissions_select" ON public.contact_submissions;

    -- Create optimized SELECT policy using is_admin()
    CREATE POLICY "contact_submissions_select"
    ON public.contact_submissions
    FOR SELECT
    USING (
      public.is_admin() = true
    );

    -- Create INSERT policy (anyone can submit)
    DROP POLICY IF EXISTS "contact_submissions_insert" ON public.contact_submissions;
    CREATE POLICY "contact_submissions_insert"
    ON public.contact_submissions
    FOR INSERT
    WITH CHECK (true);
  END IF;
END
$$;

-- ============================================================================
-- PART 10: COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "company_team_select" ON public.company_team IS 
'Kernel-compliant: Users can view team members for their company using current_company_id(). Admins can view all.';

COMMENT ON POLICY "customs_clearance_select" ON public.customs_clearance IS 
'Kernel-compliant: Users can view customs for orders where they are buyer/seller using current_company_id(). Admins can view all.';

COMMENT ON POLICY "shipment_tracking_events_select" ON public.shipment_tracking_events IS 
'Kernel-compliant: Users can view tracking events for shipments where they are involved using current_company_id(). Admins can view all.';

COMMENT ON POLICY "escrow_payments_select" ON public.escrow_payments IS 
'Kernel-compliant: Users can view escrow payments where they are buyer/seller using current_company_id(). Admins can view all.';

COMMENT ON POLICY "testimonials_select" ON public.testimonials IS 
'Kernel-compliant: Published testimonials are public. Admins can view all using is_admin().';

COMMENT ON POLICY "partner_logos_select" ON public.partner_logos IS 
'Kernel-compliant: Published partner logos are public. Admins can view all using is_admin().';

-- Comment moved inside DO block above

COMMENT ON POLICY "contact_submissions_select" ON public.contact_submissions IS 
'Kernel-compliant: Only admins can view contact submissions using is_admin().';

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Verify current_company_id() function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_company_id'
  ) THEN
    RAISE EXCEPTION 'current_company_id() function was not created';
  END IF;
  RAISE NOTICE '✅ current_company_id() function verified';
END
$$;

-- Verify is_admin() function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'is_admin() function was not created';
  END IF;
  RAISE NOTICE '✅ is_admin() function verified';
  RAISE NOTICE '✅ Kernel Backend Final Alignment Complete - All RLS policies now use Kernel patterns';
END
$$;
