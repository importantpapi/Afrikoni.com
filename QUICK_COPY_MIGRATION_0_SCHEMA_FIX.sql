/**
 * MIGRATION 0: Schema Fix - Add Missing Columns
 * RUN THIS FIRST BEFORE OTHER MIGRATIONS!
 * 
 * This ensures profiles table has all required columns
 */

-- ============================================================================
-- STEP 1: Add missing columns to profiles table (safe - won't error if exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE;
    RAISE NOTICE '✅ Added email column';
  ELSE
    RAISE NOTICE '✓ email column already exists';
  END IF;

  -- Add full_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE '✅ Added full_name column';
  ELSE
    RAISE NOTICE '✓ full_name column already exists';
  END IF;

  -- Add role column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'buyer';
    RAISE NOTICE '✅ Added role column';
  ELSE
    RAISE NOTICE '✓ role column already exists';
  END IF;

  -- Add phone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Added phone column';
  ELSE
    RAISE NOTICE '✓ phone column already exists';
  END IF;

  -- Add is_admin column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added is_admin column';
  ELSE
    RAISE NOTICE '✓ is_admin column already exists';
  END IF;

  -- Add company_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES companies(id);
    RAISE NOTICE '✅ Added company_id column';
  ELSE
    RAISE NOTICE '✓ company_id column already exists';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column';
  ELSE
    RAISE NOTICE '✓ created_at column already exists';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column';
  ELSE
    RAISE NOTICE '✓ updated_at column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Sync existing profiles with auth.users data
-- ============================================================================

-- Update email from auth.users where missing
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- Update full_name from auth.users where missing
UPDATE public.profiles p
SET full_name = COALESCE(
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'name',
  SPLIT_PART(au.email, '@', 1)
)
FROM auth.users au
WHERE p.id = au.id
AND (p.full_name IS NULL OR p.full_name = '');

-- ============================================================================
-- STEP 3: Show current profiles table structure
-- ============================================================================

DO $$
DECLARE
  column_list TEXT;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO column_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 0: SCHEMA FIX - COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Profiles table columns:';
  RAISE NOTICE '%', column_list;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema is now ready for main migrations';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run QUICK_COPY_MIGRATION_1.sql';
  RAISE NOTICE '============================================';
END $$;

