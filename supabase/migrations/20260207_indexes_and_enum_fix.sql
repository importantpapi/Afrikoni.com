-- ============================================================================
-- FIX: Add missing indexes and standardize verification_status enum values
-- Date: 2026-02-07
-- ============================================================================

-- STEP 1: Add missing indexes for query performance
-- profiles.company_id is used in joins and lookups throughout the app
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles (company_id);

-- orders.rfq_id is used to link orders back to their originating RFQ
CREATE INDEX IF NOT EXISTS idx_orders_rfq_id ON public.orders (rfq_id);

-- Additional frequently-queried foreign keys
CREATE INDEX IF NOT EXISTS idx_quotes_rfq_id ON public.quotes (rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_company_id ON public.rfqs (company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders (company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products (company_id);

-- ============================================================================
-- STEP 2: Fix verification_status values to match UPPERCASE enum
-- The verification_status enum uses: PENDING, IN_PROGRESS, VERIFIED, REJECTED, REQUIRES_REVIEW
-- Some records may have been inserted with lowercase values before the enum was created
-- ============================================================================

-- Fix any lowercase values that might exist (only runs if column is text type)
-- If column is already the enum type, these will be no-ops or safe to skip
DO $$
BEGIN
  -- Only attempt if column is text type (not the enum)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'verification_status'
      AND data_type = 'text'
  ) THEN
    UPDATE public.companies SET verification_status = 'PENDING' WHERE verification_status IN ('pending', 'unverified');
    UPDATE public.companies SET verification_status = 'IN_PROGRESS' WHERE verification_status = 'in_progress';
    UPDATE public.companies SET verification_status = 'VERIFIED' WHERE verification_status = 'verified';
    UPDATE public.companies SET verification_status = 'REJECTED' WHERE verification_status = 'rejected';
    RAISE NOTICE 'Fixed lowercase verification_status values in companies table';
  ELSE
    RAISE NOTICE 'verification_status column is enum type - skipping text cleanup';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  idx_count integer;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_profiles_company_id',
    'idx_orders_rfq_id',
    'idx_quotes_rfq_id',
    'idx_rfqs_company_id',
    'idx_orders_company_id',
    'idx_products_company_id'
  );
  RAISE NOTICE 'Created % / 6 indexes', idx_count;
END $$;
