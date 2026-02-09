/**
 * Supabase Migration: Contracts Table
 * Stores auto-generated and signed contracts for trades
 */

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  contract_type TEXT NOT NULL DEFAULT 'purchase_order',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, signed, rejected, superseded
  html_content TEXT,
  json_content JSONB NOT NULL,
  generated_by_ai BOOLEAN DEFAULT false,
  ai_model TEXT DEFAULT 'claude-3-sonnet',
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX contracts_trade_id ON contracts(trade_id);
CREATE INDEX contracts_quote_id ON contracts(quote_id);
CREATE INDEX contracts_status ON contracts(status);
CREATE INDEX contracts_version ON contracts(version);
CREATE INDEX contracts_created_at ON contracts(created_at DESC);

-- Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts for their trades"
  ON contracts FOR SELECT
  USING (
    trade_id IN (
      SELECT id FROM trades
      WHERE buyer_company_id IN (
        SELECT company_id FROM user_company_roles
        WHERE user_id = auth.uid()
      )
      OR seller_company_id IN (
        SELECT company_id FROM user_company_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage contracts"
  ON contracts FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();
