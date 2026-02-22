-- ============================================================================
-- TRADE EVENTS SCHEMA + RLS ALIGNMENT
-- Date: 2026-02-25
-- Purpose: Normalize trade_events for mixed kernel generations and fix access RLS
-- ============================================================================

BEGIN;

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

-- 1) Canonical columns for both old and new event writers
ALTER TABLE public.trade_events
  ADD COLUMN IF NOT EXISTS status_from TEXT,
  ADD COLUMN IF NOT EXISTS status_to TEXT,
  ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS actor_role TEXT,
  ADD COLUMN IF NOT EXISTS decision TEXT,
  ADD COLUMN IF NOT EXISTS reason_code TEXT,
  ADD COLUMN IF NOT EXISTS required_actions JSONB,
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS triggered_by UUID REFERENCES auth.users(id);

-- 2) Bidirectional backfill between payload and metadata
UPDATE public.trade_events
SET payload = metadata
WHERE payload IS NULL AND metadata IS NOT NULL;

UPDATE public.trade_events
SET metadata = payload
WHERE metadata IS NULL AND payload IS NOT NULL;

UPDATE public.trade_events
SET actor_user_id = triggered_by
WHERE actor_user_id IS NULL AND triggered_by IS NOT NULL;

UPDATE public.trade_events
SET triggered_by = actor_user_id
WHERE triggered_by IS NULL AND actor_user_id IS NOT NULL;

-- 3) Rebuild policies to use canonical trade ownership columns
DROP POLICY IF EXISTS "Admins can view all trade events" ON public.trade_events;
DROP POLICY IF EXISTS "Participants can view events for their trades" ON public.trade_events;
DROP POLICY IF EXISTS "trade_events_select_policy" ON public.trade_events;

CREATE POLICY "trade_events_select_admin" ON public.trade_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "trade_events_select_participants" ON public.trade_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trades t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = trade_events.trade_id
        AND (
          COALESCE(t.buyer_company_id, t.buyer_id) = p.company_id
          OR COALESCE(t.seller_company_id, t.seller_id) = p.company_id
        )
    )
  );

-- No INSERT policy by design; service role writes events.

CREATE INDEX IF NOT EXISTS idx_trade_events_actor_user_id ON public.trade_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_triggered_by ON public.trade_events(triggered_by);

COMMIT;
