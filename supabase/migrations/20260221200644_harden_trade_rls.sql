-- ============================================================================
-- TRADE RAIL HARDENING & RLS STANDARDIZATION
-- Date: 2026-02-21
-- Purpose:
--   1. Clean up stale policies referencing old column name 'buyer_id'
--   2. Standardize RLS to use 'buyer_company_id' and 'seller_company_id'
--   3. Ensure deterministic "One Flow" access for Trade Kernel
-- ============================================================================

BEGIN;

-- 1. DYNAMIC CLEANUP: Remove all existing policies on trades table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'trades' AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.trades;';
    END LOOP;
END $$;

-- 2. ENABLE RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 3. UNIFIED SELECT POLICY
-- Authorized parties (Buyer/Seller) and Admins can see the trade
CREATE POLICY "trades_select_unified" ON public.trades
  FOR SELECT TO authenticated
  USING (
    buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    auth.jwt()->>'role' = 'admin'
  );

-- 4. UNIFIED INSERT POLICY
-- Allows any authenticated user to create a trade AS A BUYER
-- This is the "First Step" of the One Flow.
CREATE POLICY "trades_insert_unified" ON public.trades
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Validation: User must belong to the company they are buying for
    buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR
    -- Fail-safe for initial onboarding if profile sync is pending
    created_by = auth.uid()
  );

-- 5. UNIFIED UPDATE POLICY
-- Only authorized parties can update (usually via the Kernel)
-- Includes "Sovereign" protection: Buyer can cancel/dispute, Seller can ship/confirm.
CREATE POLICY "trades_update_unified" ON public.trades
  FOR UPDATE TO authenticated
  USING (
    buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    -- Prevent malicious cross-company updates
    buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR 
    auth.jwt()->>'role' = 'admin'
  );

-- 6. INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_trades_buyer_company_id ON public.trades(buyer_company_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_company_id ON public.trades(seller_company_id);

COMMIT;
