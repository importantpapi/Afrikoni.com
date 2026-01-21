-- ============================================================================
-- OPTIMIZE SUBSCRIPTIONS RLS POLICY
-- Date: 2026-01-21
-- Purpose: Replace nested subquery with current_company_id() for consistency
--          and performance improvement
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

-- Drop existing policies (both current and any legacy versions)
DROP POLICY IF EXISTS "Users can view their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their company subscription" ON public.subscriptions;
-- Also drop any optimized-named versions if they exist
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;

-- Create optimized SELECT policy using current_company_id()
CREATE POLICY "Users can view their company subscription"
ON public.subscriptions
FOR SELECT
USING (company_id = public.current_company_id());

-- Create optimized INSERT policy using current_company_id()
CREATE POLICY "Users can insert their company subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (company_id = public.current_company_id());

-- Create optimized UPDATE policy using current_company_id()
CREATE POLICY "Users can update their company subscription"
ON public.subscriptions
FOR UPDATE
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());

-- Add comment for documentation
COMMENT ON POLICY "Users can view their company subscription" ON public.subscriptions IS 
'Users can view subscriptions for their own company. Uses optimized current_company_id() function for Kernel alignment.';

COMMENT ON POLICY "Users can insert their company subscription" ON public.subscriptions IS 
'Users can insert subscriptions for their own company. Uses optimized current_company_id() function for Kernel alignment.';

COMMENT ON POLICY "Users can update their company subscription" ON public.subscriptions IS 
'Users can update subscriptions for their own company. Uses optimized current_company_id() function for Kernel alignment.';
