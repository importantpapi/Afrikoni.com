-- ============================================
-- Afrikoni Revenue System Migration
-- Phase 2: Commissions, Subscriptions, Logistics
-- ============================================

-- 1. Update escrow_payments table (if exists) or create it
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  seller_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'partially_released', 'released', 'refunded', 'cancelled')),
  
  -- Commission fields
  commission_rate NUMERIC(5, 2) DEFAULT 8.00, -- 8% default commission
  commission_amount NUMERIC(15, 2) DEFAULT 0,
  net_payout_amount NUMERIC(15, 2), -- Amount after commission
  
  -- Release tracking
  released_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add commission columns if table already exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'escrow_payments') THEN
    -- Add commission columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_payments' AND column_name = 'commission_rate') THEN
      ALTER TABLE public.escrow_payments ADD COLUMN commission_rate NUMERIC(5, 2) DEFAULT 8.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_payments' AND column_name = 'commission_amount') THEN
      ALTER TABLE public.escrow_payments ADD COLUMN commission_amount NUMERIC(15, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_payments' AND column_name = 'net_payout_amount') THEN
      ALTER TABLE public.escrow_payments ADD COLUMN net_payout_amount NUMERIC(15, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_payments' AND column_name = 'released_at') THEN
      ALTER TABLE public.escrow_payments ADD COLUMN released_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_payments' AND column_name = 'processed_by') THEN
      ALTER TABLE public.escrow_payments ADD COLUMN processed_by UUID REFERENCES auth.users(id);
    END IF;
  END IF;
END $$;

-- 2. Create escrow_events table (if not exists)
CREATE TABLE IF NOT EXISTS public.escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES public.escrow_payments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('hold', 'release', 'partial_release', 'refund', 'commission_deducted')),
  amount NUMERIC(15, 2),
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'growth', 'elite')),
  monthly_price NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_method TEXT, -- 'stripe', 'paypal', etc.
  payment_id TEXT, -- External payment ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create verification_purchases table
CREATE TABLE IF NOT EXISTS public.verification_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('fast_track', 'standard')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  payment_method TEXT,
  payment_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create logistics_quotes table
CREATE TABLE IF NOT EXISTS public.logistics_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Buyer or seller requesting quote
  
  -- Origin/Destination
  pickup_country TEXT NOT NULL,
  delivery_country TEXT NOT NULL,
  pickup_city TEXT,
  delivery_city TEXT,
  
  -- Shipment details
  weight_kg NUMERIC(10, 2),
  volume_m3 NUMERIC(10, 2),
  dimensions TEXT, -- "LxWxH"
  
  -- Quote details
  base_price NUMERIC(10, 2) NOT NULL, -- Partner's base price
  afrikoni_markup_percent NUMERIC(5, 2) DEFAULT 5.00, -- 3-10% markup
  afrikoni_markup_amount NUMERIC(10, 2),
  final_price NUMERIC(10, 2) NOT NULL, -- Price with markup
  currency TEXT DEFAULT 'USD',
  
  -- Partner info
  logistics_partner_id UUID REFERENCES public.companies(id),
  partner_name TEXT,
  estimated_days INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create revenue_transactions table (for tracking all revenue)
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('commission', 'subscription', 'logistics_margin', 'verification_fee', 'protection_fee')),
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Related entities
  order_id UUID REFERENCES public.orders(id),
  escrow_id UUID REFERENCES public.escrow_payments(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  logistics_quote_id UUID REFERENCES public.logistics_quotes(id),
  company_id UUID REFERENCES public.companies(id),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add buyer_protection_fee to orders table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyer_protection_fee') THEN
    ALTER TABLE public.orders ADD COLUMN buyer_protection_fee NUMERIC(10, 2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN buyer_protection_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 8. Add subscription_plan to companies table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.companies ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'growth', 'elite'));
    ALTER TABLE public.companies ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_payments_order_id ON public.escrow_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_status ON public.escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_released_at ON public.escrow_payments(released_at);
CREATE INDEX IF NOT EXISTS idx_escrow_events_escrow_id ON public.escrow_events(escrow_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_verification_purchases_company_id ON public.verification_purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_quotes_order_id ON public.logistics_quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_type ON public.revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_status ON public.revenue_transactions(status);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at ON public.revenue_transactions(created_at);

-- 10. Enable RLS
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies (basic - can be refined)
-- Escrow payments: users can see their own company's escrow
CREATE POLICY "Users can view escrow for their company" ON public.escrow_payments
  FOR SELECT USING (
    buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Subscriptions: users can view their company's subscription
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Revenue transactions: admin only (will be refined)
CREATE POLICY "Admins can view revenue transactions" ON public.revenue_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_role = 'admin')
  );

-- 12. Create function to calculate commission on escrow release
CREATE OR REPLACE FUNCTION calculate_escrow_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- When escrow is released, calculate commission
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    -- Calculate commission (default 8%)
    NEW.commission_amount := (NEW.amount * COALESCE(NEW.commission_rate, 8.00) / 100);
    NEW.net_payout_amount := NEW.amount - NEW.commission_amount;
    NEW.released_at := NOW();
    NEW.processed_by := auth.uid();
    
    -- Create revenue transaction
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
    
    -- Create escrow event
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
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_calculate_escrow_commission ON public.escrow_payments;
CREATE TRIGGER trigger_calculate_escrow_commission
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_escrow_commission();

-- 13. Create function to update company subscription plan
CREATE OR REPLACE FUNCTION update_company_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- When subscription is created/updated, update company plan
  IF NEW.status = 'active' THEN
    UPDATE public.companies
    SET 
      subscription_plan = NEW.plan_type,
      subscription_expires_at = NEW.current_period_end
    WHERE id = NEW.company_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE public.companies
    SET subscription_plan = 'free'
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_company_subscription ON public.subscriptions;
CREATE TRIGGER trigger_update_company_subscription
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_subscription();

COMMENT ON TABLE public.escrow_payments IS 'Escrow payments with commission tracking';
COMMENT ON TABLE public.subscriptions IS 'Company subscription plans (Free, Growth, Elite)';
COMMENT ON TABLE public.verification_purchases IS 'Fast-track verification purchases';
COMMENT ON TABLE public.logistics_quotes IS 'Logistics quotes with Afrikoni markup';
COMMENT ON TABLE public.revenue_transactions IS 'All revenue transactions across the platform';

