-- Add is_admin column to profiles table for proper admin management
-- This replaces the hardcoded email check in permissions.js

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin) WHERE is_admin = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_admin IS 'Admin flag for platform administrators. Set to true to grant admin access.';

