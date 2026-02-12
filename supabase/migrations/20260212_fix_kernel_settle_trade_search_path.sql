-- Fix kernel_settle_trade search_path to include extensions schema
-- Previous migration had SET search_path = public, but should include extensions

CREATE OR REPLACE FUNCTION public.kernel_settle_trade(
  p_trade_id uuid,
  p_user_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_trade trades%ROWTYPE;
  v_escrow escrows%ROWTYPE;
  v_payment_id uuid;
BEGIN
  SELECT * INTO v_trade FROM trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade not found';
  END IF;

  SELECT * INTO v_escrow FROM escrows
    WHERE (id = v_trade.escrow_id) OR (trade_id = p_trade_id)
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found';
  END IF;

  IF v_escrow.status <> 'funded' THEN
    RAISE EXCEPTION 'Escrow must be funded before settlement';
  END IF;

  -- Release funds to supplier
  UPDATE escrows
    SET status = 'released',
        released_at = NOW(),
        released_to = v_trade.supplier_id,
        metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata
    WHERE id = v_escrow.id;

  -- Create payment record for supplier
  INSERT INTO payments (
    company_id,
    amount,
    currency,
    status,
    payment_type,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    (SELECT company_id FROM profiles WHERE id = v_trade.supplier_id LIMIT 1),
    v_escrow.amount,
    v_escrow.currency,
    'completed',
    'escrow_release',
    'escrow',
    v_escrow.id,
    jsonb_build_object(
      'trade_id', p_trade_id,
      'escrow_id', v_escrow.id,
      'released_by', p_user_id,
      'released_at', NOW()
    ) || p_metadata
  )
  RETURNING id INTO v_payment_id;

  -- Mark trade as completed
  UPDATE trades
    SET status = 'completed',
        completed_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'settled_at', NOW(),
          'settled_by', p_user_id,
          'payment_id', v_payment_id
        )
    WHERE id = p_trade_id;

  RETURN jsonb_build_object(
    'success', true,
    'trade_id', p_trade_id,
    'escrow_id', v_escrow.id,
    'payment_id', v_payment_id,
    'amount', v_escrow.amount,
    'currency', v_escrow.currency,
    'released_at', NOW()
  );
END;
$$;
