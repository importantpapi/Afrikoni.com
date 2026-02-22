-- ============================================================================
-- PROFILE-COMPANY IDENTITY CONSOLIDATION
-- Date: 2026-02-22
-- Purpose: Enforce that every profile is linked to a company and eliminate
--          fragmentation between individual and corporate data.
-- ============================================================================

-- 1. Ensure company_id exists on profiles (should already be there from previous migrations)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
END $$;

-- 2. Create a trigger function to ensure company_id is never NULL for active users
--    In the 2026 Afrikoni OS, the "Self-Is-Company" rule applies.
CREATE OR REPLACE FUNCTION public.enforce_profile_company_link()
RETURNS TRIGGER AS $$
BEGIN
    -- If company_id is null, it's an integrity failure for institutional trades
    IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'Identity Fragmentation Detected: Profile must be linked to a Company.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply the trigger
DROP TRIGGER IF EXISTS trigger_enforce_profile_company_link ON public.profiles;
CREATE TRIGGER trigger_enforce_profile_company_link
    BEFORE INSERT OR UPDATE OF company_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_company_link();

-- 4. Harden foreign key with CASCADE or RESTRICT as appropriate
--    We want to prevent deleting a company if it has active users.
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_company_id_fkey,
ADD CONSTRAINT profiles_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE RESTRICT;

-- 5. Logic for "Self-Provisioning" Company (if needed)
--    Usually handled by the onboarding API, but DB can enforce.
COMMENT ON TABLE public.profiles IS 'User profiles strictly linked to a canonical company identity.';
