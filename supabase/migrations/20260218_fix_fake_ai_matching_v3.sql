-- ============================================================================
-- AI MATCHING ENGINE (V3 - FIX COLUMN NAME)
-- Date: 2026-02-18
-- Fix: Changed c.name to c.company_name based on schema verification.
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
    c.company_name, -- FIXED: Was c.name
    c.description,
    c.country,
    c.city,
    c.logo_url,
    c.verified,
    (
      CASE 
        WHEN c.company_name ILIKE '%' || search_term || '%' THEN 0.95
        WHEN c.description ILIKE '%' || search_term || '%' THEN 0.70
        ELSE 0.10
      END
    )::FLOAT as score,
    CASE 
        WHEN c.company_name ILIKE '%' || search_term || '%' THEN 'Direct match on company name'
        WHEN c.description ILIKE '%' || search_term || '%' THEN 'Match found in company description'
        ELSE 'Potential capability match'
    END as reason
  FROM companies c
  JOIN company_capabilities cc ON c.id = cc.company_id
  WHERE 
    cc.can_sell = true 
    AND cc.sell_status = 'approved'
    AND (
      c.company_name ILIKE '%' || search_term || '%' 
      OR c.description ILIKE '%' || search_term || '%'
    )
  ORDER BY score DESC
  LIMIT match_limit;
END;
$$;
