/**
 * MANUAL FIX: Add binoscientific@gmail.com to profiles
 * 
 * Run this ONLY if:
 * 1. The user exists in auth.users
 * 2. The user doesn't exist in profiles
 * 3. The trigger didn't backfill them automatically
 * 
 * HOW TO USE:
 * 1. First, check if user exists in auth.users:
 *    SELECT id, email FROM auth.users WHERE email = 'binoscientific@gmail.com';
 * 2. If they exist, copy their ID
 * 3. Replace 'USER_ID_HERE' below with their actual ID
 * 4. Run this script
 */

-- ============================================================================
-- STEP 1: Check if user exists in auth.users
-- ============================================================================

DO $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_created TIMESTAMP;
BEGIN
  -- Try to find the user in auth.users
  SELECT id, email, created_at 
  INTO user_id, user_email, user_created
  FROM auth.users 
  WHERE email = 'binoscientific@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE '❌ USER NOT FOUND';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'binoscientific@gmail.com does NOT exist in auth.users';
    RAISE NOTICE 'This means they never registered at all.';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTIONS:';
    RAISE NOTICE '1. Ask them to register again';
    RAISE NOTICE '2. Create the user manually in Supabase Dashboard';
    RAISE NOTICE '============================================';
  ELSE
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ USER FOUND IN AUTH.USERS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'ID: %', user_id;
    RAISE NOTICE 'Created: %', user_created;
    RAISE NOTICE '============================================';
    
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
      RAISE NOTICE '✅ Profile already exists - no action needed';
    ELSE
      RAISE NOTICE '⚠️  Profile missing - creating now...';
      
      -- Create the profile
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
      )
      VALUES (
        user_id,
        user_email,
        'Binoscientific User', -- Default name, they can update it
        'buyer', -- Default role
        user_created,
        NOW()
      );
      
      RAISE NOTICE '✅ SUCCESS: Profile created for %', user_email;
      RAISE NOTICE 'They will now appear in the dashboard!';
    END IF;
    
    RAISE NOTICE '============================================';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Verify the fix worked
-- ============================================================================

-- Show all users with their profile status
SELECT 
  au.email,
  au.id,
  au.created_at as auth_created,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ Missing Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

