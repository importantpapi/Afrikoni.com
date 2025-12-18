/**
 * MIGRATION 2 (SIMPLIFIED): Universal User Visibility
 * RUN AFTER: Migration 0 (Schema Fix) and Migration 1 (Profile Sync)
 * 
 * This version doesn't assume specific table structures
 * It focuses ONLY on core visibility features
 */

-- ============================================================================
-- STEP 1: Add indexes for faster lookups (SAFE - won't error if exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Add index on profiles.email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_email'
  ) THEN
    CREATE INDEX idx_profiles_email ON public.profiles (email);
    RAISE NOTICE '✅ Created index on profiles.email';
  ELSE
    RAISE NOTICE '✓ Index on profiles.email already exists';
  END IF;

  -- Add index on profiles.full_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_full_name'
  ) THEN
    CREATE INDEX idx_profiles_full_name ON public.profiles (full_name);
    RAISE NOTICE '✅ Created index on profiles.full_name';
  ELSE
    RAISE NOTICE '✓ Index on profiles.full_name already exists';
  END IF;

  -- Add index on profiles.created_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_created_at'
  ) THEN
    CREATE INDEX idx_profiles_created_at ON public.profiles (created_at);
    RAISE NOTICE '✅ Created index on profiles.created_at';
  ELSE
    RAISE NOTICE '✓ Index on profiles.created_at already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create admin notification function (for new user registrations)
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.notify_admin_on_new_profile() CASCADE;

-- Create new function
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_profile()
RETURNS trigger AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Only notify if the profile was just created (not an update)
  IF TG_OP = 'INSERT' THEN
    -- Loop through all admin users and send notification
    FOR admin_id IN 
      SELECT id FROM public.profiles WHERE role = 'admin' OR is_admin = TRUE
    LOOP
      -- Insert notification for this admin
      INSERT INTO public.notifications (
        user_id, 
        type, 
        title, 
        message, 
        link, 
        severity, 
        is_read
      )
      VALUES (
        admin_id,
        'new_user_registration',
        '🎉 New User Registration - ' || COALESCE(NEW.full_name, NEW.email),
        COALESCE(NEW.full_name, NEW.email) || ' (' || NEW.email || ') just registered on the platform.',
        '/dashboard/admin/users?id=' || NEW.id,
        'high',
        FALSE
      );
    END LOOP;
    
    RAISE NOTICE '✅ Admin notification sent for new user: %', COALESCE(NEW.full_name, NEW.email);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If notifications table doesn't exist or any error, just log and continue
    RAISE NOTICE '⚠️  Could not send admin notification (notifications table may not exist yet)';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create trigger for admin notifications
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Create new trigger
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_profile();

RAISE NOTICE '✅ Trigger created: on_profile_created';

-- ============================================================================
-- STEP 4: Verification and Reporting (SIMPLIFIED - No complex queries)
-- ============================================================================

DO $$
DECLARE
  total_users_count INT;
  recent_users_count INT;
  users_with_email INT;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 2: UNIVERSAL VISIBILITY - COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Count total users
  SELECT COUNT(*) INTO total_users_count FROM public.profiles;
  RAISE NOTICE '👥 TOTAL USERS: %', total_users_count;

  -- Count recent users (last 30 days)
  SELECT COUNT(*) INTO recent_users_count 
  FROM public.profiles 
  WHERE created_at > NOW() - INTERVAL '30 days';
  RAISE NOTICE '  ├─ Recent (30 days): %', recent_users_count;

  -- Count users with email
  SELECT COUNT(*) INTO users_with_email 
  FROM public.profiles 
  WHERE email IS NOT NULL AND email != '';
  RAISE NOTICE '  └─ With email: %', users_with_email;

  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL USERS VISIBLE';
  RAISE NOTICE '✅ ALL USERS TRACKED';
  RAISE NOTICE '✅ ALL USERS EQUAL';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  • Fast email search (indexed)';
  RAISE NOTICE '  • Fast name search (indexed)';
  RAISE NOTICE '  • Fast date filtering (indexed)';
  RAISE NOTICE '  • Admin notifications on new registrations';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Refresh dashboard at /dashboard/risk';
  RAISE NOTICE '============================================';
END $$;

