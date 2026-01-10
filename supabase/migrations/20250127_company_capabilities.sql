-- ============================================================================
-- PHASE 1: Company Capabilities System (Alibaba/Amazon Business Style)
-- Date: 2025-01-27
--
-- Goal:
--   - Create company_capabilities table for capability-based access control
--   - Every company can BUY by default (can_buy = true)
--   - SELL and LOGISTICS are opt-in, gated with statuses (disabled/pending/approved)
--   - Auto-create capabilities row when company is created
--   - Secure RLS policies (company-scoped access only)
-- ============================================================================

-- Create company_capabilities table
CREATE TABLE IF NOT EXISTS public.company_capabilities (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  can_buy BOOLEAN NOT NULL DEFAULT true,
  can_sell BOOLEAN NOT NULL DEFAULT false,
  can_logistics BOOLEAN NOT NULL DEFAULT false,
  sell_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (sell_status IN ('disabled', 'pending', 'approved')),
  logistics_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (logistics_status IN ('disabled', 'pending', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.company_capabilities IS 'Company capabilities for Alibaba/Amazon Business-style capability-based access. Every company can buy by default. Sell and logistics are opt-in, gated with approval statuses.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_capabilities_sell_status 
  ON public.company_capabilities(sell_status);
CREATE INDEX IF NOT EXISTS idx_company_capabilities_logistics_status 
  ON public.company_capabilities(logistics_status);

-- ============================================================================
-- RLS POLICIES (Company-scoped access only)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.company_capabilities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT capabilities for their company
CREATE POLICY "company_capabilities_select_own"
  ON public.company_capabilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- Policy: Users can INSERT capabilities for their company (during company creation)
CREATE POLICY "company_capabilities_insert_own"
  ON public.company_capabilities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- Policy: Users can UPDATE capabilities for their company (enable/disable features)
CREATE POLICY "company_capabilities_update_own"
  ON public.company_capabilities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = company_capabilities.company_id
    )
  );

-- Service role has full access (for admin operations)
-- Note: service_role bypasses RLS by default, but we'll make it explicit for clarity

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_company_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER company_capabilities_updated_at_trigger
  BEFORE UPDATE ON public.company_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_company_capabilities_updated_at();

-- ============================================================================
-- TRIGGER: Auto-create capabilities row when company is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_company_capabilities_on_company_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default capabilities row for new company
  -- can_buy = true (default), can_sell = false, can_logistics = false
  INSERT INTO public.company_capabilities (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on companies table
CREATE TRIGGER company_capabilities_auto_create
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION create_company_capabilities_on_company_insert();

-- ============================================================================
-- IDEMPOTENT FUNCTION: Ensure capabilities row exists for existing companies
-- ============================================================================

-- Function to ensure capabilities row exists (can be called from app or manually)
CREATE OR REPLACE FUNCTION ensure_company_capabilities_exists(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.company_capabilities (company_id)
  VALUES (p_company_id)
  ON CONFLICT (company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run for all existing companies (idempotent)
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM public.companies LOOP
    PERFORM ensure_company_capabilities_exists(company_record.id);
  END LOOP;
END
$$;

-- ============================================================================
-- VERIFICATION QUERIES (For testing)
-- ============================================================================

-- Uncomment to verify after migration:
-- SELECT 
--   c.id AS company_id,
--   c.name AS company_name,
--   cc.can_buy,
--   cc.can_sell,
--   cc.can_logistics,
--   cc.sell_status,
--   cc.logistics_status
-- FROM public.companies c
-- LEFT JOIN public.company_capabilities cc ON c.id = cc.company_id
-- ORDER BY c.created_at DESC;
