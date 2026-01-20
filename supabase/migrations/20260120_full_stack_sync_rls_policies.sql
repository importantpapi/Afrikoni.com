-- ============================================================================
-- FULL-STACK SYNCHRONIZATION: RLS Policy Updates
-- ============================================================================
-- Date: 2026-01-20
-- Purpose: Update RLS policies for profiles, company_capabilities, notifications, orders
--          to use is_admin boolean check and capability-based logic
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Ensure all policies use is_admin boolean
-- ============================================================================

-- Drop existing policies if they use role strings
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;

-- Create/Update SELECT policy with is_admin check
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Create/Update UPDATE policy with is_admin check
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  id = auth.uid()
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- ============================================================================
-- 2. COMPANY_CAPABILITIES TABLE - Ensure capability-based logic
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "company_capabilities_select_own_or_admin" ON public.company_capabilities;
DROP POLICY IF EXISTS "company_capabilities_update_admin_or_own" ON public.company_capabilities;

-- Create SELECT policy with is_admin check and capability-based logic
CREATE POLICY "company_capabilities_select_own_or_admin"
ON public.company_capabilities
FOR SELECT
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Create UPDATE policy with is_admin check
CREATE POLICY "company_capabilities_update_admin_or_own"
ON public.company_capabilities
FOR UPDATE
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- ============================================================================
-- 3. NOTIFICATIONS TABLE - Update with is_admin and hybrid capability check
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "notifications_select_optimized" ON public.notifications;

-- Create SELECT policy with is_admin check and hybrid capability check
CREATE POLICY "notifications_select_optimized"
ON public.notifications
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Hybrid users (can_buy AND can_sell) can see all notifications
  EXISTS (
    SELECT 1
    FROM public.company_capabilities cc
    JOIN public.profiles p ON p.company_id = cc.company_id
    WHERE p.id = auth.uid()
      AND cc.can_buy = true
      AND cc.can_sell = true
  )
);

-- ============================================================================
-- 4. ORDERS TABLE - Update with is_admin and capability-based logic
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "orders_select_optimized" ON public.orders;

-- Create SELECT policy with is_admin check and capability-based logic
CREATE POLICY "orders_select_optimized"
ON public.orders
FOR SELECT
USING (
  -- Buyer can see orders where they are the buyer
  buyer_company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR
  -- Seller can see orders where they are the seller (if they have can_sell capability)
  (
    seller_company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND
    EXISTS (
      SELECT 1
      FROM public.company_capabilities cc
      JOIN public.profiles p ON p.company_id = cc.company_id
      WHERE p.id = auth.uid()
        AND cc.company_id = orders.seller_company_id
        AND cc.can_sell = true
    )
  )
  OR
  -- Admin can see all orders
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Buyer capability check
  EXISTS (
    SELECT 1
    FROM public.company_capabilities cc
    JOIN public.profiles p ON p.company_id = cc.company_id
    WHERE p.id = auth.uid()
      AND cc.company_id = orders.buyer_company_id
      AND cc.can_buy = true
  )
);

-- ============================================================================
-- COMMENTS - Document the changes
-- ============================================================================

COMMENT ON POLICY "profiles_select_own_or_admin" ON public.profiles IS 
'Users can view their own profile or admins can view any profile. Uses is_admin boolean check.';

COMMENT ON POLICY "company_capabilities_select_own_or_admin" ON public.company_capabilities IS 
'Users can view capabilities for their own company or admins can view any. Uses is_admin boolean check.';

COMMENT ON POLICY "notifications_select_optimized" ON public.notifications IS 
'Users can view their own notifications, company notifications, or admins/hybrid users can view all. Uses is_admin boolean and capability-based hybrid check.';

COMMENT ON POLICY "orders_select_optimized" ON public.orders IS 
'Users can view orders where they are buyer/seller (with capability checks) or admins can view all. Uses is_admin boolean and capability-based logic.';
