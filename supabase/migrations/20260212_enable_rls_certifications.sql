-- ========================================
-- MIGRATION: Enable RLS on certifications
-- Date: 2026-02-12
-- Safe to run: Table has 0 rows
-- Impact: Protects company certification data
-- ========================================

BEGIN;

-- Step 1: Enable Row Level Security
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow companies to view their own certifications
CREATE POLICY "rls_certifications_select"
ON certifications
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Step 3: Allow companies to insert their own certs
CREATE POLICY "rls_certifications_insert"
ON certifications
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Step 4: Allow companies to update their own certs
CREATE POLICY "rls_certifications_update"
ON certifications
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Step 5: Admin access (view all certifications)
CREATE POLICY "rls_certifications_admin_all"
ON certifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Step 6: Add comment for documentation
COMMENT ON TABLE certifications IS 'RLS enabled 2026-02-12: Companies can manage their own certifications';

COMMIT;
