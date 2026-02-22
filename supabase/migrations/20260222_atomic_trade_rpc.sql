-- ============================================================================
-- ATOMIC TRADE CREATION RPC
-- Date: 2026-02-22
-- Purpose: Ensure trades and RFQs are created in a single atomic transaction
--          to prevent orphaned records and data desync.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.atomic_create_trade(
    p_trade_payload JSONB,
    p_rfq_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_trade_id UUID;
    v_trade_record JSONB;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 1. Insert into TRADES
    INSERT INTO public.trades (
        trade_type,
        buyer_company_id,
        seller_company_id,
        title,
        description,
        category_id,
        quantity,
        quantity_unit,
        price_min,
        price_max,
        currency,
        target_price,
        status,
        metadata,
        created_by,
        published_at,
        sequence_id
    ) VALUES (
        COALESCE(p_trade_payload->>'trade_type', 'rfq'),
        (p_trade_payload->>'buyer_company_id')::UUID,
        (p_trade_payload->>'seller_company_id')::UUID,
        p_trade_payload->>'title',
        p_trade_payload->>'description',
        (p_trade_payload->>'category_id')::UUID,
        (p_trade_payload->>'quantity')::NUMERIC,
        p_trade_payload->>'quantity_unit',
        (p_trade_payload->>'price_min')::NUMERIC,
        (p_trade_payload->>'price_max')::NUMERIC,
        COALESCE(p_trade_payload->>'currency', 'USD'),
        (p_trade_payload->>'target_price')::NUMERIC,
        COALESCE(p_trade_payload->>'status', 'draft'),
        COALESCE(p_trade_payload->'metadata', '{}'::JSONB) || jsonb_build_object(
            'created_at_platform', now(),
            'kernel_version', '2026.1',
            'created_by_rpc', true
        ),
        v_user_id,
        CASE WHEN COALESCE(p_trade_payload->>'status', 'draft') = 'rfq_open' THEN now() ELSE NULL END,
        1
    )
    RETURNING id INTO v_trade_id;

    -- 2. If it is an RFQ, insert into RFQS table
    IF p_rfq_payload IS NOT NULL OR COALESCE(p_trade_payload->>'trade_type', 'rfq') = 'rfq' THEN
        INSERT INTO public.rfqs (
            id,
            buyer_company_id,
            buyer_user_id,
            category_id,
            title,
            description,
            quantity,
            unit,
            target_price,
            status,
            expires_at,
            metadata
        ) VALUES (
            v_trade_id,
            (p_trade_payload->>'buyer_company_id')::UUID,
            v_user_id,
            (p_trade_payload->>'category_id')::UUID,
            p_trade_payload->>'title',
            p_trade_payload->>'description',
            (p_trade_payload->>'quantity')::NUMERIC,
            COALESCE(p_trade_payload->>'quantity_unit', 'pieces'),
            (p_trade_payload->>'target_price')::NUMERIC,
            CASE 
                WHEN COALESCE(p_trade_payload->>'status', 'draft') = 'rfq_open' THEN 'open'
                ELSE COALESCE(p_trade_payload->>'status', 'draft')
            END,
            (p_trade_payload->>'expires_at')::TIMESTAMP,
            COALESCE(p_trade_payload->'metadata', '{}'::JSONB)
        );
    END IF;

    -- 3. Log the creation event
    -- Check if trade_events exists (from 20260210_trade_os_spine.sql)
    INSERT INTO public.trade_events (
        trade_id,
        event_type,
        actor_user_id,
        actor_role,
        payload
    ) VALUES (
        v_trade_id,
        'rfq_created',
        v_user_id,
        'buyer',
        jsonb_build_object(
            'action', 'atomic_create',
            'timestamp', now()
        )
    );

    -- 4. Return the full trade record
    SELECT to_jsonb(t) INTO v_trade_record FROM public.trades t WHERE id = v_trade_id;
    
    RETURN v_trade_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_create_trade TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_create_trade TO service_role;
