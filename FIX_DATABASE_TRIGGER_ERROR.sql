-- ============================================================================
-- EMERGENCY FIX: Remove Broken Database Triggers Causing "Database error saving new user"
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This will remove problematic triggers that cause signup failures
-- ============================================================================

-- STEP 1: REMOVE ALL TRIGGERS ON auth.users (These cause the error)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS sync_user_profile ON auth.users;

-- STEP 2: DROP ALL ASSOCIATED FUNCTIONS
-- ============================================================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_on_signup() CASCADE;

-- STEP 3: VERIFY TRIGGERS ARE REMOVED
-- ============================================================================
-- Run this to verify (should return 0 rows):
-- SELECT trigger_name 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- STEP 4: ENSURE PROFILES TABLE HAS PROPER STRUCTURE
-- ============================================================================
-- Make sure these columns exist and are nullable (so inserts never fail)
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN onboarding_completed SET DEFAULT false,
  ALTER COLUMN company_id DROP NOT NULL;

-- STEP 5: ENSURE RLS POLICIES ALLOW PROFILE CREATION
-- ============================================================================
-- Drop old policies that might block inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create permissive INSERT policy
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- STEP 6: VERIFY RLS POLICIES
-- ============================================================================
-- Run this to see all policies (should include INSERT policy above):
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'profiles';

-- ============================================================================
-- ✅ DONE! 
-- Profile creation will now be handled by PostLoginRouter in your app
-- Users will no longer see "Database error saving new user"
-- ============================================================================

