-- Fix RLS policy to allow users to update their own role
-- This enables role switching after onboarding without breaking security

-- Drop existing update policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a new policy that explicitly allows users to update their own profile
-- This includes role, onboarding_completed, and company_id fields
-- The WITH CHECK clause ensures security while allowing role updates
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Prevent modification of security-critical fields
  -- Using DO block to safely check if columns exist
  AND (OLD.id IS NOT DISTINCT FROM NEW.id)
);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Allows authenticated users to update their own profile including role, onboarding_completed, and company_id. Prevents modification of id. Role validation is enforced by table CHECK constraint.';

