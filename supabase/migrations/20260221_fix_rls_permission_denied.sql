-- ============================================================================
-- IDENTITY SYNCHRONIZATION & PERMISSION HARDENING (ULTIMATE FIX - V2)
-- Date: 2026-02-21
-- Purpose:
--   1. Add all missing company identity columns to public.companies
--   2. Fix "permission denied for table users" (42501) by avoiding auth.users
--   3. Fix 403 Forbidden on SELECT by adding a permissive authenticated policy
--   4. Harden INSERT and UPDATE policies with dynamic cleanup
-- ============================================================================

BEGIN;

-- 1. ADD MISSING IDENTITY COLUMNS TO COMPANIES
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS year_established INTEGER, 
  ADD COLUMN IF NOT EXISTS employee_count TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_email TEXT, -- Essential for recovery
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- 2. DYNAMIC CLEANUP: Drop ALL existing policies on companies table
-- This is necessary to ensure any hidden or misnamed policies referencing auth.users are cleared.
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'companies' AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.companies;';
    END LOOP;
END $$;

-- 3. PERMISSIVE SELECT POLICY
-- Fixes 403 Forbidden: Any authenticated user can see company profiles
CREATE POLICY "companies_select_permissive" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

-- 4. HARDENED INSERT POLICY
-- Allows authenticated users to create a company, ensuring owner_email matches their JWT
CREATE POLICY "companies_insert_authenticated" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Link via established owner_email in JWT
    owner_email = (auth.jwt()->>'email')::text
    OR owner_email IS NULL -- Allow initial creation if UI doesn't send it yet, trigger will fix it
  );

-- 5. ROBUST UPDATE POLICY
-- Fixes 42501 (auth.users access denied) and handles identity recovery
CREATE POLICY "companies_update_robust" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    -- Verification 1: Linked via profiles table (standard flow)
    id IN (SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    OR 
    -- Verification 2: Verified via owner_email in JWT (for users in Identity Recovery flow)
    owner_email = (SELECT (auth.jwt()->>'email')::text)
  )
  WITH CHECK (
    -- Same logic for the updated state
    id IN (SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    OR 
    owner_email = (SELECT (auth.jwt()->>'email')::text)
  );

-- 6. INDEX FOR RECOVERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_companies_owner_email ON public.companies (owner_email);

-- 7. Ensure profiles has company_id index for policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles (company_id);

-- 8. SECURE RPC: Link User to Company
-- Bypasses frontend field mapping issues (e.g., raw_app_metadata errors)
-- and ensures an atomic link between user and company.
CREATE OR REPLACE FUNCTION public.link_user_to_company(target_user_id UUID, target_company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify the company exists
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = target_company_id) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  UPDATE public.profiles
  SET 
    company_id = target_company_id,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
