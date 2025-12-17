-- Migration: Extend quotes table for structured RFQ quote submission
-- Date: 2025-01-16
-- Purpose: Add incoterms, MOQ fields and enforce quote_submitted status

-- Add missing fields to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS incoterms text,
ADD COLUMN IF NOT EXISTS moq integer;

-- Ensure status column exists and supports quote_submitted
-- First, check if status column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.quotes ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;

-- Update existing quotes without status to have a default status
UPDATE public.quotes
SET status = 'quote_submitted'
WHERE status IS NULL;

-- Drop existing constraint if it exists (to allow adding new status values)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'quotes' 
    AND constraint_name = 'quotes_status_check'
  ) THEN
    ALTER TABLE public.quotes DROP CONSTRAINT quotes_status_check;
  END IF;
END $$;

-- Add constraint to enforce allowed statuses
ALTER TABLE public.quotes
ADD CONSTRAINT quotes_status_check
CHECK (status IN ('draft', 'quote_submitted', 'pending', 'approved', 'accepted', 'rejected', 'awarded'));

-- Create function to prevent quote edits after submission
CREATE OR REPLACE FUNCTION prevent_quote_edit_after_submit()
RETURNS trigger AS $$
BEGIN
  -- Prevent updates to quotes that are already submitted
  IF OLD.status = 'quote_submitted' AND NEW.status != OLD.status THEN
    -- Allow status changes (e.g., admin approval/rejection)
    RETURN NEW;
  ELSIF OLD.status = 'quote_submitted' AND (
    NEW.price_per_unit != OLD.price_per_unit OR
    NEW.total_price != OLD.total_price OR
    NEW.currency != OLD.currency OR
    NEW.incoterms != OLD.incoterms OR
    NEW.moq != OLD.moq OR
    NEW.delivery_time != OLD.delivery_time OR
    NEW.notes != OLD.notes
  ) THEN
    RAISE EXCEPTION 'Cannot modify a submitted quote. Only status can be changed by admin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trg_prevent_quote_edit ON public.quotes;

-- Create trigger to enforce quote edit prevention
CREATE TRIGGER trg_prevent_quote_edit
BEFORE UPDATE ON public.quotes
FOR EACH ROW
WHEN (OLD.status = 'quote_submitted')
EXECUTE FUNCTION prevent_quote_edit_after_submit();

-- Add comments for documentation
COMMENT ON COLUMN public.quotes.incoterms IS 'Incoterms for the quote (EXW, FOB, CIF, etc.)';
COMMENT ON COLUMN public.quotes.moq IS 'Minimum Order Quantity if different from RFQ quantity';
COMMENT ON COLUMN public.quotes.status IS 'Quote status: draft, quote_submitted (locked), pending, approved, accepted, rejected, awarded';

