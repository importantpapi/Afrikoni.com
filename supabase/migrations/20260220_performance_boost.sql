-- ============================================================================
-- PERFORMANCE BOOST: DASHBOARD HYDRATION OPTIMIZATION
-- Date: 2026-02-20
-- Impact: Significant reduction in initial app load time (TTFR)
-- ============================================================================

-- 1. PARTIAL INDEXES FOR ACTIVE TRADES
-- Optimizes the OR query in get_institutional_handshake for counts
CREATE INDEX IF NOT EXISTS idx_trades_buyer_active 
ON public.trades(buyer_company_id) 
WHERE status != 'closed';

CREATE INDEX IF NOT EXISTS idx_trades_seller_active 
ON public.trades(seller_company_id) 
WHERE status != 'closed';

-- 2. PARTIAL INDEX FOR UNREAD NOTIFICATIONS
-- Optimizes unread counter in the handshake
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id) 
WHERE read = false;

-- 3. COMPOSITE INDEX FOR PENDING QUOTES
CREATE INDEX IF NOT EXISTS idx_quotes_supplier_pending 
ON public.quotes(supplier_company_id, status) 
WHERE status = 'pending';

-- 4. ANALYZE TABLES
-- Ensure the planner has the latest statistics to use the new indexes
ANALYZE public.trades;
ANALYZE public.notifications;
ANALYZE public.quotes;

-- ============================================================================
-- RPC REFINEMENT: MINIMIZE HANDSHAKE LATENCY
-- ============================================================================
-- This version is designed to be extremely fast by leveraging partial indexes
-- and eliminating redundant sub-queries inside the RLS-bypassing scope.

CREATE OR REPLACE FUNCTION public.get_institutional_handshake()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_profile jsonb;
  v_company jsonb;
  v_capabilities jsonb;
  v_counts jsonb;
  v_result jsonb;
  v_company_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Get Profile (Atomic)
  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE id = v_user_id;
  v_company_id := (v_profile->>'company_id')::uuid;
  
  -- 2. Parallel-ish Logic: Gather counts and metadata
  IF v_company_id IS NOT NULL THEN
    -- Get Company & Capabilities
    SELECT to_jsonb(c) INTO v_company FROM public.companies c WHERE id = v_company_id;
    SELECT to_jsonb(cap) INTO v_capabilities FROM public.company_capabilities cap WHERE company_id = v_company_id;
    
    -- Optimized Dashboard Counts using Partial Indexes
    -- Using the standardized column names
    SELECT jsonb_build_object(
      'active_trades', (
          SELECT count(*) FROM public.trades 
          WHERE (buyer_company_id = v_company_id OR seller_company_id = v_company_id) 
          AND status != 'closed'
      ),
      'pending_quotes', (
          SELECT count(*) FROM public.quotes 
          WHERE supplier_company_id = v_company_id AND status = 'pending'
      ),
      'unread_notifications', (
          SELECT count(*) FROM public.notifications 
          WHERE user_id = v_user_id AND read = false
      )
    ) INTO v_counts;
  END IF;

  -- 3. Final Packet Assembly
  v_result := jsonb_build_object(
    'profile', v_profile,
    'company', v_company,
    'capabilities', COALESCE(v_capabilities, jsonb_build_object('ready', true, 'can_buy', true, 'can_sell', false)),
    'counts', COALESCE(v_counts, jsonb_build_object('active_trades', 0, 'pending_quotes', 0, 'unread_notifications', 0)),
    'server_time', now(),
    'optimized', true
  );

  RETURN v_result;
END;
$$;
