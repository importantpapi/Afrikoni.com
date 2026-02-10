-- P1 HARDENING: WEBHOOK IDEMPOTENCY
-- Purpose: Deduplicate webhook events to prevent double-processing.

CREATE TABLE IF NOT EXISTS public.processed_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL UNIQUE, -- Stripe Event ID (evt_...)
  event_type text NOT NULL,
  processed_at timestamp DEFAULT now(),
  status text DEFAULT 'success',
  metadata jsonb DEFAULT '{}'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON public.processed_events(event_id);

-- RLS: Only Service Role should write/read this (via Edge Function)
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- No policies needed if only accessed by Service Role KEY in Edge Function.
-- If accessible by dashboard admins, add:
CREATE POLICY "Admins can view processed events" ON public.processed_events
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
