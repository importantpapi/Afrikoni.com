-- Trade Events Ledger
-- The authoritative audit trail for all trade state transitions (Kernel Architecture)

CREATE TABLE IF NOT EXISTS public.trade_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'state_transition', 'compliance_check', 'escrow_fund', etc.
    status_from TEXT,
    status_to TEXT,
    actor_user_id UUID REFERENCES auth.users(id),
    actor_role TEXT, -- 'buyer', 'seller', 'admin', 'logistics', 'system'
    decision TEXT, -- 'ALLOW', 'BLOCK'
    reason_code TEXT,
    required_actions JSONB, -- Array of actions needed to proceed
    payload JSONB, -- Metadata regarding the event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all events
CREATE POLICY "Admins can view all trade events"
    ON public.trade_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Participants can view events for their trades
CREATE POLICY "Participants can view events for their trades"
    ON public.trade_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trades
            WHERE trades.id = trade_events.trade_id
            AND (
                trades.buyer_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
                OR trades.seller_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

-- Only Kernel (Service Role) can insert events
-- No INSERT policy for authenticated users -> enforced by Edge Function

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_events_trade_id ON public.trade_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_created_at ON public.trade_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_events_event_type ON public.trade_events(event_type);
