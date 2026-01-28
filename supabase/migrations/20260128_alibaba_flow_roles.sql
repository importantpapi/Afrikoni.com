-- ============================================================================
-- ALIBABA FLOW: Role-Based Signup
-- Date: 2026-01-28
-- Purpose: Update profile sync trigger to read intended_role from user metadata
--          Support new roles: buyer, seller, hybrid, services
-- ============================================================================

-- ============================================================================
-- STEP 1: Update profile trigger to read intended_role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile for the user
  -- ✅ ALIBABA FLOW: Read intended_role from signup metadata
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
    -- ✅ ALIBABA FLOW: Priority order for role detection
    -- 1. intended_role (from new signup flow)
    -- 2. role (legacy)
    -- 3. default to 'buyer'
    COALESCE(
      NEW.raw_user_meta_data->>'intended_role',
      NEW.raw_user_meta_data->>'role',
      'buyer'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- ✅ ALIBABA FLOW: Update role if it was previously default
    role = CASE
      WHEN profiles.role = 'buyer' AND EXCLUDED.role != 'buyer'
      THEN EXCLUDED.role
      ELSE profiles.role
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Add role constraint (optional - for data integrity)
-- ============================================================================

-- Note: Only add if you want to enforce valid role values
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('buyer', 'seller', 'hybrid', 'services', 'admin', 'super_admin'));

-- ============================================================================
-- STEP 3: Add comment for documentation
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a profile in public.profiles when a new user registers.
Supports Alibaba-style intent-first signup with roles: buyer, seller, hybrid, services.
Reads intended_role from signup metadata, falls back to role or defaults to buyer.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Alibaba Flow Roles Migration Complete';
  RAISE NOTICE 'Supported roles: buyer, seller, hybrid, services';
  RAISE NOTICE 'Trigger now reads intended_role from user metadata';
END $$;
