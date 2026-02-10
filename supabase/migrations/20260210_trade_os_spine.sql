-- ============================================================================
-- AFRIKONI 2026 TRADE OS - CANONICAL TRADE OBJECT MIGRATION
-- Date: 2026-02-10
-- Purpose: Create canonical trades table and event ledger
-- ============================================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE trade_state AS ENUM (
    'draft', 'rfq', 'quoted', 'contracted', 'escrow_funded', 'in_production', 'shipped', 'in_transit', 'delivered', 'accepted', 'settled', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_state AS ENUM (
    'none', 'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CANONICAL TRADE OBJECT
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_company_id uuid REFERENCES public.companies(id),
  seller_company_id uuid REFERENCES public.companies(id),
  rfq_id uuid REFERENCES public.rfqs(id),
  quote_id uuid REFERENCES public.quotes(id),
  order_id uuid REFERENCES public.orders(id),
  escrow_id uuid REFERENCES public.escrows(id),
  shipment_id uuid REFERENCES public.shipments(id),
  trade_state trade_state DEFAULT 'draft',
  risk_state risk_state DEFAULT 'none',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- APPEND-ONLY TRADE EVENT LEDGER
CREATE TABLE IF NOT EXISTS public.trade_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid REFERENCES public.trades(id),
  event_type text NOT NULL,
  actor_user_id uuid,
  actor_role text,
  payload jsonb,
  created_at timestamp DEFAULT now()
);

-- COMPLIANCE CASES
CREATE TABLE IF NOT EXISTS public.compliance_cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid REFERENCES public.trades(id),
  ruleset text,
  state text,
  created_at timestamp DEFAULT now()
);

-- COMPLIANCE DOCUMENTS
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES public.compliance_cases(id),
  doc_type text,
  file_url text,
  status text
);

-- AI OUTPUTS
CREATE TABLE IF NOT EXISTS public.ai_outputs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text,
  entity_id uuid,
  output_type text,
  confidence numeric(5,2),
  payload jsonb,
  created_at timestamp DEFAULT now()
);

-- AUDIT LOG (reuse trade_events)
-- DISPUTES LINKED TO TRADE
ALTER TABLE public.disputes
ADD COLUMN IF NOT EXISTS trade_id uuid REFERENCES public.trades(id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_trades_buyer_seller ON public.trades(buyer_company_id, seller_company_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_trade_id ON public.trade_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_compliance_cases_trade_id ON public.compliance_cases(trade_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_entity ON public.ai_outputs(entity_type, entity_id);
