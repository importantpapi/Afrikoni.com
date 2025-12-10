-- ============================================
-- Fix Customs Clearance RLS and Add Missing Indexes
-- ============================================

-- 1. Drop existing policies for customs_clearance
DROP POLICY IF EXISTS "Users can view customs for their shipments" ON public.customs_clearance;
DROP POLICY IF EXISTS "Logistics partners can manage customs" ON public.customs_clearance;

-- 2. Create consolidated SELECT policy
CREATE POLICY "customs_clearance_select" ON public.customs_clearance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.orders o ON s.order_id = o.id
      WHERE s.id = customs_clearance.shipment_id
      AND (
        o.buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR o.seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
        OR s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
      )
    )
  );

-- 3. Create consolidated INSERT policy
CREATE POLICY "customs_clearance_insert" ON public.customs_clearance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = customs_clearance.shipment_id
      AND s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

-- 4. Create consolidated UPDATE policy
CREATE POLICY "customs_clearance_update" ON public.customs_clearance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = customs_clearance.shipment_id
      AND s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

-- 5. Create consolidated DELETE policy
CREATE POLICY "customs_clearance_delete" ON public.customs_clearance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = customs_clearance.shipment_id
      AND s.logistics_partner_id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

-- 6. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_customs_clearance_order_id ON public.customs_clearance(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customs_clearance_id ON public.shipments(customs_clearance_id);

-- 7. Fix function search_path for security
ALTER FUNCTION public.update_shipment_from_tracking() SET search_path = public;
ALTER FUNCTION public.detect_cross_border_shipment() SET search_path = public;

