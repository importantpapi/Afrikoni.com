-- ============================================================================
-- FOUNDATION FIX: Solid Database Foundation
-- Date: 2026-01-17
-- 
-- This migration creates the missing foundation tables and fixes security
-- to eliminate 404 and 403 errors.
-- 
-- CRITICAL: Run this FIRST before any other operations
-- ============================================================================

-- ============================================================================
-- PART 1: CAPABILITIES FOUNDATION ⭐ CRITICAL
-- ============================================================================

-- Create company_capabilities table (THE FOUNDATION)
CREATE TABLE IF NOT EXISTS public.company_capabilities (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  can_buy BOOLEAN NOT NULL DEFAULT true,
  can_sell BOOLEAN NOT NULL DEFAULT false,
  can_logistics BOOLEAN NOT NULL DEFAULT false,
  sell_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (sell_status IN ('disabled', 'pending', 'approved')),
  logistics_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (logistics_status IN ('disabled', 'pending', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.company_capabilities IS 
'Company capabilities - THE FOUNDATION. Every company can buy by default. Sell and logistics are opt-in, gated with approval statuses.';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_capabilities_sell_status 
  ON public.company_capabilities(sell_status);
CREATE INDEX IF NOT EXISTS idx_company_capabilities_logistics_status 
  ON public.company_capabilities(logistics_status);

-- Enable RLS
ALTER TABLE public.company_capabilities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT capabilities for their company
DROP POLICY IF EXISTS "company_capabilities_select_own" ON public.company_capabilities;
CREATE POLICY "company_capabilities_select_own"
  ON public.company_capabilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- Policy: Users can INSERT capabilities for their company (during company creation)
DROP POLICY IF EXISTS "company_capabilities_insert_own" ON public.company_capabilities;
CREATE POLICY "company_capabilities_insert_own"
  ON public.company_capabilities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- Policy: Users can UPDATE capabilities for their company (enable/disable features)
DROP POLICY IF EXISTS "company_capabilities_update_own" ON public.company_capabilities;
CREATE POLICY "company_capabilities_update_own"
  ON public.company_capabilities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- ============================================================================
-- PART 2: AUTO-UPDATE TRIGGER
-- ============================================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_company_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS company_capabilities_updated_at_trigger ON public.company_capabilities;

-- Create trigger
CREATE TRIGGER company_capabilities_updated_at_trigger
  BEFORE UPDATE ON public.company_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_company_capabilities_updated_at();

-- ============================================================================
-- PART 3: AUTO-CREATION TRIGGER ⭐ IDEMPOTENCY
-- ============================================================================

-- Function to auto-create capabilities when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company_capabilities()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default capabilities row for new company
  INSERT INTO public.company_capabilities (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
DROP TRIGGER IF EXISTS company_capabilities_auto_create ON public.companies;

-- Create trigger
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_company_capabilities();

-- ============================================================================
-- PART 4: IDEMPOTENT FUNCTION - Ensure capabilities exist for existing companies
-- ============================================================================

-- Function to ensure capabilities row exists (can be called from app or manually)
CREATE OR REPLACE FUNCTION ensure_company_capabilities_exists(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.company_capabilities (company_id)
  VALUES (p_company_id)
  ON CONFLICT (company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run for all existing companies (idempotent - safe to run multiple times)
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM public.companies LOOP
    PERFORM ensure_company_capabilities_exists(company_record.id);
  END LOOP;
END
$$;

-- ============================================================================
-- PART 5: KYC FOUNDATION (Fixes 404 errors)
-- ============================================================================

-- Create kyc_verifications table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_type TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.kyc_verifications IS 
'KYC (Know Your Customer) verifications for companies and users. Used for compliance and trust building.';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_company_id ON public.kyc_verifications(company_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own KYC verifications
DROP POLICY IF EXISTS "Users can view their own KYC verifications" ON public.kyc_verifications;
CREATE POLICY "Users can view their own KYC verifications" 
  ON public.kyc_verifications FOR SELECT
  USING (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert their own KYC verifications
DROP POLICY IF EXISTS "Users can insert their own KYC verifications" ON public.kyc_verifications;
CREATE POLICY "Users can insert their own KYC verifications" 
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own KYC verifications
DROP POLICY IF EXISTS "Users can update their own KYC verifications" ON public.kyc_verifications;
CREATE POLICY "Users can update their own KYC verifications" 
  ON public.kyc_verifications FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- PART 6: NOTIFICATIONS SECURITY FIX (Fixes 403 errors)
-- ============================================================================

-- Ensure notifications table exists (created in earlier migration)
-- Just fix the RLS policies

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications by company" ON public.notifications;
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON public.notifications;

-- Create comprehensive SELECT policy that handles all cases
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT
  USING (
    -- User ID matches directly (most reliable)
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    -- Company ID matches user's company from profiles
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND company_id IS NOT NULL
    )) OR
    -- User email matches authenticated user's email
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND company_id IS NOT NULL
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND company_id IS NOT NULL
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "System can insert notifications" 
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND company_id IS NOT NULL
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- ============================================================================
-- PART 7: VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  -- Check company_capabilities
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_capabilities'
  ) THEN
    RAISE EXCEPTION 'company_capabilities table was not created';
  END IF;

  -- Check kyc_verifications
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'kyc_verifications'
  ) THEN
    RAISE EXCEPTION 'kyc_verifications table was not created';
  END IF;

  -- Success message
  RAISE NOTICE '✅ Foundation tables created successfully!';
  RAISE NOTICE '✅ Auto-creation trigger installed!';
  RAISE NOTICE '✅ RLS policies configured!';
  RAISE NOTICE '✅ All existing companies now have capabilities rows!';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- ============================================================================

-- Uncomment to verify after migration:
-- 
-- 1. Check if all companies have capabilities
-- SELECT 
--   c.id AS company_id,
--   c.company_name,
--   CASE 
--     WHEN cc.company_id IS NULL THEN '❌ MISSING'
--     ELSE '✅ OK'
--   END AS capabilities_status,
--   cc.can_buy,
--   cc.can_sell,
--   cc.can_logistics,
--   cc.sell_status,
--   cc.logistics_status
-- FROM public.companies c
-- LEFT JOIN public.company_capabilities cc ON c.id = cc.company_id
-- ORDER BY c.created_at DESC;
--
-- 2. Test RLS: Try to read your own company's capabilities
-- SELECT * FROM public.company_capabilities 
-- WHERE company_id = (
--   SELECT company_id FROM public.profiles WHERE id = auth.uid()
-- );
--
-- 3. Verify trigger works (create a test company and check capabilities auto-created)
