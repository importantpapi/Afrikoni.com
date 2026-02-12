-- ============================================================================
-- AFRIKONI LOGISTICS DISPATCH ENGINE
-- Date: 2026-02-12
-- Purpose: Kernel-triggered logistics dispatch subsystem
-- ============================================================================

-- ============================================================================
-- 1. LOGISTICS PROVIDERS SUPPLY INDEX
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Provider Details
  provider_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  
  -- Service Coverage
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  coverage_radius_km INTEGER DEFAULT 50,
  vehicle_types TEXT[] NOT NULL DEFAULT '{}', -- ['van', 'truck', 'container']
  
  -- Availability & Performance
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  response_score FLOAT DEFAULT 0, -- 0-100, higher = better
  acceptance_rate FLOAT DEFAULT 0, -- 0-100
  completion_rate FLOAT DEFAULT 0, -- 0-100
  
  -- Activity Tracking
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  total_deliveries INTEGER DEFAULT 0,
  total_rejections INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_response_score CHECK (response_score >= 0 AND response_score <= 100),
  CONSTRAINT valid_acceptance_rate CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
  CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_logistics_providers_city ON public.logistics_providers(city);
CREATE INDEX IF NOT EXISTS idx_logistics_providers_availability ON public.logistics_providers(is_available);
CREATE INDEX IF NOT EXISTS idx_logistics_providers_response_score ON public.logistics_providers(response_score DESC);
CREATE INDEX IF NOT EXISTS idx_logistics_providers_company_id ON public.logistics_providers(company_id);

-- ============================================================================
-- 2. DISPATCH EVENTS (AUDIT TRAIL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dispatch_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.logistics_providers(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL,
  -- Types: DISPATCH_REQUESTED, PROVIDER_NOTIFIED, PROVIDER_ACCEPTED, 
  --        PROVIDER_REJECTED, SHIPMENT_ASSIGNED, DISPATCH_TIMEOUT, DISPATCH_FAILED
  
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'DISPATCH_REQUESTED', 'PROVIDER_NOTIFIED', 'PROVIDER_ACCEPTED', 
    'PROVIDER_REJECTED', 'SHIPMENT_ASSIGNED', 'DISPATCH_TIMEOUT', 'DISPATCH_FAILED'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_events_trade_id ON public.dispatch_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_provider_id ON public.dispatch_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_type ON public.dispatch_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_created_at ON public.dispatch_events(created_at DESC);

-- ============================================================================
-- 3. DISPATCH NOTIFICATIONS (OUTBOUND QUEUE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dispatch_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.logistics_providers(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp', 'email'
  recipient TEXT NOT NULL, -- phone number or email
  message_body TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  external_id TEXT, -- Twilio message SID or WhatsApp message ID
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('sms', 'whatsapp', 'email')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_notifications_status ON public.dispatch_notifications(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_notifications_trade_id ON public.dispatch_notifications(trade_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_notifications_created_at ON public.dispatch_notifications(created_at DESC);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Logistics Providers
ALTER TABLE public.logistics_providers ENABLE ROW LEVEL SECURITY;

-- Providers can view and update their own record
CREATE POLICY "logistics_providers_own_select"
  ON public.logistics_providers FOR SELECT
  USING (company_id = public.current_company_id());

CREATE POLICY "logistics_providers_own_update"
  ON public.logistics_providers FOR UPDATE
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- Service role can read all (for dispatch engine)
-- (No explicit policy needed - service role bypasses RLS)

-- Dispatch Events (read-only for participants)
ALTER TABLE public.dispatch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_events_select"
  ON public.dispatch_events FOR SELECT
  USING (
    -- Trade participants can see events
    trade_id IN (
      SELECT id FROM public.trades
      WHERE buyer_id = public.current_company_id()
         OR seller_id = public.current_company_id()
    )
    OR
    -- Providers can see their own events
    provider_id IN (
      SELECT id FROM public.logistics_providers
      WHERE company_id = public.current_company_id()
    )
  );

-- Dispatch Notifications (read-only for providers)
ALTER TABLE public.dispatch_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_notifications_select"
  ON public.dispatch_notifications FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.logistics_providers
      WHERE company_id = public.current_company_id()
    )
  );

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on logistics_providers
CREATE OR REPLACE FUNCTION update_logistics_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_logistics_providers_updated_at
  BEFORE UPDATE ON public.logistics_providers
  FOR EACH ROW EXECUTE FUNCTION update_logistics_providers_updated_at();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to update provider stats after job completion
CREATE OR REPLACE FUNCTION update_provider_stats(
  p_provider_id UUID,
  p_accepted BOOLEAN,
  p_completed BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.logistics_providers
  SET
    total_deliveries = CASE WHEN p_completed = true THEN total_deliveries + 1 ELSE total_deliveries END,
    total_rejections = CASE WHEN p_accepted = false THEN total_rejections + 1 ELSE total_rejections END,
    acceptance_rate = (
      CASE WHEN p_accepted THEN total_deliveries + 1 ELSE total_deliveries END::FLOAT /
      NULLIF(total_deliveries + total_rejections + 1, 0) * 100
    ),
    completion_rate = (
      CASE WHEN p_completed = true THEN (total_deliveries + 1)::FLOAT ELSE total_deliveries::FLOAT END /
      NULLIF(total_deliveries + 1, 0) * 100
    ),
    response_score = (
      -- Simple scoring: 70% completion rate + 30% acceptance rate
      (COALESCE(completion_rate, 0) * 0.7) + (COALESCE(acceptance_rate, 0) * 0.3)
    ),
    last_active_at = NOW()
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.logistics_providers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_notifications;

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.logistics_providers TO authenticated;
GRANT SELECT, INSERT ON public.dispatch_events TO authenticated;
GRANT SELECT ON public.dispatch_notifications TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.logistics_providers IS 'Logistics provider supply index for dispatch engine';
COMMENT ON TABLE public.dispatch_events IS 'Immutable audit trail of all dispatch events';
COMMENT ON TABLE public.dispatch_notifications IS 'Outbound notification queue for provider alerts';
