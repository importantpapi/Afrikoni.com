-- ============================================================================
-- AFRIKONI 2026 TRADE OS - SCHEMA ALIGNMENT
-- Date: 2026-02-10
-- Purpose: Add missing fields used by Trade OS HUD + analytics
-- ============================================================================

-- Companies: trust & compliance signals
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS trust_score numeric(5,2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS kyb_status text,
ADD COLUMN IF NOT EXISTS kyc_status text,
ADD COLUMN IF NOT EXISTS afcfta_ready boolean DEFAULT false;

-- Orders: trade corridor analytics
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS buyer_country text,
ADD COLUMN IF NOT EXISTS seller_country text;

CREATE INDEX IF NOT EXISTS idx_orders_buyer_country ON public.orders(buyer_country);
CREATE INDEX IF NOT EXISTS idx_orders_seller_country ON public.orders(seller_country);

-- Disputes: minimal structure for risk signals
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_company_id uuid REFERENCES public.companies(id),
  seller_company_id uuid REFERENCES public.companies(id),
  status varchar(20) DEFAULT 'open', -- open, resolved, closed
  resolution_favor varchar(20), -- buyer, seller, neutral
  created_at timestamp DEFAULT now(),
  resolved_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_disputes_buyer_seller_status
  ON public.disputes(buyer_company_id, seller_company_id, status);

