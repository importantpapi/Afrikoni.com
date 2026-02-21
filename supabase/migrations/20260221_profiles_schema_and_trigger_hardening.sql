-- ============================================================================
-- PROFILES SCHEMA HARDENING & AUTO-PROVISIONING
-- Date: 2026-02-21
-- Fixes: "column does not exist", "Profile not found", and RLS permission 400/403 errors.
-- ============================================================================

-- 1. Ensure the company_id link exists in public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 2. Add missing business columns to profiles (to prevent the 400 Bad Request during frontend sync)
-- These allow the frontend to sync company/contact info into the profile record seamlessly.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS year_established TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Update the Secure RPC to handle the link properly (Hardened)
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

-- 4. Set up RLS for profiles so users can update their own data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 5. Hardened Auto-Profile Auto-Provisioning
-- This ensures a profile ALWAYS exists when a user is created via Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  intended_role TEXT;
  full_name TEXT;
BEGIN
  -- Extract metadata safely
  full_name := new.raw_user_meta_data->>'full_name';
  IF full_name IS NULL OR full_name = '' THEN
    full_name := split_part(new.email, '@', 1);
  END IF;

  -- UNIFIED TRADER STRATEGY: Default to 'trader' role for all B2B participants
  intended_role := 'trader';

  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    name,
    avatar_url, 
    business_email,
    role,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    new.email,
    full_name,
    full_name,
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    intended_role,
    false, -- New users start with onboarding pending
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    business_email = EXCLUDED.email,
    updated_at = now();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill missing profiles for existing users with Unified Trader role
INSERT INTO public.profiles (id, email, business_email, role, onboarding_completed, created_at, updated_at)
SELECT 
  id, 
  email, 
  email, 
  'trader',
  (CASE WHEN raw_app_meta_data->>'onboarding_completed' = 'true' THEN true ELSE false END),
  now(), 
  now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Ensure existing user is set to trader for testing
-- Update this to a generic update for the current user session check if needed
-- For now, let's just make sure the 'trader' role exists in the profile records.

COMMIT;
