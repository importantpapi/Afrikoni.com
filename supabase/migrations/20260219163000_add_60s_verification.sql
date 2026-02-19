-- Create business_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.business_verifications (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'basic', 'trade', 'full', 'rejected')),
  progress int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  risk_score int DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  method text CHECK (method IN ('upload', 'link', 'manual')),
  ai_summary text,
  ai_fields jsonb DEFAULT '{}'::jsonb,
  evidence jsonb DEFAULT '{}'::jsonb,
  review_state text DEFAULT 'auto_pass' CHECK (review_state IN ('auto_pass', 'needs_review', 'manual_pass', 'manual_fail')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('started', 'extract_started', 'extract_done', 'basic_granted', 'trade_granted', 'rejected')),
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;

-- Policies for business_verifications

-- Policy 1: Users can view their own company's verification status
CREATE POLICY "Users can view their own company verification"
  ON public.business_verifications
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid() OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Policy 2: Users can NOT insert/update directly (must go through Edge Functions)
-- However, we might want to allow them to update specific fields if needed, but per requirements:
-- "only edge functions write sensitive columns"
-- So we won't add INSERT/UPDATE policies for authenticated users for now, relying on Service Role.
-- OR allow insert if company_id matches? No, `verify_start` handles creation.

-- Service Role policies (implicitly allowed to do everything, but explicit just in case if needed, usually not with RLS on)

-- Policies for verification_events

-- Policy 1: Users can view their own company's events
CREATE POLICY "Users can view their own company events"
  ON public.verification_events
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid() OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_verifications_status ON public.business_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verification_events_company_id ON public.verification_events(company_id);
