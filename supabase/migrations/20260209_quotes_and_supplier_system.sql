/**
 * Supabase Migration: Quotes & Supplier Tables
 * Handles quotes on RFQs and supplier company information
 */

-- Ensure quotes table exists
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id),
  supplier_company_id UUID NOT NULL REFERENCES companies(id),
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  quantity_unit TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  lead_time_days INTEGER NOT NULL,
  incoterms TEXT NOT NULL DEFAULT 'FOB',
  delivery_location TEXT NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  certificates TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_supplier_quote UNIQUE(trade_id, supplier_company_id)
);

CREATE INDEX quotes_trade_id ON quotes(trade_id);
CREATE INDEX quotes_supplier_company_id ON quotes(supplier_company_id);
CREATE INDEX quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX quotes_status ON quotes(status);
CREATE INDEX quotes_created_at ON quotes(created_at DESC);

-- Row Level Security for quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view quotes for their submissions"
  ON quotes FOR SELECT
  USING (
    supplier_company_id IN (
      SELECT company_id FROM user_company_roles
      WHERE user_id = auth.uid()
    )
    OR
    trade_id IN (
      SELECT id FROM trades
      WHERE buyer_company_id IN (
        SELECT company_id FROM user_company_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Suppliers can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    supplier_company_id IN (
      SELECT company_id FROM user_company_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage quotes"
  ON quotes FOR ALL
  USING (auth.role() = 'service_role');

-- Add supplier verification fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS supplier_category TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hs_codes TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS quote_count INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accepted_quote_count INTEGER DEFAULT 0;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_quotes_updated_at();

-- Trigger to update company quote counts
CREATE OR REPLACE FUNCTION update_company_quote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE companies
    SET quote_count = quote_count + 1
    WHERE id = NEW.supplier_company_id;
    
    IF NEW.status = 'accepted' THEN
      UPDATE companies
      SET accepted_quote_count = accepted_quote_count + 1
      WHERE id = NEW.supplier_company_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
      UPDATE companies
      SET accepted_quote_count = accepted_quote_count + 1
      WHERE id = NEW.supplier_company_id;
    ELSIF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
      UPDATE companies
      SET accepted_quote_count = accepted_quote_count - 1
      WHERE id = NEW.supplier_company_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_quote_count_trigger ON quotes;
CREATE TRIGGER update_company_quote_count_trigger AFTER INSERT OR UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_company_quote_count();
