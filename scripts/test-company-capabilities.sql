-- ============================================================================
-- PHASE 1 VERIFICATION: Test Company Capabilities System
-- ============================================================================
-- Run these queries as an authenticated user to verify the system works

-- 1. Verify table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'company_capabilities'
ORDER BY ordinal_position;

-- 2. Verify every company has a capabilities row
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  cc.can_buy,
  cc.can_sell,
  cc.can_logistics,
  cc.sell_status,
  cc.logistics_status,
  CASE 
    WHEN cc.company_id IS NULL THEN '❌ MISSING'
    ELSE '✅ OK'
  END AS status
FROM public.companies c
LEFT JOIN public.company_capabilities cc ON c.id = cc.company_id
ORDER BY c.created_at DESC;

-- 3. Test RLS: Try to read your own company's capabilities
-- (Run this as an authenticated user)
SELECT * FROM public.company_capabilities 
WHERE company_id = (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
);

-- 4. Test creating a new company triggers capabilities creation
-- (In your app, create a company and verify capabilities row is auto-created)

-- 5. Verify defaults are correct
SELECT 
  company_id,
  can_buy,
  can_sell,
  can_logistics,
  sell_status,
  logistics_status
FROM public.company_capabilities
WHERE can_buy != true 
   OR can_sell != false 
   OR can_logistics != false
   OR sell_status != 'disabled'
   OR logistics_status != 'disabled';

-- If this query returns 0 rows, all defaults are correct ✅

-- 6. Test updating capabilities (as company owner)
-- UPDATE public.company_capabilities
-- SET can_sell = true, sell_status = 'pending'
-- WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid());

-- Verify the update:
-- SELECT * FROM public.company_capabilities 
-- WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid());
