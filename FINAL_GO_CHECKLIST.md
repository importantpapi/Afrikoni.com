# 🟢 FINAL GO CHECKLIST

**Status**: READY TO GO  
**Date**: _______________  
**Follow this order - NO DEVIATION**

---

## 🔐 STEP 1: Apply the Migration (ONCE)

### Action
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of: `supabase/migrations/20250116000000_extend_quotes_table.sql`
3. Paste into SQL Editor
4. Click **"Run"**

### Expected Result
```
Success. No rows returned.
```

### ✅ Checkpoint
- [ ] Migration executed
- [ ] Message: "Success. No rows returned."
- [ ] No error messages

**If you don't see "Success. No rows returned." → STOP and fix before proceeding.**

---

## 🔐 STEP 2: Run Verification Queries (BOTH MUST RETURN 1)

### Query 1: Check Columns
```sql
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('incoterms', 'moq', 'status');
```

**Expected Result**: `3` (one row with count = 3)

### Query 2: Check Trigger
```sql
SELECT COUNT(*) 
FROM information_schema.triggers 
WHERE event_object_table = 'quotes' 
AND trigger_name = 'trg_prevent_quote_edit';
```

**Expected Result**: `1` (one row with count = 1)

### ✅ Checkpoint
- [ ] Query 1 returns: `3`
- [ ] Query 2 returns: `1`

**If either ≠ expected value → STOP. Do not proceed.**

---

## 🔐 STEP 3: Smoke Test (MANDATORY - 10 minutes)

**Do all 6. No skipping.**

### Test 1: Submit RFQ as Buyer
- [ ] Navigate to `/rfq/create`
- [ ] Complete all 3 steps
- [ ] Submit RFQ
- [ ] See confirmation screen with RFQ ID
- **Result**: [ ] PASS [ ] FAIL

### Test 2: Review RFQ as Admin
- [ ] Navigate to `/dashboard/admin/rfq-review`
- [ ] Find test RFQ in list
- [ ] Click "Review"
- [ ] Verify all details visible
- **Result**: [ ] PASS [ ] FAIL

### Test 3: Match Supplier
- [ ] In admin review, add internal notes
- [ ] Select confidence score
- [ ] Select suppliers from shortlist
- [ ] Click "Approve & Match Suppliers"
- [ ] RFQ status changes to `matched`
- **Result**: [ ] PASS [ ] FAIL

### Test 4: Submit Quote as Supplier
- [ ] Log in as matched supplier
- [ ] View RFQ in matched RFQs
- [ ] Click "Submit Quote"
- [ ] Fill form (unit price, currency, incoterms, lead time, MOQ, notes)
- [ ] Check confirmation checkbox
- [ ] Submit quote
- [ ] Quote appears in list
- **Result**: [ ] PASS [ ] FAIL

### Test 5: Confirm Quote Locks
- [ ] As supplier, try to edit submitted quote
- [ ] Verify quote cannot be edited
- [ ] Check quote status = `quote_submitted`
- **Result**: [ ] PASS [ ] FAIL

### Test 6: Confirm Notifications Fire
- [ ] Check buyer received notification after RFQ submission
- [ ] Check buyer received notification after admin approval
- [ ] Verify notifications in database
- **Result**: [ ] PASS [ ] FAIL

### ✅ Checkpoint
- [ ] All 6 tests completed
- [ ] All 6 tests PASSED

**If one fails → Fix only that, nothing else. Then retest that one test.**

---

## 🔐 STEP 4: Deploy

### Action
1. Deploy frontend to production (Vercel/hosting)
2. Verify environment variables set
3. Test production URL

### ✅ Checkpoint
- [ ] Frontend deployed
- [ ] Production URL accessible
- [ ] No console errors

**Once smoke test passes → Deploy. Do nothing else.**

---

## 🎯 FINAL STATUS

- [ ] Step 1: Migration applied ✅
- [ ] Step 2: Verification queries passed ✅
- [ ] Step 3: All 6 smoke tests passed ✅
- [ ] Step 4: Frontend deployed ✅

**If all checked → YOU ARE LIVE** 🚀

---

## 🧊 WHAT TO FREEZE (IMPORTANT)

**Do not add:**
- ❌ Chat
- ❌ Escrow
- ❌ Auto-matching
- ❌ Negotiation logic
- ❌ More pricing rules

**You now switch from building to observing.**

---

## 📊 NEXT 7 DAYS (NON-TECH)

1. Manually source 5 real buyers
2. Personally guide them to submit RFQs
3. Manually review + match suppliers
4. Observe:
   - Where buyers hesitate
   - Where suppliers ask questions
   - What admins do repeatedly

**That data > any feature request.**

---

*Follow this checklist exactly. No shortcuts. No skipping steps.*

