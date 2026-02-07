-- ============================================================================
-- FIX: Recreate missing on_auth_user_created trigger
-- Date: 2026-02-07
-- Problem: Migration 20250124000002 dropped the trigger, 20260128 recreated
--          the function but NEVER recreated the trigger itself.
--          New signups don't get profiles auto-created.
-- ============================================================================

-- STEP 1: Recreate the trigger that was dropped
-- Drop first to make this migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 2: Backfill any users who signed up without getting a profile
-- This catches anyone who signed up between the trigger being dropped and now
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1)
  ),
  COALESCE(
    u.raw_user_meta_data->>'intended_role',
    u.raw_user_meta_data->>'role',
    'buyer'
  ),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  trigger_exists boolean;
  orphaned_users integer;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;

  SELECT COUNT(*) INTO orphaned_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;

  RAISE NOTICE 'Trigger on_auth_user_created exists: %', trigger_exists;
  RAISE NOTICE 'Orphaned users without profiles: %', orphaned_users;

  IF NOT trigger_exists THEN
    RAISE EXCEPTION 'CRITICAL: Trigger on_auth_user_created was not created!';
  END IF;

  IF orphaned_users > 0 THEN
    RAISE WARNING 'There are still % users without profiles after backfill', orphaned_users;
  END IF;
END $$;
