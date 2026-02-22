-- ============================================================================
-- MESSAGING TRIGGER HARDENING
-- Date: 2026-02-25
-- Purpose: Ensure last_message preview stays synced with canonical 'content' column
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = COALESCE(NEW.content, NEW.body, 'File Attached'),
    last_message_at = NEW.created_at, 
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger should already exist from whatsapp migration, but we redefine the function.
-- If it doesn't exist, we create it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_conversation_last_message') THEN
    CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();
  END IF;
END $$;

COMMIT;
