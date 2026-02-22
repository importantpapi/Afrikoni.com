-- ============================================================================
-- 🔐 IDENTITY RECOVERY & RLS HARDENING (FINAL CONSOLIDATION)
-- Date: 2026-02-23
-- Fixes: Trigger deadlock, RLS permission denied, and Identity Fragmentation.
-- ============================================================================

BEGIN;

-- 1. Relax the Identity Enforcement Trigger
-- Allow company_id to be NULL during initial provisioning (before onboarding is completed)
CREATE OR REPLACE FUNCTION public.enforce_profile_company_link()
RETURNS TRIGGER AS $$
BEGIN
    -- In the Afrikoni Institutional Rail, we allow NULL company_id ONLY during onboarding.
    -- Once onboarding_completed is true, a link is MANDATORY.
    IF NEW.company_id IS NULL AND NEW.onboarding_completed = true THEN
        RAISE EXCEPTION 'Identity Fragmentation Detected: Verified Profile must be linked to a Company.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Consolidate and Harden the Linking RPC
-- This replaces link_user_to_company with a more robust version that handles security internally.
CREATE OR REPLACE FUNCTION public.ensure_company_link(target_company_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Verify the company exists
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = target_company_id) THEN
        RAISE EXCEPTION 'Target Company not found in registry';
    END IF;

    -- Step 1: Link the Profile
    UPDATE public.profiles
    SET 
        company_id = target_company_id,
        updated_at = now()
    WHERE id = v_user_id;

    -- Step 2: Ensure Company has owner_email for Identity Recovery
    -- Using SECURITY DEFINER allows this to bypass standard RLS if the user is the owner
    UPDATE public.companies
    SET 
        owner_email = (auth.jwt()->>'email')::text,
        updated_at = now()
    WHERE id = target_company_id AND (owner_email IS NULL OR owner_email = (auth.jwt()->>'email')::text);

    -- Log the event
    INSERT INTO public.activity_logs (user_id, action, metadata)
    VALUES (v_user_id, 'identity_linked', jsonb_build_object('company_id', target_company_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Cleanup Legacy RPC Definitions
DROP FUNCTION IF EXISTS public.link_user_to_company(UUID, UUID);

-- 4. Harden Companies Update Policy (Final Review)
-- Ensure selecting/updating doesn't hit 42501 (permission denied for table users)
DROP POLICY IF EXISTS "companies_update_robust" ON public.companies;
CREATE POLICY "companies_update_robust" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    owner_email = (auth.jwt()->>'email')::text
  )
  WITH CHECK (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    owner_email = (auth.jwt()->>'email')::text
  );

-- 5. Universal Select for Companies (Institutional Directory)
DROP POLICY IF EXISTS "companies_select_permissive" ON public.companies;
CREATE POLICY "companies_select_permissive" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

COMMIT;
