-- ============================================================================
-- AI MATCHING ENGINE (V1 - SERVER SIDE)
-- Date: 2026-02-18
-- Purpose: Move AI matching logic from client-side (crash risk) to server-side (scalable).
--          Currently uses SQL pattern matching. Ready for pgvector upgrade.
-- ============================================================================

CREATE OR REPLACE FUNCTION match_suppliers(
  requirements TEXT,
  match_limit INT DEFAULT 5
)
RETURNS TABLE (
  supplier_id UUID,
  company_name TEXT,
  description TEXT,
  country TEXT,
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
  -- Normalize search term (simple trimming)
  search_term := TRIM(requirements);
  
  -- Return results based on keyword matching against Company Name and Description
  -- This replaces the dangerous client-side .filter()
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.country,
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
    -- 1. Must be an approved seller
    cc.can_sell = true 
    AND cc.sell_status = 'approved'
    -- 2. Must match keywords
    AND (
      c.name ILIKE '%' || search_term || '%' 
      OR c.description ILIKE '%' || search_term || '%'
    )
  ORDER BY score DESC
  LIMIT match_limit;
END;
$$;

COMMENT ON FUNCTION match_suppliers IS 'Performs server-side supplier matching to prevent client-side scalability issues. Current implementation: Keyword Search.';
