-- Trust Infrastructure Migration
-- Created: 2026-02-11

-- 1. Trust Scores Table
CREATE TABLE IF NOT EXISTS public.trust_scores (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
    
    -- Component Scores
    verification_score INTEGER DEFAULT 0,
    history_score INTEGER DEFAULT 0,
    network_score INTEGER DEFAULT 0,
    
    -- Metadata
    level TEXT DEFAULT 'unrated', -- unrated, silver, gold, platinum
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Factors (JSON for breakdown)
    factors JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Corridor Reliability Table
CREATE TABLE IF NOT EXISTS public.corridor_reliability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_country TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    product_category TEXT, -- Optional (NULL = general corridor score)
    
    reliability_score INTEGER DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    avg_transit_days INTEGER,
    customs_delay_risk TEXT CHECK (customs_delay_risk IN ('low', 'medium', 'high')),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate corridor entries for same category
    UNIQUE(origin_country, destination_country, product_category)
);

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_reliability ENABLE ROW LEVEL SECURITY;

-- Trust Scores: Readable by everyone (public profile info)
CREATE POLICY "Trust scores are viewable by everyone" 
ON public.trust_scores FOR SELECT 
USING (true);

-- Trust Scores: Only editable by service role (or admin functions)
-- We'll allow authenticated users to insert their own initial record if needed, 
-- but generally this should be system-managed. 
-- For now, open read, restricted write.

-- Corridor Reliability: Readable by authenticated users
CREATE POLICY "Corridor reliability viewable by authenticated users" 
ON public.corridor_reliability FOR SELECT 
TO authenticated 
USING (true);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.corridor_reliability;

-- 5. Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_scores_modtime
    BEFORE UPDATE ON public.trust_scores
    FOR EACH ROW EXECUTE FUNCTION update_trust_updated_at();

CREATE TRIGGER update_corridor_reliability_modtime
    BEFORE UPDATE ON public.corridor_reliability
    FOR EACH ROW EXECUTE FUNCTION update_trust_updated_at();
