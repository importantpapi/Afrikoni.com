-- ============================================================================
-- AI MATCHING ENGINE (V2 - ENHANCED RETURN)
-- Date: 2026-02-18
-- Purpose: Add UI fields (logo, city, verified) to the RPC return type.
-- ============================================================================

DROP FUNCTION IF EXISTS match_suppliers(text, int);

CREATE OR REPLACE FUNCTION match_suppliers(
  requirements TEXT,
  match_limit INT DEFAULT 5
)
RETURNS TABLE (
  supplier_id UUID,
  company_name TEXT,
  description TEXT,
  country TEXT,
  city TEXT,
  logo_url TEXT,
  verified BOOLEAN,
  match_score FLOAT,
  reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_term TEXT;
BEGIN
  -- Normalize search term
  search_term := TRIM(requirements);
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.country,
    c.city,
    c.logo_url,
    c.verified, -- Assuming 'verified' column exists on companies, or handle via capabilities
    (
      CASE 
        WHEN c.name ILIKE '%' || search_term || '%' THEN 0.95
        WHEN c.description ILIKE '%' || search_term || '%' THEN 0.70
        ELSE 0.10
      END
    )::FLOAT as score,
    CASE 
        WHEN c.name ILIKE '%' || search_term || '%' THEN 'Direct match on company name'
        WHEN c.description ILIKE '%' || search_term || '%' THEN 'Match found in company description'
        ELSE 'Potential capability match'
    END as reason
  FROM companies c
  JOIN company_capabilities cc ON c.id = cc.company_id
  WHERE 
    cc.can_sell = true 
    AND cc.sell_status = 'approved'
    AND (
      c.name ILIKE '%' || search_term || '%' 
      OR c.description ILIKE '%' || search_term || '%'
    )
  ORDER BY score DESC
  LIMIT match_limit;
END;
$$;
