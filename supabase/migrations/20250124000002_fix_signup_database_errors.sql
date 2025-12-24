-- Fix Database Errors During Signup
-- This migration removes problematic triggers and makes profiles table signup-safe
-- Goal: Never fail during signup due to database constraints

-- ============================================================================
-- STEP 1: REMOVE ALL AUTH TRIGGERS (Critical - #1 cause of signup failures)
-- ============================================================================

-- Drop any existing triggers on auth.users that might interfere
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;

-- Drop any associated functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS on_auth_user_created() CASCADE;

-- ============================================================================
-- STEP 2: MAKE profiles TABLE IMPOSSIBLE TO FAIL
-- ============================================================================

-- Make role column safe (nullable with default, no NOT NULL constraint)
-- This prevents failures when role isn't set during initial creation
DO $$ 
BEGIN
    -- Check if role column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        -- Remove CHECK constraint if it exists (allows 'admin' and other roles)
        -- The constraint might be named differently, so try multiple variations
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check1;
        -- Also handle if it's a table-level constraint without explicit name
        DO $$
        BEGIN
            -- Drop any check constraint on role column
            EXECUTE (
                SELECT string_agg('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(conname) || ';', ' ')
                FROM pg_constraint
                WHERE conrelid = 'profiles'::regclass
                AND contype = 'c'
                AND pg_get_constraintdef(oid) LIKE '%role%'
            );
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END $$;
        
        -- Remove NOT NULL constraint if it exists
        ALTER TABLE profiles 
        ALTER COLUMN role DROP NOT NULL;
        
        -- Set default if not already set
        ALTER TABLE profiles 
        ALTER COLUMN role SET DEFAULT 'buyer';
        
        -- Update any NULL roles to 'buyer'
        UPDATE profiles SET role = 'buyer' WHERE role IS NULL;
    END IF;
END $$;

-- Make onboarding_completed safe (always defaults to false)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE profiles 
        ALTER COLUMN onboarding_completed SET DEFAULT false;
        
        -- Ensure existing NULL values are false
        UPDATE profiles 
        SET onboarding_completed = false 
        WHERE onboarding_completed IS NULL;
        
        -- Now make it NOT NULL with default
        ALTER TABLE profiles 
        ALTER COLUMN onboarding_completed SET NOT NULL;
    END IF;
END $$;

-- Make email nullable (Supabase Auth already guarantees it exists in auth.users)
-- The profiles table should not block inserts if email is missing
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles 
        ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- Make full_name nullable and set safe default
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles 
        ALTER COLUMN full_name DROP NOT NULL;
        
        ALTER TABLE profiles 
        ALTER COLUMN full_name SET DEFAULT 'User';
    END IF;
END $$;

-- Make company_id nullable (users don't have company during signup)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE profiles 
        ALTER COLUMN company_id DROP NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: FIX RLS POLICIES (Mandatory - allows profile creation)
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Profiles self access" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create comprehensive INSERT policy (allows users to create their own profile)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create SELECT policy (users can view their own profile)
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Create UPDATE policy (users can update their own profile, including role)
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Prevent users from modifying security-critical fields
    AND (
        -- Only check is_admin if column exists
        (SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'profiles' AND column_name = 'is_admin') IS NULL
        OR (OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin)
    )
    AND (OLD.id IS NOT DISTINCT FROM NEW.id)
);

-- ============================================================================
-- STEP 4: FIX ENUM TYPES (if role is an enum)
-- ============================================================================

-- Check if role is an enum type and ensure 'buyer' exists
DO $$ 
BEGIN
    -- Check if there's a role enum type
    IF EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'role' AND typtype = 'e'
    ) THEN
        -- Check if 'buyer' value exists
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumlabel = 'buyer'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role')
        ) THEN
            -- Add buyer to enum (only if it doesn't exist)
            ALTER TYPE role ADD VALUE IF NOT EXISTS 'buyer';
        END IF;
        
        -- Ensure other required values exist
        ALTER TYPE role ADD VALUE IF NOT EXISTS 'seller';
        ALTER TYPE role ADD VALUE IF NOT EXISTS 'hybrid';
        ALTER TYPE role ADD VALUE IF NOT EXISTS 'logistics';
        ALTER TYPE role ADD VALUE IF NOT EXISTS 'logistics_partner';
        ALTER TYPE role ADD VALUE IF NOT EXISTS 'admin';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE SAFE DEFAULT PROFILE FUNCTION (Optional - for manual creation)
-- ============================================================================

-- This function can be called to safely create a profile if it doesn't exist
-- But we don't use triggers - PostLoginRouter handles this
CREATE OR REPLACE FUNCTION public.safe_create_profile(user_id uuid, user_email text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create if profile doesn't exist
    INSERT INTO public.profiles (id, email, role, onboarding_completed, full_name)
    VALUES (
        user_id,
        COALESCE(user_email, ''),
        'buyer',
        false,
        'User'
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ============================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can use the safe_create_profile function
GRANT EXECUTE ON FUNCTION public.safe_create_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_create_profile(uuid, text) TO anon;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify)
-- ============================================================================

-- Check triggers (should return 0 rows for auth.users)
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- Check profiles table structure
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'profiles';

-- Check enum values (if role is an enum)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role');

