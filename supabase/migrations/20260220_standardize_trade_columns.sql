-- STANDARDIZE TRADE COLUMNS
-- Purpose: Unify buyer/seller ID naming across Trades and RFQs
-- Reconciles: 20260209 (buyer_id) vs 20260210 (buyer_company_id)

DO $$ 
BEGIN
    -- 1. Standardize Buyer Column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'buyer_id') THEN
        ALTER TABLE public.trades RENAME COLUMN buyer_id TO buyer_company_id;
    END IF;

    -- 2. Standardize Seller Column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'seller_id') THEN
        ALTER TABLE public.trades RENAME COLUMN seller_id TO seller_company_id;
    END IF;

    -- 3. Standardize Status (Some migrations use status, some trade_state)
    -- We'll keep 'status' as the canonical name for JS compatibility but ensure both exist if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_state') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'status') THEN
        ALTER TABLE public.trades RENAME COLUMN trade_state TO status;
    END IF;

END $$;

-- 4. FIX get_institutional_handshake to use new column names
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
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Get Profile
  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE id = v_user_id;
  
  -- 2. Get Company (if exists)
  IF v_profile->>'company_id' IS NOT NULL THEN
    SELECT to_jsonb(c) INTO v_company FROM public.companies c WHERE id = (v_profile->>'company_id')::uuid;
    
    -- 3. Get Capabilities
    SELECT to_jsonb(cap) INTO v_capabilities FROM public.company_capabilities cap WHERE company_id = (v_profile->>'company_id')::uuid;
    
    -- 4. Get Dashboard Counts (Aggregated)
    -- Using the STANDARDIZED column names: buyer_company_id, seller_company_id, status
    SELECT jsonb_build_object(
      'active_trades', (
          SELECT count(*) 
          FROM public.trades 
          WHERE (buyer_company_id = (v_profile->>'company_id')::uuid OR seller_company_id = (v_profile->>'company_id')::uuid) 
          AND status != 'closed'
      ),
      'pending_quotes', (
          SELECT count(*) 
          FROM public.quotes 
          WHERE supplier_company_id = (v_profile->>'company_id')::uuid 
          AND status = 'pending'
      ),
      'unread_notifications', (
          SELECT count(*) 
          FROM public.notifications 
          WHERE user_id = v_user_id 
          AND read = false
      )
    ) INTO v_counts;
  END IF;

  -- 5. Build Handshake Packet
  v_result := jsonb_build_object(
    'profile', v_profile,
    'company', v_company,
    'capabilities', COALESCE(v_capabilities, jsonb_build_object('ready', true, 'can_buy', true, 'can_sell', false)),
    'counts', COALESCE(v_counts, jsonb_build_object('active_trades', 0, 'pending_quotes', 0, 'unread_notifications', 0)),
    'server_time', now()
  );

  RETURN v_result;
END;
$$;
