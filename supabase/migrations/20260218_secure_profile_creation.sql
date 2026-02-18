-- ============================================================================
-- AUTH PROVISIONING TRIGGER & SECURITY FIX
-- Date: 2026-02-18
-- Fix: Moves Profile creation from Client-Side (Vulnerable) to Server-Side (Secure).
-- ============================================================================

-- 1. Create the detailed profile handler function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  intended_role TEXT;
  full_name TEXT;
BEGIN
  -- Extract metadata safely
  full_name := new.raw_user_meta_data->>'full_name';
  if full_name IS NULL OR full_name = '' THEN
    full_name := split_part(new.email, '@', 1);
  END IF;

  intended_role := new.raw_user_meta_data->>'intended_role';
  -- STRICT ROLE VALIDATION: Only allow 'buyer' or 'seller'. Default to 'buyer'.
  -- This prevents a user from forcing 'admin' role via client-side hacks.
  IF intended_role NOT IN ('buyer', 'seller') THEN
    intended_role := 'buyer';
  END IF;

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
    new.id,
    new.email,
    full_name,
    intended_role,
    now(),
    now()
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
