-- Quick Verification Queries
-- Run these AFTER applying migration
-- Both must return the expected values

-- Query 1: Verify columns exist
-- Expected: Returns 3 (incoterms, moq, status)
SELECT COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'quotes' 
  AND column_name IN ('incoterms', 'moq', 'status');

-- Query 2: Verify trigger exists
-- Expected: Returns 1
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table = 'quotes' 
  AND trigger_name = 'trg_prevent_quote_edit';

-- If both queries return expected values → Migration successful ✅
-- If either returns 0 or unexpected value → Migration failed ❌

