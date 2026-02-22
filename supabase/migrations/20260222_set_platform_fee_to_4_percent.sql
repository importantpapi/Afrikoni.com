-- Set canonical Afrikoni platform fee to 4%
-- This migration updates server-side enforcement and escrow defaults.

-- 1) Update escrow defaults for newly created payments
ALTER TABLE IF EXISTS public.escrow_payments
  ALTER COLUMN commission_rate SET DEFAULT 4.00;

-- 2) Update pending escrows that still carry legacy defaults
UPDATE public.escrow_payments
SET commission_rate = 4.00
WHERE status = 'pending'
  AND (commission_rate IS NULL OR commission_rate = 8.00);

-- 3) Canonical fee enforcement trigger (enterprise revenue engine)
CREATE OR REPLACE FUNCTION public.compute_trade_revenue_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_platform_fee NUMERIC(15, 2);
    v_calc_version TEXT := '2026.FEB.GOLDEN_THREAD';
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_revenue WHERE escrow_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Enforce 4% server-side, regardless of client payload
    v_platform_fee := ROUND((NEW.amount * 0.04), 2);

    NEW.commission_rate := 4.00;
    NEW.commission_amount := v_platform_fee;
    NEW.net_payout_amount := NEW.amount - v_platform_fee;

    INSERT INTO public.platform_revenue (
        escrow_id,
        order_id,
        amount_usd,
        fee_type,
        calculation_version,
        metadata
    ) VALUES (
        NEW.id,
        NEW.order_id,
        v_platform_fee,
        'commission',
        v_calc_version,
        jsonb_build_object(
            'base_amount', NEW.amount,
            'enforced_rate', 4.00,
            'currency', NEW.currency
        )
    );

    RETURN NEW;
END;
$$;

-- 4) Legacy commission function alignment
CREATE OR REPLACE FUNCTION public.calculate_escrow_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    NEW.commission_amount := (NEW.amount * COALESCE(NEW.commission_rate, 4.00) / 100);
    NEW.net_payout_amount := NEW.amount - NEW.commission_amount;
    NEW.released_at := NOW();
    NEW.processed_by := auth.uid();

    INSERT INTO public.revenue_transactions (
      transaction_type,
      amount,
      currency,
      order_id,
      escrow_id,
      company_id,
      description,
      status,
      processed_at,
      processed_by
    ) VALUES (
      'commission',
      NEW.commission_amount,
      NEW.currency,
      NEW.order_id,
      NEW.id,
      NEW.seller_company_id,
      'Escrow commission - ' || NEW.commission_rate || '%',
      'completed',
      NOW(),
      auth.uid()
    );

    INSERT INTO public.escrow_events (
      escrow_id,
      event_type,
      amount,
      currency,
      metadata,
      created_by
    ) VALUES (
      NEW.id,
      'commission_deducted',
      NEW.commission_amount,
      NEW.currency,
      jsonb_build_object(
        'commission_rate', NEW.commission_rate,
        'net_payout', NEW.net_payout_amount
      ),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Ensure canonical triggers point to the 4% functions
DROP TRIGGER IF EXISTS trigger_enforce_canonical_fees ON public.escrow_payments;
CREATE TRIGGER trigger_enforce_canonical_fees
  BEFORE INSERT OR UPDATE OF amount, status, currency ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_trade_revenue_ledger();

DROP TRIGGER IF EXISTS trigger_calculate_escrow_commission ON public.escrow_payments;
CREATE TRIGGER trigger_calculate_escrow_commission
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_escrow_commission();
