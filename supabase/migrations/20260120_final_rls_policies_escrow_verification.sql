-- ============================================
-- FINAL 3% FIX: RLS Policies for escrow_events and verification_purchases
-- ============================================
-- These tables have RLS enabled but no policies, creating security gaps.
-- This migration adds proper RLS policies to ensure data isolation.

-- ============================================
-- 1. ESCROW_EVENTS TABLE POLICIES
-- ============================================

-- Enable RLS (should already be enabled, but ensure it)
ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view escrow_events for escrows they're involved in
-- (buyer or seller company, or admin)
CREATE POLICY "escrow_events_select_own_or_admin"
ON public.escrow_events
FOR SELECT
USING (
  -- Admin users can see all escrow events
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Users can see events for escrows where their company is buyer or seller
  EXISTS (
    SELECT 1 FROM public.escrow_payments ep
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ep.id = escrow_events.escrow_id
    AND (
      ep.buyer_company_id = p.company_id
      OR ep.seller_company_id = p.company_id
    )
  )
  OR
  -- Users can see events they created
  created_by = auth.uid()
);

-- Policy: Users can insert escrow_events for escrows they're involved in
CREATE POLICY "escrow_events_insert_own_or_admin"
ON public.escrow_events
FOR INSERT
WITH CHECK (
  -- Admin users can insert any event
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Users can insert events for escrows where their company is buyer or seller
  EXISTS (
    SELECT 1 FROM public.escrow_payments ep
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ep.id = escrow_events.escrow_id
    AND (
      ep.buyer_company_id = p.company_id
      OR ep.seller_company_id = p.company_id
    )
  )
  OR
  -- Users can insert events they're creating
  created_by = auth.uid()
);

-- Policy: Only admins can update/delete escrow_events (audit trail protection)
CREATE POLICY "escrow_events_update_admin_only"
ON public.escrow_events
FOR UPDATE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "escrow_events_delete_admin_only"
ON public.escrow_events
FOR DELETE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- ============================================
-- 2. VERIFICATION_PURCHASES TABLE POLICIES
-- ============================================

-- Enable RLS (should already be enabled, but ensure it)
ALTER TABLE public.verification_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own company's verification purchases, or admins can see all
CREATE POLICY "verification_purchases_select_own_or_admin"
ON public.verification_purchases
FOR SELECT
USING (
  -- Admin users can see all verification purchases
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Users can see purchases for their company
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Policy: Users can insert verification purchases for their own company
CREATE POLICY "verification_purchases_insert_own"
ON public.verification_purchases
FOR INSERT
WITH CHECK (
  -- Admin users can insert for any company
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  OR
  -- Users can insert purchases for their company
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Policy: Only admins can update verification purchases (payment processing)
CREATE POLICY "verification_purchases_update_admin_only"
ON public.verification_purchases
FOR UPDATE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Policy: Only admins can delete verification purchases (audit trail protection)
CREATE POLICY "verification_purchases_delete_admin_only"
ON public.verification_purchases
FOR DELETE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY "escrow_events_select_own_or_admin" ON public.escrow_events IS 
'Users can view escrow events for escrows where their company is buyer or seller, or events they created. Admins can see all.';

COMMENT ON POLICY "verification_purchases_select_own_or_admin" ON public.verification_purchases IS 
'Users can view verification purchases for their own company. Admins can see all.';
