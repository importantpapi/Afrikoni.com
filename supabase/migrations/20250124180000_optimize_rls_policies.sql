-- Optimize RLS Policies for Performance
-- Fixes Auth RLS InitPlan issues and consolidates multiple permissive policies
-- Migration Date: 2025-01-24

-- ============================================================================
-- PART 1: Fix Auth RLS InitPlan Issues
-- Wrap auth.uid() with (select auth.uid()) to evaluate once per query instead of per row
-- ============================================================================

-- 1. Fix profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 2. Fix orders table admin_orders policy
DROP POLICY IF EXISTS "admin_orders" ON public.orders;
CREATE POLICY "admin_orders" ON public.orders
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ));

-- 3. Fix products table supplier policies
DROP POLICY IF EXISTS "supplier_read_own_products" ON public.products;
CREATE POLICY "supplier_read_own_products" ON public.products
  FOR SELECT
  TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "supplier_update_own_products" ON public.products;
CREATE POLICY "supplier_update_own_products" ON public.products
  FOR UPDATE
  TO authenticated
  USING (supplier_id = (select auth.uid()))
  WITH CHECK (supplier_id = (select auth.uid()));

-- 4. Fix reviews table policies
DROP POLICY IF EXISTS "Buyers can view their own reviews" ON public.reviews;
CREATE POLICY "Buyers can view their own reviews" ON public.reviews
  FOR SELECT
  TO public
  USING (buyer_company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Sellers can view approved reviews about them" ON public.reviews;
CREATE POLICY "Sellers can view approved reviews about them" ON public.reviews
  FOR SELECT
  TO public
  USING (seller_company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = (select auth.uid())
  ) AND status = 'approved');

DROP POLICY IF EXISTS "Buyers can create reviews for completed orders" ON public.reviews;
CREATE POLICY "Buyers can create reviews for completed orders" ON public.reviews
  FOR INSERT
  TO public
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.id = reviews.order_id
        AND o.status = 'completed'
    )
    AND seller_company_id IN (
      SELECT o.seller_company_id
      FROM orders o
      WHERE o.id = reviews.order_id
    )
  );

DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews" ON public.reviews
  FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
  ));

-- 5. Fix decision_audit_log policies
DROP POLICY IF EXISTS "Only admins can read decision_audit_log" ON public.decision_audit_log;
CREATE POLICY "Only admins can read decision_audit_log" ON public.decision_audit_log
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "Only admins can insert decision_audit_log" ON public.decision_audit_log;
CREATE POLICY "Only admins can insert decision_audit_log" ON public.decision_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
  ));

-- 6. Fix contact_submissions policy
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view all submissions" ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = (select auth.uid())
      AND users.user_role = 'admin'
  ));

-- ============================================================================
-- PART 2: Consolidate Multiple Permissive Policies
-- Reduce policy evaluation overhead by consolidating overlapping policies
-- ============================================================================

-- 1. Consolidate products SELECT policies
-- public_read_active_products is redundant with "Anyone can view active products"
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;

-- 2. Consolidate reviews SELECT policies
-- Remove redundant "Anyone can view approved reviews" and recreate as consolidated policy
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT
  TO public
  USING (status = 'approved');

-- 3. Consolidate rfqs SELECT policies
-- buyer_rfqs is redundant with "Anyone can view RFQs" which has qual: true
DROP POLICY IF EXISTS "buyer_rfqs" ON public.rfqs;

-- 4. Consolidate shipments SELECT policies
-- Remove redundant role-specific policies, keep comprehensive "Users can view relevant shipments"
DROP POLICY IF EXISTS "buyer_shipments" ON public.shipments;
DROP POLICY IF EXISTS "logistics_shipments" ON public.shipments;
DROP POLICY IF EXISTS "seller_shipments" ON public.shipments;

-- Note: contact_submissions, orders, and products still have multiple policies
-- but they serve distinct purposes and cannot be safely consolidated without
-- changing security semantics. They use optimized functions where applicable.

