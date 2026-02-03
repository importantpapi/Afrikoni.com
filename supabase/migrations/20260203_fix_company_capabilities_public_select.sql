-- ============================================================================
-- FIX: Allow public visibility of company capabilities for marketplace
-- Date: 2026-02-03
-- ============================================================================
--
-- PROBLEM:
-- The current RLS policy on company_capabilities only allows users to see
-- their own company's capabilities. This breaks the suppliers marketplace
-- which needs to query all companies with can_sell=true.
--
-- SOLUTION:
-- Add a permissive SELECT policy that allows authenticated users to view
-- all company capabilities. This is safe because:
-- 1. company_capabilities only contains boolean flags (can_buy, can_sell, can_logistics)
-- 2. These flags are not sensitive - they're needed for marketplace visibility
-- 3. INSERT/UPDATE policies remain restricted to own company
-- ============================================================================

-- Drop the restrictive select-own policy
DROP POLICY IF EXISTS "company_capabilities_select_own" ON public.company_capabilities;
DROP POLICY IF EXISTS "company_capabilities_select_own_or_admin" ON public.company_capabilities;

-- Create permissive SELECT policy for marketplace visibility
-- All authenticated users can view all company capabilities
CREATE POLICY "company_capabilities_public_select"
  ON public.company_capabilities
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep INSERT/UPDATE restricted to own company (unchanged)
-- These policies should already exist, but recreate for safety

DROP POLICY IF EXISTS "company_capabilities_insert_own" ON public.company_capabilities;
CREATE POLICY "company_capabilities_insert_own"
  ON public.company_capabilities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

DROP POLICY IF EXISTS "company_capabilities_update_own" ON public.company_capabilities;
DROP POLICY IF EXISTS "company_capabilities_update_admin_or_own" ON public.company_capabilities;
CREATE POLICY "company_capabilities_update_own"
  ON public.company_capabilities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
    OR
    -- Admins can update any company's capabilities
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- ============================================================================
-- VERIFICATION: After running this migration, the suppliers.jsx query:
--   SELECT company_id FROM company_capabilities WHERE can_sell = true
-- Should return ALL companies with can_sell=true, not just the current user's.
-- ============================================================================
