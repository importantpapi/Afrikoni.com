-- ============================================================================
-- RLS CATCH-22 FIX & IDENTITY HARDENING
-- Date: 2026-02-20
-- Purpose: Fix the "Catch-22" where users without a linked company cannot 
--          create one because of strict RLS policies.
-- ============================================================================

BEGIN;

-- 1. Ensure owner_email exists in companies for resilient linking
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 2. Allow any authenticated user to INSERT a company
-- This is the "Birth" event. We allow it for authenticated users.
-- To prevent abuse, we could add a check for existing companies, 
-- but in our model, most users already have one via the trigger.
-- This fix is primarily for edge cases and manual onboarding.
DROP POLICY IF EXISTS "Authenticated users can create own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own company" ON public.companies;

CREATE POLICY "Allow authenticated company creation" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (true); -- We rely on the owner_email being set to link later

-- 3. Robust Update Policy
-- Allow update if the user ID is linked in profiles OR if the owner_email matches.
-- This handles both the synced state and the "just created" state.
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;

CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Robust Select Policy
DROP POLICY IF EXISTS "Companies are viewable by participants" ON public.companies;
DROP POLICY IF EXISTS "Users can select own company" ON public.companies;

CREATE POLICY "Companies are viewable by all authenticated" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

-- 5. Auto-sync owner_email in the manual flow
-- (Note: handle_new_user should also handle this, but we keep it here for manual inserts)
-- We don't use a trigger here to keep it simple, the JS already sends it.

COMMIT;
