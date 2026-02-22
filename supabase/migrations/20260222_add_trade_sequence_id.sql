-- ============================================================================
-- ADD SEQUENCE ID FOR OPTIMISTIC CONCURRENCY
-- Date: 2026-02-22
-- Purpose: Prevent race conditions in trade state transitions
-- ============================================================================

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS sequence_id BIGINT DEFAULT 1;

-- Update existing trades to have a sequence_id if they don't have one
UPDATE public.trades SET sequence_id = 1 WHERE sequence_id IS NULL;

-- Add index for sequence-based lookups (rarely used but good for audit)
CREATE INDEX IF NOT EXISTS idx_trades_sequence_id ON public.trades(sequence_id);

COMMENT ON COLUMN public.trades.sequence_id IS 'Monotonically increasing sequence ID for optimistic locking/concurrency control.';
