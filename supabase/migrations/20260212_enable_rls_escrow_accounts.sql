-- ========================================
-- MIGRATION: Enable RLS on escrow_accounts
-- Date: 2026-02-12
-- Safe to run: Table has 0 rows
-- Impact: Blocks unauthorized SELECT queries
-- ========================================

BEGIN;

-- Step 1: Enable Row Level Security
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow users to view their company's escrow account
CREATE POLICY "rls_escrow_accounts_select"
ON escrow_accounts
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Step 3: Policy for admins (is_admin users can see all)
CREATE POLICY "rls_escrow_accounts_admin_select"
ON escrow_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Step 4: Add comment for documentation
COMMENT ON TABLE escrow_accounts IS 'RLS enabled 2026-02-12: Users can only view their company escrow account';

COMMIT;
