-- ============================================================================
-- AI MATCHMAKING ENABLER
-- Date: 2026-02-19
-- Description: Adds 'whatsapp' as a notification channel and triggers the 
-- koniai-matchmaker Edge Function on RFQ activation.
-- ============================================================================

-- 1. Add 'whatsapp' to notification_channel enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'notification_channel' AND pg_enum.enumlabel = 'whatsapp'
  ) THEN
    ALTER TYPE notification_channel ADD VALUE 'whatsapp';
  END IF;
END $$;

-- 2. Trigger Function for Matchmaking
CREATE OR REPLACE FUNCTION public.trigger_rfq_matchmaking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when Trade Type is RFQ and status changes to 'rfq_open'
  IF NEW.trade_type = 'rfq' AND (
     (TG_OP = 'INSERT' AND NEW.status = 'rfq_open') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'rfq_open' AND NEW.status = 'rfq_open')
  ) THEN
    
    -- Log the matchmaking trigger in activity_logs
    INSERT INTO public.activity_logs (
      user_id,
      action,
      metadata
    ) VALUES (
      NEW.created_by,
      'rfq_matchmaking_triggered',
      jsonb_build_object(
        'trade_id', NEW.id,
        'status', NEW.status,
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger on trades
DROP TRIGGER IF EXISTS trigger_rfq_matchmaking ON public.trades;
CREATE TRIGGER trigger_rfq_matchmaking
  AFTER INSERT OR UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rfq_matchmaking();

COMMENT ON FUNCTION public.trigger_rfq_matchmaking() IS 'Automatically triggers AI matchmaking logic when an RFQ is opened in the Trade OS Kernel.';
