-- Create subscriptions table for company subscription plans
-- This table stores subscription information for companies (Free, Growth, Elite plans)
-- This migration ensures the table exists even if the revenue_system migration wasn't applied

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'growth', 'elite')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'pending')),
  monthly_price NUMERIC(10, 2) DEFAULT 0,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_method TEXT, -- 'stripe', 'paypal', etc.
  payment_id TEXT, -- External payment ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their company's subscription
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Users can insert subscriptions for their company
CREATE POLICY "Users can insert their company subscription" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Users can update their company's subscription
CREATE POLICY "Users can update their company subscription" ON public.subscriptions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their company subscription" ON public.subscriptions;

-- RLS Policies
-- Users can view their company's subscription
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Users can insert subscriptions for their company
CREATE POLICY "Users can insert their company subscription" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Users can update their company's subscription
CREATE POLICY "Users can update their company subscription" ON public.subscriptions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add subscription_plan column to companies table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'growth', 'elite'));
    
    CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan ON public.companies(subscription_plan);
  END IF;
END $$;

COMMENT ON TABLE public.subscriptions IS 'Company subscription plans (Free, Growth, Elite)';

