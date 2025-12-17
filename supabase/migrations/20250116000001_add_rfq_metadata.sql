-- Migration: Add metadata column to rfqs table
-- Date: 2025-01-16
-- Purpose: Support structured RFQ metadata storage

-- Add metadata column if it doesn't exist
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_rfqs_metadata ON public.rfqs USING gin (metadata);

-- Add comment
COMMENT ON COLUMN public.rfqs.metadata IS 'Structured RFQ metadata (certifications, incoterms, purchase_type, order_value_range, buyer_role, company_name, budget_min, budget_max)';

