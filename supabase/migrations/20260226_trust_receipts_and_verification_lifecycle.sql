-- ============================================================================
-- TRUST RECEIPTS + VERIFICATION PAYMENT LIFECYCLE HARDENING
-- Date: 2026-02-26
-- Purpose:
--   1) Add auditable trust receipts for money/delivery/dispute milestones
--   2) Harden verification purchase lifecycle states for real payment flow
-- ============================================================================

BEGIN;

-- 1) Verification purchase lifecycle columns (auditable state machine)
ALTER TABLE public.verification_purchases
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT DEFAULT 'initiated',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.verification_purchases
SET lifecycle_state = CASE
  WHEN status = 'completed' THEN 'payment_confirmed'
  WHEN status = 'pending' THEN 'payment_pending'
  ELSE COALESCE(lifecycle_state, 'initiated')
END
WHERE lifecycle_state IS NULL OR lifecycle_state = '';

-- 2) Trust receipts table (explicit user-visible institutional receipts)
CREATE TABLE IF NOT EXISTS public.trust_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL,
  milestone_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  receipt_code TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_receipts_company_id ON public.trust_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_trust_receipts_trade_id ON public.trust_receipts(trade_id);
CREATE INDEX IF NOT EXISTS idx_trust_receipts_dispute_id ON public.trust_receipts(dispute_id);
CREATE INDEX IF NOT EXISTS idx_trust_receipts_milestone_type ON public.trust_receipts(milestone_type);
CREATE INDEX IF NOT EXISTS idx_trust_receipts_issued_at ON public.trust_receipts(issued_at DESC);

ALTER TABLE public.trust_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trust_receipts_admin_select" ON public.trust_receipts;
CREATE POLICY "trust_receipts_admin_select"
ON public.trust_receipts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

DROP POLICY IF EXISTS "trust_receipts_company_select" ON public.trust_receipts;
CREATE POLICY "trust_receipts_company_select"
ON public.trust_receipts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = trust_receipts.company_id
  )
);

-- Service-role inserts only (no INSERT policy for authenticated by design).

COMMIT;
