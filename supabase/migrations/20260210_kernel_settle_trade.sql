-- Atomic escrow release + trade settlement

CREATE OR REPLACE FUNCTION public.kernel_settle_trade(
  p_trade_id uuid,
  p_user_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'Escrow must be funded to release';
  END IF;

  INSERT INTO payments (
    escrow_id,
    trade_id,
    recipient_id,
    amount,
    currency,
    payment_type,
    reason,
    status,
    created_at
  ) VALUES (
    v_escrow.id,
    p_trade_id,
    v_escrow.seller_id,
    v_escrow.balance,
    v_escrow.currency,
    'escrow_release',
    'delivery_accepted',
    'processing',
    now()
  ) RETURNING id INTO v_payment_id;

  UPDATE escrows
    SET status = 'released',
        balance = 0,
        released_at = now(),
        release_reason = 'delivery_accepted'
    WHERE id = v_escrow.id;

  UPDATE trades
    SET status = 'settled',
        updated_at = now(),
        completed_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
    WHERE id = p_trade_id;

  INSERT INTO trade_events (trade_id, event_type, metadata, triggered_by, created_at)
    VALUES (p_trade_id, 'payment_released', jsonb_build_object('escrow_id', v_escrow.id, 'payment_id', v_payment_id), p_user_id, now());

  INSERT INTO trade_events (trade_id, event_type, metadata, triggered_by, created_at)
    VALUES (p_trade_id, 'state_transition', jsonb_build_object('from_state', v_trade.status, 'to_state', 'settled'), p_user_id, now());

  RETURN jsonb_build_object(
    'trade_id', p_trade_id,
    'escrow_id', v_escrow.id,
    'payment_id', v_payment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kernel_settle_trade(uuid, uuid, jsonb) FROM PUBLIC;
