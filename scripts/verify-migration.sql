-- Verification Queries for Quotes Table Migration
-- Run these in Supabase SQL Editor after applying the migration

-- 1. Check if incoterms column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quotes' 
  AND column_name = 'incoterms';

-- 2. Check if moq column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quotes' 
  AND column_name = 'moq';

-- 3. Check status constraint
SELECT 
  constraint_name, 
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'quotes' 
  AND tc.constraint_name = 'quotes_status_check';

-- 4. Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'quotes' 
  AND trigger_name = 'trg_prevent_quote_edit';

-- 5. Check if function exists
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'prevent_quote_edit_after_submit';

-- Expected Results:
-- ✅ All 5 queries should return rows
-- ✅ incoterms: data_type = 'text', is_nullable = 'YES'
-- ✅ moq: data_type = 'integer', is_nullable = 'YES'
-- ✅ quotes_status_check: constraint exists with status values
-- ✅ trg_prevent_quote_edit: trigger exists
-- ✅ prevent_quote_edit_after_submit: function exists

