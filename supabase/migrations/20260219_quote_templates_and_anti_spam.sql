-- ============================================================================
-- QUOTE TEMPLATES SYSTEM
-- Date: 2026-02-19
-- Purpose: Allow suppliers to save and reuse quote templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template Details
  template_name TEXT NOT NULL,
  product_category TEXT, -- e.g., "Cocoa", "Shea Butter"
  
  -- Pricing
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Terms
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days > 0),
  incoterms TEXT NOT NULL, -- EXW, FOB, CIF, etc.
  payment_terms TEXT NOT NULL, -- Net 30, Net 60, etc.
  moq INTEGER, -- Minimum Order Quantity
  
  -- Additional Details
  delivery_location TEXT,
  certifications TEXT[],
  notes TEXT,
  
  -- Metadata
  use_count INTEGER DEFAULT 0, -- Track how often used
  last_used_at TIMESTAMPTZ,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(supplier_company_id, template_name)
);

-- Enable RLS
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Policies: Suppliers can manage their own templates
CREATE POLICY "Suppliers can view own templates"
  ON public.quote_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = quote_templates.supplier_company_id
    )
  );

CREATE POLICY "Suppliers can insert own templates"
  ON public.quote_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = quote_templates.supplier_company_id
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Suppliers can update own templates"
  ON public.quote_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = quote_templates.supplier_company_id
    )
  );

CREATE POLICY "Suppliers can delete own templates"
  ON public.quote_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = quote_templates.supplier_company_id
    )
  );

-- Indexes
CREATE INDEX idx_quote_templates_supplier ON public.quote_templates(supplier_company_id);
CREATE INDEX idx_quote_templates_category ON public.quote_templates(product_category);
CREATE INDEX idx_quote_templates_default ON public.quote_templates(supplier_company_id, is_default) WHERE is_default = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_quote_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_templates_timestamp
  BEFORE UPDATE ON public.quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_templates_timestamp();

-- Comment
COMMENT ON TABLE public.quote_templates IS 
'Reusable quote templates for suppliers. Allows one-click quote submission with pre-saved pricing and terms.';

-- ============================================================================
-- RFQ QUALITY SCORING & ANTI-SPAM
-- Date: 2026-02-19
-- Purpose: Prevent fake RFQs and low-quality quotes
-- ============================================================================

-- RFQ Posting Limits (prevent spam)
CREATE TABLE IF NOT EXISTS public.rfq_posting_limits (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Daily Limits
  rfqs_posted_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Lifetime Stats
  total_rfqs_posted INTEGER DEFAULT 0,
  total_rfqs_with_quotes INTEGER DEFAULT 0,
  total_rfqs_completed INTEGER DEFAULT 0,
  
  -- Quality Score (0-100)
  rfq_quality_score INTEGER DEFAULT 50 CHECK (rfq_quality_score >= 0 AND rfq_quality_score <= 100),
  
  -- Flags
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rfq_posting_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own limits
CREATE POLICY "Users can view own rfq limits"
  ON public.rfq_posting_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = rfq_posting_limits.company_id
    )
  );

-- Policy: System can manage all limits
CREATE POLICY "Service role can manage rfq limits"
  ON public.rfq_posting_limits FOR ALL
  USING (auth.role() = 'service_role');

-- Function: Check if user can post RFQ
CREATE OR REPLACE FUNCTION can_post_rfq(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_limits RECORD;
  v_daily_limit INTEGER;
  v_company RECORD;
BEGIN
  -- Get company verification status
  SELECT verified, verification_status, trust_score 
  INTO v_company
  FROM public.companies 
  WHERE id = p_company_id;
  
  -- Set daily limit based on verification
  v_daily_limit := CASE
    WHEN v_company.verified = true THEN 50 -- Verified = unlimited
    WHEN v_company.trust_score >= 70 THEN 20 -- High trust
    WHEN v_company.trust_score >= 50 THEN 10 -- Medium trust
    ELSE 5 -- Unverified = 5 per day
  END;
  
  -- Get or create limits record
  INSERT INTO public.rfq_posting_limits (company_id)
  VALUES (p_company_id)
  ON CONFLICT (company_id) DO NOTHING;
  
  SELECT * INTO v_limits
  FROM public.rfq_posting_limits
  WHERE company_id = p_company_id;
  
  -- Reset daily counter if new day
  IF v_limits.last_reset_date < CURRENT_DATE THEN
    UPDATE public.rfq_posting_limits
    SET rfqs_posted_today = 0,
        last_reset_date = CURRENT_DATE
    WHERE company_id = p_company_id;
    
    v_limits.rfqs_posted_today := 0;
  END IF;
  
  -- Check if blocked
  IF v_limits.is_blocked AND (v_limits.blocked_until IS NULL OR v_limits.blocked_until > NOW()) THEN
    RETURN jsonb_build_object(
      'can_post', false,
      'reason', 'blocked',
      'message', COALESCE(v_limits.blocked_reason, 'Your account is temporarily blocked from posting RFQs'),
      'blocked_until', v_limits.blocked_until
    );
  END IF;
  
  -- Check daily limit
  IF v_limits.rfqs_posted_today >= v_daily_limit THEN
    RETURN jsonb_build_object(
      'can_post', false,
      'reason', 'daily_limit',
      'message', format('You have reached your daily limit of %s RFQs. Try again tomorrow or verify your account for higher limits.', v_daily_limit),
      'limit', v_daily_limit,
      'posted_today', v_limits.rfqs_posted_today
    );
  END IF;
  
  -- Can post
  RETURN jsonb_build_object(
    'can_post', true,
    'remaining_today', v_daily_limit - v_limits.rfqs_posted_today,
    'daily_limit', v_daily_limit,
    'quality_score', v_limits.rfq_quality_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment RFQ count after posting
CREATE OR REPLACE FUNCTION increment_rfq_count(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.rfq_posting_limits
  SET 
    rfqs_posted_today = rfqs_posted_today + 1,
    total_rfqs_posted = total_rfqs_posted + 1,
    updated_at = NOW()
  WHERE company_id = p_company_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.rfq_posting_limits (company_id, rfqs_posted_today, total_rfqs_posted)
    VALUES (p_company_id, 1, 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_post_rfq(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_rfq_count(UUID) TO authenticated;

COMMENT ON FUNCTION can_post_rfq IS 'Check if company can post RFQ based on verification status and daily limits';
COMMENT ON FUNCTION increment_rfq_count IS 'Increment RFQ posting count after successful RFQ creation';
