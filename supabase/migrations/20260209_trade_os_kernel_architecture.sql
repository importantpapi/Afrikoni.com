-- ============================================================================
-- TRADE OS KERNEL TABLES
-- Date: 2026-02-09
-- Purpose: Implement Trade Kernel architecture with state machine,
--          event system, and escrow management
-- ============================================================================

-- ============================================================================
-- 1. TRADES TABLE (Unified RFQ + Order)
-- ============================================================================
-- The single source of truth for every trade.
-- Replaces separate RFQ/Order paradigm with unified state machine.

CREATE TABLE IF NOT EXISTS public.trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core identifiers
  trade_type varchar(20) NOT NULL DEFAULT 'rfq', -- 'rfq' or 'order'
  buyer_id uuid NOT NULL REFERENCES public.companies(id),
  seller_id uuid REFERENCES public.companies(id), -- NULL until quote accepted
  
  -- Trade content
  title varchar(255) NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  
  -- Quantities and pricing
  quantity numeric(15,2) NOT NULL,
  quantity_unit varchar(50), -- 'tons', 'pieces', 'kg', etc.
  price_min numeric(15,2),
  price_max numeric(15,2),
  currency varchar(3) DEFAULT 'USD',
  target_price numeric(15,2),
  
  -- KERNEL STATE MACHINE
  status varchar(50) NOT NULL DEFAULT 'draft',
  -- States: draft, rfq_open, quoted, contracted, escrow_required, 
  --         escrow_funded, production, pickup_scheduled, in_transit,
  --         delivered, accepted, settled, disputed, closed
  
  -- Trade metadata
  metadata jsonb DEFAULT '{}', -- Extended attributes (compliance, inspection, etc.)
  
  -- Timeline
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  published_at timestamp,
  completed_at timestamp,
  expires_at timestamp,
  
  -- Tracking
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT valid_status CHECK (status IN (
    'draft', 'rfq_open', 'quoted', 'contracted', 'escrow_required',
    'escrow_funded', 'production', 'pickup_scheduled', 'in_transit',
    'delivered', 'accepted', 'settled', 'disputed', 'closed'
  )),
  CONSTRAINT valid_trade_type CHECK (trade_type IN ('rfq', 'order'))
);

CREATE INDEX idx_trades_buyer_id ON public.trades(buyer_id);
CREATE INDEX idx_trades_seller_id ON public.trades(seller_id);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_trades_created_at ON public.trades(created_at DESC);

-- ============================================================================
-- 2. TRADE EVENTS TABLE (Event Log)
-- ============================================================================
-- Immutable event log. Every significant action creates an event.
-- Events are the foundation for UI timeline, automations, and audit trail.

CREATE TABLE IF NOT EXISTS public.trade_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL,
  -- Types: state_transition, rfq_created, quote_received, quote_selected,
  --        contract_generated, escrow_created, escrow_funded, payment_released,
  --        shipment_created, delivered, dispute_created, etc.
  
  metadata jsonb DEFAULT '{}' NOT NULL,
  triggered_by uuid REFERENCES auth.users(id),
  
  created_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'state_transition', 'rfq_created', 'rfq_published', 'rfq_closed',
    'quote_received', 'quote_selected', 'quote_rejected',
    'contract_generated', 'contract_signed',
    'escrow_created', 'escrow_funded', 'payment_released', 'refund_initiated',
    'shipment_created', 'pickup_scheduled', 'pickup_confirmed', 'in_transit',
    'delivery_scheduled', 'delivered', 'delivery_accepted',
    'dispute_created', 'dispute_resolved',
    'compliance_check_passed', 'compliance_check_failed',
    'error_occurred', 'automation_triggered'
  ))
);

CREATE INDEX idx_trade_events_trade_id ON public.trade_events(trade_id);
CREATE INDEX idx_trade_events_type ON public.trade_events(event_type);
CREATE INDEX idx_trade_events_created_at ON public.trade_events(created_at DESC);

-- ============================================================================
-- 3. QUOTES TABLE (Tied to Kernel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.companies(id),
  
  price_per_unit numeric(15,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  total_price numeric(15,4),
  quantity numeric(15,2),
  
  -- Delivery terms
  lead_time_days integer,
  delivery_location varchar(255),
  incoterms varchar(20), -- FOB, CIF, EXW, etc.
  
  status varchar(20) DEFAULT 'submitted', -- submitted, selected, rejected
  selected_at timestamp,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  expires_at timestamp
);

CREATE INDEX idx_quotes_trade_id ON public.quotes(trade_id);
CREATE INDEX idx_quotes_supplier_id ON public.quotes(supplier_id);

-- ============================================================================
-- 4. CONTRACTS TABLE (AI-Generated, Versioned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id),
  
  -- Document content
  title varchar(255) NOT NULL,
  content_html text,
  content_json jsonb,
  
  -- Versions and signatures
  version integer DEFAULT 1,
  status varchar(20) DEFAULT 'generated', -- generated, signed, cancelled
  
  -- Signatories
  buyer_signed_by uuid REFERENCES auth.users(id),
  buyer_signed_at timestamp,
  seller_signed_by uuid REFERENCES auth.users(id),
  seller_signed_at timestamp,
  
  -- Terms
  total_amount numeric(15,4),
  currency varchar(3) DEFAULT 'USD',
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_contract_status CHECK (status IN ('generated', 'signed', 'cancelled'))
);

CREATE INDEX idx_contracts_trade_id ON public.contracts(trade_id);

-- ============================================================================
-- 5. ESCROWS TABLE (Milestone-Based Payments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escrows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.companies(id),
  seller_id uuid NOT NULL REFERENCES public.companies(id),
  
  -- Amount and currency
  amount numeric(15,4) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  balance numeric(15,4), -- Remaining balance
  
  -- Payment details
  payment_method varchar(50), -- bank_transfer, card, crypto, etc.
  payment_transaction_id varchar(255),
  payment_details jsonb,
  
  -- Status machine
  status varchar(20) DEFAULT 'pending',
  -- States: pending (waiting for payment), funded, released, refunded, expired, disputed
  
  -- Lifecycle
  created_at timestamp DEFAULT now(),
  funded_at timestamp,
  released_at timestamp,
  refunded_at timestamp,
  expires_at timestamp DEFAULT (now() + interval '30 days'),
  
  release_reason varchar(100),
  
  CONSTRAINT valid_escrow_status CHECK (status IN (
    'pending', 'funded', 'released', 'refunded', 'expired', 'disputed'
  ))
);

CREATE INDEX idx_escrows_trade_id ON public.escrows(trade_id);
CREATE INDEX idx_escrows_status ON public.escrows(status);
CREATE INDEX idx_escrows_buyer_id ON public.escrows(buyer_id);
CREATE INDEX idx_escrows_seller_id ON public.escrows(seller_id);

-- ============================================================================
-- 6. PAYMENTS TABLE (Payment History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  escrow_id uuid REFERENCES public.escrows(id) ON DELETE SET NULL,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  
  recipient_id uuid NOT NULL REFERENCES public.companies(id),
  
  amount numeric(15,4) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  
  payment_type varchar(50) NOT NULL, -- escrow_release, refund, adjustment
  reason varchar(100),
  
  status varchar(20) DEFAULT 'processing', -- processing, completed, failed, cancelled
  
  transaction_details jsonb,
  
  created_at timestamp DEFAULT now(),
  completed_at timestamp,
  
  CONSTRAINT valid_payment_type CHECK (payment_type IN ('escrow_release', 'refund', 'adjustment'))
);

CREATE INDEX idx_payments_trade_id ON public.payments(trade_id);
CREATE INDEX idx_payments_recipient_id ON public.payments(recipient_id);

-- ============================================================================
-- 7. REFUNDS TABLE (Refund History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  escrow_id uuid NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  
  recipient_id uuid NOT NULL REFERENCES public.companies(id), -- Buyer getting refund
  
  amount numeric(15,4) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  
  reason varchar(100), -- dispute_lost_by_seller, cancellation, etc.
  status varchar(20) DEFAULT 'processing', -- processing, completed, failed
  
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

CREATE INDEX idx_refunds_trade_id ON public.refunds(trade_id);

-- ============================================================================
-- 8. AUDIT LOG TABLE (Compliance & Forensics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  entity_type varchar(50) NOT NULL, -- 'trade', 'escrow', 'contract', etc.
  entity_id uuid NOT NULL,
  
  action varchar(50) NOT NULL, -- 'state_transition', 'update', 'delete', etc.
  details jsonb,
  
  triggered_by uuid REFERENCES auth.users(id),
  timestamp timestamp DEFAULT now(),
  
  ip_address inet,
  user_agent text
);

CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);

-- ============================================================================
-- 9. SHIPMENTS TABLE (Logistics Events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  
  origin_country varchar(2),
  destination_country varchar(2),
  
  -- Status tracking
  status varchar(50) DEFAULT 'pending',
  -- pending, pickup_scheduled, pickup_confirmed, in_transit, 
  -- delivery_scheduled, delivered, cancelled
  
  -- Important dates
  scheduled_pickup_date date,
  actual_pickup_date date,
  scheduled_delivery_date date,
  actual_delivery_date date,
  
  -- Logistics details
  tracking_number varchar(255),
  carrier_name varchar(255),
  
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_shipment_status CHECK (status IN (
    'pending', 'pickup_scheduled', 'pickup_confirmed', 'in_transit',
    'delivery_scheduled', 'delivered', 'cancelled'
  ))
);

CREATE INDEX idx_shipments_trade_id ON public.shipments(trade_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);

-- ============================================================================
-- 10. RLS POLICIES - KERNEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Basic RLS: Users can see trades where they are buyer or seller
CREATE POLICY "trades_select_policy"
ON public.trades
FOR SELECT
USING (
  buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR seller_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "trades_insert_policy"
ON public.trades
FOR INSERT
WITH CHECK (
  buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Trade events visible to trade parties
CREATE POLICY "trade_events_select_policy"
ON public.trade_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = trade_events.trade_id
    AND (
      t.buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR t.seller_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Escrows visible to buyer/seller
CREATE POLICY "escrows_select_policy"
ON public.escrows
FOR SELECT
USING (
  buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR seller_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Payments visible to parties
CREATE POLICY "payments_select_policy"
ON public.payments
FOR SELECT
USING (
  recipient_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR auth.jwt() ->> 'role' = 'admin'
);

-- Shipments visible to trade parties
CREATE POLICY "shipments_select_policy"
ON public.shipments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = shipments.trade_id
    AND (
      t.buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      OR t.seller_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  OR auth.jwt() ->> 'role' = 'admin'
);

-- ============================================================================
-- APPLY CHANGES
-- ============================================================================
-- This migration is idempotent. Run with `supabase db push`.
