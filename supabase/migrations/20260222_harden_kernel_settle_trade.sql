-- Harden kernel_settle_trade to be schema-drift tolerant and idempotent.
-- Reconciles legacy trade/payment column variants and enforces deterministic settlement.

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
  v_trade jsonb;
  v_escrow jsonb;
  v_payment_id uuid;

  v_trade_status text;
  v_escrow_status text;
  v_escrow_id uuid;
  v_seller_company_id uuid;
  v_amount numeric;
  v_currency text;

  has_payment_trade_id boolean;
  has_payment_recipient_id boolean;
  has_payment_payment_type boolean;
  has_payment_company_id boolean;

  has_escrow_balance boolean;
  has_escrow_release_reason boolean;
  has_escrow_metadata boolean;

  has_trade_completed_at boolean;
  has_trade_metadata boolean;

  v_escrow_update_sql text;
  v_trade_update_sql text;
BEGIN
  SELECT to_jsonb(t) INTO v_trade
  FROM public.trades t
  WHERE t.id = p_trade_id
  FOR UPDATE;

  IF v_trade IS NULL THEN
    RAISE EXCEPTION 'Trade not found';
  END IF;

  SELECT to_jsonb(e) INTO v_escrow
  FROM public.escrows e
  WHERE (
    (v_trade ? 'escrow_id' AND e.id::text = v_trade->>'escrow_id')
    OR e.trade_id = p_trade_id
  )
  ORDER BY e.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_escrow IS NULL THEN
    RAISE EXCEPTION 'Escrow not found';
  END IF;

  v_escrow_id := (v_escrow->>'id')::uuid;
  v_trade_status := lower(COALESCE(v_trade->>'status', v_trade->>'trade_state', ''));
  v_escrow_status := lower(COALESCE(v_escrow->>'status', ''));

  IF v_escrow_status = 'released' THEN
    BEGIN
      SELECT id INTO v_payment_id
      FROM public.payments
      WHERE escrow_id = v_escrow_id
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1;
    EXCEPTION
      WHEN undefined_column THEN
        v_payment_id := NULL;
    END;

    RETURN jsonb_build_object(
      'trade_id', p_trade_id,
      'escrow_id', v_escrow_id,
      'payment_id', v_payment_id,
      'already_settled', true
    );
  END IF;

  IF v_escrow_status <> 'funded' THEN
    RAISE EXCEPTION 'Escrow must be funded to release';
  END IF;

  IF v_trade_status IN ('disputed', 'closed') THEN
    RAISE EXCEPTION 'Trade state % cannot be settled', v_trade_status;
  END IF;

  v_amount := COALESCE(NULLIF(v_escrow->>'balance', '')::numeric, NULLIF(v_escrow->>'amount', '')::numeric);
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid escrow amount for settlement';
  END IF;

  v_currency := COALESCE(v_escrow->>'currency', v_trade->>'currency', 'USD');

  v_seller_company_id := COALESCE(
    NULLIF(v_trade->>'seller_company_id', '')::uuid,
    NULLIF(v_trade->>'seller_id', '')::uuid,
    NULLIF(v_escrow->>'seller_id', '')::uuid
  );

  IF v_seller_company_id IS NULL THEN
    RAISE EXCEPTION 'Seller company is required for settlement';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'trade_id'
  ) INTO has_payment_trade_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'recipient_id'
  ) INTO has_payment_recipient_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_type'
  ) INTO has_payment_payment_type;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'company_id'
  ) INTO has_payment_company_id;

  IF has_payment_trade_id AND has_payment_recipient_id AND has_payment_payment_type THEN
    INSERT INTO public.payments (
      escrow_id,
      trade_id,
      recipient_id,
      amount,
      currency,
      payment_type,
      status,
      created_at
    ) VALUES (
      v_escrow_id,
      p_trade_id,
      v_seller_company_id,
      v_amount,
      v_currency,
      'escrow_release',
      'processing',
      now()
    )
    RETURNING id INTO v_payment_id;
  ELSIF has_payment_company_id THEN
    INSERT INTO public.payments (
      escrow_id,
      company_id,
      amount,
      currency,
      status,
      payment_method,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_escrow_id,
      v_seller_company_id,
      v_amount,
      v_currency,
      'completed',
      'escrow_release',
      jsonb_build_object(
        'trade_id', p_trade_id,
        'released_by', p_user_id,
        'released_at', now()
      ) || COALESCE(p_metadata, '{}'::jsonb),
      now(),
      now()
    )
    RETURNING id INTO v_payment_id;
  ELSE
    RAISE EXCEPTION 'Unsupported payments schema for settlement';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrows' AND column_name = 'balance'
  ) INTO has_escrow_balance;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrows' AND column_name = 'release_reason'
  ) INTO has_escrow_release_reason;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrows' AND column_name = 'metadata'
  ) INTO has_escrow_metadata;

  v_escrow_update_sql := 'UPDATE public.escrows SET status = ''released'', released_at = now()';
  IF has_escrow_balance THEN
    v_escrow_update_sql := v_escrow_update_sql || ', balance = 0';
  END IF;
  IF has_escrow_release_reason THEN
    v_escrow_update_sql := v_escrow_update_sql || ', release_reason = ''delivery_accepted''';
  END IF;
  IF has_escrow_metadata THEN
    v_escrow_update_sql := v_escrow_update_sql || ', metadata = COALESCE(metadata, ''{}''::jsonb) || $1';
  END IF;
  IF has_escrow_metadata THEN
    v_escrow_update_sql := v_escrow_update_sql || ' WHERE id = $2';
  ELSE
    v_escrow_update_sql := v_escrow_update_sql || ' WHERE id = $1';
  END IF;

  IF has_escrow_metadata THEN
    EXECUTE v_escrow_update_sql USING COALESCE(p_metadata, '{}'::jsonb), v_escrow_id;
  ELSE
    EXECUTE v_escrow_update_sql USING v_escrow_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'completed_at'
  ) INTO has_trade_completed_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'metadata'
  ) INTO has_trade_metadata;

  v_trade_update_sql := 'UPDATE public.trades SET status = ''settled'', updated_at = now()';
  IF has_trade_completed_at THEN
    v_trade_update_sql := v_trade_update_sql || ', completed_at = now()';
  END IF;
  IF has_trade_metadata THEN
    v_trade_update_sql := v_trade_update_sql || ', metadata = COALESCE(metadata, ''{}''::jsonb) || $1';
  END IF;
  IF has_trade_metadata THEN
    v_trade_update_sql := v_trade_update_sql || ' WHERE id = $2';
  ELSE
    v_trade_update_sql := v_trade_update_sql || ' WHERE id = $1';
  END IF;

  IF has_trade_metadata THEN
    EXECUTE v_trade_update_sql USING COALESCE(p_metadata, '{}'::jsonb), p_trade_id;
  ELSE
    EXECUTE v_trade_update_sql USING p_trade_id;
  END IF;

  INSERT INTO public.trade_events (trade_id, event_type, metadata, triggered_by, created_at)
  VALUES (
    p_trade_id,
    'payment_released',
    jsonb_build_object(
      'escrow_id', v_escrow_id,
      'payment_id', v_payment_id,
      'amount', v_amount,
      'currency', v_currency
    ),
    p_user_id,
    now()
  );

  INSERT INTO public.trade_events (trade_id, event_type, metadata, triggered_by, created_at)
  VALUES (
    p_trade_id,
    'state_transition',
    jsonb_build_object('from_state', COALESCE(v_trade->>'status', v_trade->>'trade_state', 'unknown'), 'to_state', 'settled'),
    p_user_id,
    now()
  );

  RETURN jsonb_build_object(
    'trade_id', p_trade_id,
    'escrow_id', v_escrow_id,
    'payment_id', v_payment_id,
    'amount', v_amount,
    'currency', v_currency,
    'state', 'settled'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kernel_settle_trade(uuid, uuid, jsonb) FROM PUBLIC;
