-- ============================================
-- COMPLETE FIX FOR SIGNUP ERRORS
-- Run this in Supabase SQL Editor
-- ============================================
-- This script fixes the "Database error saving new user" issue
-- It creates a SAFE trigger that won't block signup if it fails
-- ============================================

-- ============================================
-- STEP 1: Fix audit_log table (add missing column)
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_log'
    ) THEN
        -- Add missing event_source column
        ALTER TABLE public.audit_log 
        ADD COLUMN IF NOT EXISTS event_source TEXT;
        
        RAISE NOTICE 'Added event_source column to audit_log';
    ELSE
        RAISE NOTICE 'audit_log table does not exist - skipping';
    END IF;
END $$;

-- ============================================
-- STEP 2: Ensure profiles table has safe structure
-- ============================================

-- Make all columns nullable/safe so inserts never fail
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN onboarding_completed SET DEFAULT false,
  ALTER COLUMN company_id DROP NOT NULL;

-- Add created_at and updated_at if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- STEP 3: Drop and recreate the signup trigger with SAFE error handling
-- This trigger will NOT block signup even if profile creation fails
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create new function with SAFE error handling that NEVER blocks signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with all required fields
  -- This uses UPSERT to handle race conditions
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'buyer'
    ),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Handle race conditions gracefully
  
  RETURN NEW;
  
EXCEPTION 
  WHEN unique_violation THEN
    -- Profile already exists, just return (shouldn't happen with ON CONFLICT, but safety)
    RAISE WARNING 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- 🔒 CRITICAL: Log the error but NEVER block signup
    -- This ensures "Database error saving new user" never blocks the user
    RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Always return NEW to allow signup to succeed
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: Fix RLS policies to allow profile creation
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create clean policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert (for triggers - CRITICAL)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 5: Verify the setup
-- ============================================

-- This should show your trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth';

-- This should show all policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- STEP 6: Clean up any broken user accounts (OPTIONAL)
-- ============================================

-- Find auth users without profiles
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- If you see users without profiles above, you can create profiles for them:
-- (Uncomment and run ONLY if the query above shows users without profiles)
/*
INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'buyer'),
  false,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- ✅ DONE!
-- ============================================
-- The trigger is now safe and will NEVER block signup
-- Even if profile creation fails, users can still sign up
-- PostLoginRouter will create the profile if the trigger fails
-- ============================================

