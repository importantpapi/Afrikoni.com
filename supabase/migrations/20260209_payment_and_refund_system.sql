/**
 * Supabase Migration: Add Payment & Refund tables
 * Handles storage of Stripe payment transactions and refunds
 * 
 * Deploy: supabase migration up
 */

-- payments table: Store all payment transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  payment_method TEXT NOT NULL DEFAULT 'stripe', -- stripe, bank, crypto
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX payments_escrow_id ON payments(escrow_id);
CREATE INDEX payments_company_id ON payments(company_id);
CREATE INDEX payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX payments_status ON payments(status);

-- refunds table: Store refund transactions
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  stripe_charge_id TEXT,
  stripe_refund_id TEXT UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  reason TEXT NOT NULL DEFAULT 'requested_by_customer',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX refunds_escrow_id ON refunds(escrow_id);
CREATE INDEX refunds_payment_id ON refunds(payment_id);
CREATE INDEX refunds_stripe_refund_id ON refunds(stripe_refund_id);
CREATE INDEX refunds_status ON refunds(status);

-- user_payment_methods table: Save payment methods for future use
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE,
  payment_method_type TEXT NOT NULL, -- card, bank, crypto
  nickname TEXT,
  last_four TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX user_payment_methods_stripe_payment_method_id ON user_payment_methods(stripe_payment_method_id);
CREATE INDEX user_payment_methods_is_active ON user_payment_methods(is_active);

-- Update escrows table to add Stripe fields
ALTER TABLE escrows ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE escrows ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE escrows ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';
CREATE INDEX IF NOT EXISTS escrows_stripe_payment_intent_id ON escrows(stripe_payment_intent_id);

-- Row Level Security for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- Row Level Security for refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refunds"
  ON refunds FOR SELECT
  USING (
    escrow_id IN (
      SELECT es.id FROM escrows es
      JOIN trades t ON es.trade_id = t.id
      WHERE t.buyer_company_id IN (
        SELECT company_id FROM user_company_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage refunds"
  ON refunds FOR ALL
  USING (auth.role() = 'service_role');

-- Row Level Security for user_payment_methods
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON user_payment_methods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own payment methods"
  ON user_payment_methods FOR ALL
  USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
