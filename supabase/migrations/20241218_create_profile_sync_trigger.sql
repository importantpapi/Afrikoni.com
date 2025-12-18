/**
 * CRITICAL FIX: Auto-sync auth.users → profiles
 * 
 * PROBLEM: Users can register in auth.users but not appear in profiles table
 * SOLUTION: Automatic trigger that creates profile on registration
 * 
 * This ensures EVERY user who registers is visible in the dashboard
 */

-- ============================================================================
-- STEP 1: Create function to handle new user registration
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Create trigger on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Backfill existing users (sync auth.users → profiles)
-- ============================================================================

-- Insert any auth users that don't have profiles yet
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'buyer') as role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a profile in public.profiles when a new user registers in auth.users. This ensures all authenticated users are visible in the dashboard.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'Triggers profile creation for every new user registration. Prevents users from being invisible in the dashboard.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all auth users now have profiles
DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROFILE SYNC VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total auth.users: %', auth_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE 'Missing profiles: %', missing_count;
  
  IF missing_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All users synced!';
  ELSE
    RAISE WARNING '⚠️  WARNING: % users still missing profiles', missing_count;
  END IF;
  
  RAISE NOTICE '============================================';
END $$;

