# 🚀 Migration Application Guide

**Migration**: `20250116000000_extend_quotes_table.sql`  
**Purpose**: Extend quotes table for structured RFQ quote submission

---

## Step 1: Apply Migration via Supabase Dashboard

### Instructions

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Afrikoni project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open: `supabase/migrations/20250116000000_extend_quotes_table.sql`
   - Copy **ALL** contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for execution to complete

5. **Verify Success**
   - Should see: "Success. No rows returned"
   - No error messages

---

## Step 2: Verify Migration Applied

### Option A: Run Verification Queries

1. In Supabase SQL Editor, open: `scripts/verify-migration.sql`
2. Copy and paste each query one by one
3. Run each query and verify results:

**Query 1: Check incoterms column**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quotes' 
  AND column_name = 'incoterms';
```
✅ **Expected**: Returns 1 row with `data_type = 'text'`

**Query 2: Check moq column**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quotes' 
  AND column_name = 'moq';
```
✅ **Expected**: Returns 1 row with `data_type = 'integer'`

**Query 3: Check status constraint**
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'quotes' 
  AND constraint_name = 'quotes_status_check';
```
✅ **Expected**: Returns 1 row with constraint

**Query 4: Check trigger**
```sql
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'quotes' 
  AND trigger_name = 'trg_prevent_quote_edit';
```
✅ **Expected**: Returns 1 row with trigger

**Query 5: Check function**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'prevent_quote_edit_after_submit';
```
✅ **Expected**: Returns 1 row with function

### Option B: Quick Visual Check

In Supabase Dashboard:
1. Go to **Table Editor** → `quotes` table
2. Check columns:
   - ✅ `incoterms` (text, nullable)
   - ✅ `moq` (integer, nullable)
   - ✅ `status` (text, with constraint)

---

## Step 3: Run Smoke Tests

After migration is verified:

1. Open: `scripts/smoke-test-checklist.md`
2. Follow all 6 test scenarios
3. Mark each test as Pass/Fail
4. Document any issues

**Critical Tests:**
- ✅ Submit RFQ as buyer
- ✅ Review RFQ as admin
- ✅ Match supplier
- ✅ Submit quote as supplier
- ✅ Confirm quote locks
- ✅ Confirm notifications fire

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Migration uses `IF NOT EXISTS`, so this is safe. Continue.

### Issue: Constraint already exists
**Solution**: Migration drops and recreates constraint. This is expected.

### Issue: Trigger creation fails
**Solution**: Check if function exists first. Migration creates function before trigger.

### Issue: "Permission denied"
**Solution**: Ensure you're using a user with admin privileges or service role key.

---

## Post-Migration Checklist

- [ ] Migration applied successfully
- [ ] All 5 verification queries pass
- [ ] Smoke tests completed (all 6 pass)
- [ ] Frontend deployed
- [ ] Ready for real RFQs

---

## Next Steps After Migration

1. **Deploy Frontend**
   - Deploy to Vercel/hosting
   - Verify environment variables set

2. **Run Smoke Tests**
   - Complete all 6 test scenarios
   - Document results

3. **Go Live**
   - Start sourcing real buyers
   - Manually guide first 5 RFQs
   - Observe and learn

---

**Status**: Ready to apply ✅

*Once migration is applied and verified, system is LIVE* 🚀

