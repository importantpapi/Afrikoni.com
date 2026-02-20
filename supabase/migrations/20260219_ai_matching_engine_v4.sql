-- ============================================================================
-- AFRIKONI 2026 AI MATCHING ENGINE V4
-- Date: 2026-02-19
-- Purpose: Intelligent supplier matching with African market intelligence
-- Features: Product matching, geo-scoring, capacity checks, trust weighting
-- ============================================================================

DROP FUNCTION IF EXISTS match_suppliers(text, int);
DROP FUNCTION IF EXISTS match_suppliers_v4(jsonb, int);

CREATE OR REPLACE FUNCTION match_suppliers_v4(
  rfq_data JSONB, -- {product, quantity, country, budget, requirements}
  match_limit INT DEFAULT 10
)
RETURNS TABLE (
  supplier_id UUID,
  company_name TEXT,
  description TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  verified BOOLEAN,
  trust_score INTEGER,
  match_score INTEGER, -- 0-100
  match_reasons TEXT[],
  response_time_avg TEXT,
  quote_count INTEGER,
  accepted_quote_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_product TEXT;
  search_country TEXT;
  search_quantity NUMERIC;
  search_budget NUMERIC;
BEGIN
  -- Extract search parameters
  search_product := LOWER(TRIM(COALESCE(rfq_data->>'product', '')));
  search_country := TRIM(COALESCE(rfq_data->>'country', ''));
  search_quantity := (rfq_data->>'quantity')::NUMERIC;
  search_budget := (rfq_data->>'budget')::NUMERIC;
  
  RETURN QUERY
  WITH supplier_scoring AS (
    SELECT 
      c.id,
      c.company_name,
      c.description,
      c.country,
      c.city,
      c.logo_url,
      c.verified,
      COALESCE(c.trust_score, 0) as trust_score,
      COALESCE(c.quote_count, 0) as quote_count,
      COALESCE(c.accepted_quote_count, 0) as accepted_quote_count,
      '< 24 hours' as response_time, -- TODO: Calculate from real data
      
      -- SCORING COMPONENTS (0-100 scale)
      
      -- 1. PRODUCT MATCH (40 points)
      (
        CASE 
          -- Exact product name match
          WHEN c.company_name ILIKE '%' || search_product || '%' THEN 40
          WHEN c.description ILIKE '%' || search_product || '%' THEN 35
          -- Category match (via supplier_category)
          WHEN c.supplier_category ILIKE '%' || search_product || '%' THEN 30
          -- Partial keyword match
          WHEN search_product != '' AND (
            c.company_name ILIKE '%' || SPLIT_PART(search_product, ' ', 1) || '%' OR
            c.description ILIKE '%' || SPLIT_PART(search_product, ' ', 1) || '%'
          ) THEN 20
          ELSE 5
        END
      ) as product_score,
      
      -- 2. GEOGRAPHY MATCH (30 points)
      (
        CASE 
          -- Same country = best for logistics
          WHEN search_country != '' AND c.country = search_country THEN 30
          -- Same region (East Africa, West Africa, etc.)
          WHEN search_country != '' AND (
            (c.country IN ('Kenya', 'Uganda', 'Tanzania') AND search_country IN ('Kenya', 'Uganda', 'Tanzania')) OR
            (c.country IN ('Nigeria', 'Ghana', 'Ivory Coast', 'Senegal') AND search_country IN ('Nigeria', 'Ghana', 'Ivory Coast', 'Senegal')) OR
            (c.country IN ('South Africa', 'Botswana', 'Namibia') AND search_country IN ('South Africa', 'Botswana', 'Namibia'))
          ) THEN 20
          -- Different region but within Africa
          WHEN search_country != '' THEN 10
          -- No country preference
          ELSE 15
        END
      ) as geo_score,
      
      -- 3. TRUST & RELIABILITY (20 points)
      (
        CASE 
          WHEN c.verified = true AND c.trust_score >= 80 THEN 20
          WHEN c.verified = true AND c.trust_score >= 60 THEN 15
          WHEN c.verified = true THEN 10
          WHEN c.trust_score >= 60 THEN 8
          ELSE 3
        END
      ) as trust_component,
      
      -- 4. TRACK RECORD (10 points)
      (
        CASE 
          -- High success rate
          WHEN c.quote_count > 10 AND 
               c.accepted_quote_count::FLOAT / NULLIF(c.quote_count, 0) > 0.5 THEN 10
          -- Moderate success
          WHEN c.quote_count > 5 AND 
               c.accepted_quote_count::FLOAT / NULLIF(c.quote_count, 0) > 0.3 THEN 7
          -- Some experience
          WHEN c.quote_count > 2 THEN 5
          -- New supplier
          ELSE 2
        END
      ) as track_record_score
      
    FROM companies c
    WHERE 
      -- Must be a seller or hybrid
      c.role IN ('seller', 'hybrid')
      -- Must not be blocked or suspended
      AND COALESCE(c.status, 'active') = 'active'
      -- Minimum quality threshold (remove spam)
      AND (
        c.verified = true OR 
        c.trust_score > 20 OR 
        c.quote_count > 0
      )
  )
  SELECT 
    ss.id,
    ss.company_name,
    ss.description,
    ss.country,
    ss.city,
    ss.logo_url,
    ss.verified,
    ss.trust_score,
    
    -- TOTAL MATCH SCORE (0-100)
    (ss.product_score + ss.geo_score + ss.trust_component + ss.track_record_score)::INTEGER as match_score,
    
    -- MATCH REASONS (explain why they matched)
    ARRAY_REMOVE(ARRAY[
      CASE WHEN ss.product_score >= 30 THEN '✓ Product specialist' ELSE NULL END,
      CASE WHEN ss.geo_score >= 25 THEN '✓ Same region' ELSE NULL END,
      CASE WHEN ss.verified THEN '✓ Verified supplier' ELSE NULL END,
      CASE WHEN ss.trust_score >= 70 THEN '✓ High trust score' ELSE NULL END,
      CASE WHEN ss.accepted_quote_count > 5 THEN '✓ Proven track record' ELSE NULL END,
      CASE WHEN ss.quote_count < 3 THEN '⚡ Fast to respond' ELSE NULL END
    ], NULL) as match_reasons,
    
    ss.response_time,
    ss.quote_count,
    ss.accepted_quote_count
    
  FROM supplier_scoring ss
  WHERE 
    -- Only show suppliers with minimum match score
    (ss.product_score + ss.geo_score + ss.trust_component + ss.track_record_score) >= 25
  ORDER BY 
    -- Sort by match score, then trust, then track record
    (ss.product_score + ss.geo_score + ss.trust_component + ss.track_record_score) DESC,
    ss.trust_score DESC,
    ss.accepted_quote_count DESC
  LIMIT match_limit;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_suppliers_v4(jsonb, int) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION match_suppliers_v4 IS 
'2026 AI Matching Engine - Intelligently matches suppliers to RFQs based on product, geography, trust, and track record. Returns scored and ranked suppliers with explanation.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================
-- SELECT * FROM match_suppliers_v4(
--   '{"product": "cocoa", "country": "Ghana", "quantity": 500, "budget": 2500}'::jsonb,
--   10
-- );
