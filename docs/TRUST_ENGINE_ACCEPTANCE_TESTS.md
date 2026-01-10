# 🧪 TRUST ENGINE — ACCEPTANCE TESTS

**Run these tests before production deployment**

---

## ✅ PHASE A: SUPPLIER LISTINGS

### Test 1: New Supplier Visibility

**Setup:**
1. Create a new supplier with `trust_score = NULL`
2. Navigate to `/suppliers`

**Expected:**
- ✅ Supplier appears in the list
- ✅ Supplier is near the bottom (low rank)
- ✅ NO "Recommended" badge shown
- ✅ No errors in console

**SQL to verify:**
```sql
SELECT company_name, trust_score, rank_score 
FROM companies 
WHERE trust_score IS NULL;
```

---

### Test 2: Recommended Badge

**Setup:**
1. Ensure at least one supplier has `trust_score >= 75`
2. Navigate to `/suppliers`

**Expected:**
- ✅ Supplier appears in top 6
- ✅ "Recommended" badge visible
- ✅ Hover shows tooltip: "Recommended based on verified trade history, relevance, and responsiveness."
- ✅ Badge has gold gradient background

**SQL to verify:**
```sql
SELECT company_name, trust_score, approved_reviews_count
FROM companies 
WHERE trust_score >= 75 OR approved_reviews_count >= 3
ORDER BY trust_score DESC;
```

---

### Test 3: Ranking Order

**Setup:**
1. Clear browser cache
2. Navigate to `/suppliers`
3. Note the order of suppliers

**Expected:**
- ✅ Suppliers sorted by rank score (highest first)
- ✅ Verified suppliers generally higher than unverified
- ✅ Suppliers with reviews generally higher than no reviews
- ✅ Order makes intuitive sense

**Manual check:**
- Compare first 3 suppliers' trust scores
- They should be descending or roughly equal

---

### Test 4: RPC Failure Handling

**Setup:**
1. Temporarily break the `calculate_supplier_rank_score` function:
```sql
-- Run this to simulate failure
DROP FUNCTION IF EXISTS calculate_supplier_rank_score;
```

2. Navigate to `/suppliers`

**Expected:**
- ✅ Suppliers still load
- ✅ Fallback to basic trust score sorting
- ✅ NO error shown to user
- ✅ Warning in console (acceptable)

**Cleanup:**
```sql
-- Restore the function from migration
-- (Re-run trust score migration)
```

---

### Test 5: Empty State

**Setup:**
1. Filter suppliers to a country with 0 results
2. Or search for a non-existent supplier name

**Expected:**
- ✅ "No suppliers found" message shown
- ✅ No loading spinner stuck
- ✅ No errors in console

---

## 🛡️ ADMIN DASHBOARD

### Test 6: Admin Trust Dashboard Access

**Setup:**
1. Log in as admin
2. Navigate to `/dashboard/admin/trust-engine`

**Expected:**
- ✅ Dashboard loads
- ✅ Shows list of suppliers with:
  - Trust score (0-100)
  - Rank score (0-100)
  - Tier (A/B/C)
  - Review count
  - Verification status
- ✅ Search works
- ✅ Filtering works

---

### Test 7: Non-Admin Access Blocked

**Setup:**
1. Log in as buyer or seller (not admin)
2. Try to navigate to `/dashboard/admin/trust-engine`

**Expected:**
- ✅ Redirected or access denied
- ✅ "Admin access required" message

---

## 🔒 SECURITY

### Test 8: Trust Scores Not Exposed to Buyers

**Setup:**
1. Log in as buyer
2. Inspect network requests on `/suppliers`
3. Check API response payload

**Expected:**
- ✅ `trust_score` NOT in buyer API response
- ✅ `rank_score` NOT in buyer API response
- ✅ `tier` NOT in buyer API response
- ✅ Only public fields visible (name, country, verified, etc.)

---

### Test 9: RLS Policies Active

**Setup:**
1. As buyer, try to query `companies.trust_score` directly
```sql
-- Run in Supabase SQL editor as buyer role
SELECT trust_score FROM companies WHERE id = '<any-supplier-id>';
```

**Expected:**
- ✅ Query fails or returns NULL
- ✅ RLS policy blocks access

---

## 🧊 PHASE B: RFQ MATCHING (DORMANT)

### Test 10: Admin Can See Match Scores

**Setup:**
1. Log in as admin
2. Navigate to `/dashboard/admin/rfq-matching`
3. Select an RFQ

**Expected:**
- ✅ Suggested suppliers shown
- ✅ Match scores visible (admin-only)
- ✅ Tiers (A/B/C) visible
- ✅ Manual reordering allowed

---

### Test 11: Buyers Cannot See Match Scores

**Setup:**
1. Log in as buyer
2. View any RFQ detail page

**Expected:**
- ✅ NO match scores visible
- ✅ NO tiers visible
- ✅ Suppliers shown in default order (not trust-ranked yet)

---

## ⏸️ PHASE C: DEAL PRIORITIZATION (INACTIVE)

### Test 12: Hook Exists But Not Integrated

**Setup:**
1. Check if `useDealPrioritization` hook exists
2. Search codebase for usage

**Expected:**
- ✅ Hook file exists at `/src/hooks/useDealPrioritization.js`
- ✅ NOT imported in any admin pages yet
- ✅ NOT used in deal queue

---

## 📊 PERFORMANCE

### Test 13: Load Time with 100 Suppliers

**Setup:**
1. Ensure database has 100+ suppliers
2. Navigate to `/suppliers`
3. Measure page load time

**Expected:**
- ✅ Page loads in < 2 seconds
- ✅ No UI jank or stuttering
- ✅ Smooth scrolling

**Tools:**
- Chrome DevTools → Network tab
- Lighthouse performance audit

---

### Test 14: RPC Timeout Handling

**Setup:**
1. Simulate slow RPC response (add `pg_sleep(5)` in function)
2. Navigate to `/suppliers`

**Expected:**
- ✅ Timeout after 3-5 seconds
- ✅ Fallback to basic sorting
- ✅ User doesn't see loading spinner forever

---

## 🧪 EDGE CASES

### Test 15: Supplier with Zero Reviews

**Setup:**
1. Create supplier with `approved_reviews_count = 0`
2. Set `trust_score = 50`

**Expected:**
- ✅ Appears in middle of list
- ✅ NO "Recommended" badge
- ✅ No errors

---

### Test 16: Supplier with High Reviews, Low Trust

**Setup:**
1. Create supplier with:
   - `approved_reviews_count = 10`
   - `trust_score = 30` (simulating old reviews, recent issues)

**Expected:**
- ✅ Trust score takes priority over review count
- ✅ Ranked lower despite many reviews
- ✅ NO "Recommended" badge

---

### Test 17: All Suppliers Have Same Trust Score

**Setup:**
1. Set all suppliers to `trust_score = 50`
2. Navigate to `/suppliers`

**Expected:**
- ✅ Fallback to secondary sort (e.g., verified status, alphabetical)
- ✅ No errors
- ✅ Predictable, stable order

---

## 📝 AUDIT & LOGGING

### Test 18: Decision Audit Log

**Setup:**
1. Check if `decision_audit_log` table exists
2. Perform ranking operation
3. Query audit log

**Expected:**
- ✅ Audit log entry created
- ✅ Includes: decision_type, entity_id, score, factors
- ✅ Timestamp accurate

**SQL to verify:**
```sql
SELECT * FROM decision_audit_log 
WHERE decision_type = 'ranking' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ ACCEPTANCE CRITERIA SUMMARY

| Test # | Category | Must Pass |
|--------|----------|-----------|
| 1 | Supplier Visibility | ✅ |
| 2 | Recommended Badge | ✅ |
| 3 | Ranking Order | ✅ |
| 4 | RPC Failure | ✅ |
| 5 | Empty State | ✅ |
| 6 | Admin Dashboard | ✅ |
| 7 | Non-Admin Block | ✅ |
| 8 | Buyer Privacy | ✅ |
| 9 | RLS Policies | ✅ |
| 10 | Admin Match Scores | ⚠️ (Phase B) |
| 11 | Buyer Match Privacy | ⚠️ (Phase B) |
| 12 | Deal Hook Dormant | ⚠️ (Phase C) |
| 13 | Performance | ✅ |
| 14 | Timeout Handling | ✅ |
| 15-17 | Edge Cases | ✅ |
| 18 | Audit Logging | ✅ |

**Minimum to deploy:** Tests 1-9, 13-14, 15-17, 18 must pass.

---

## 🚨 ROLLBACK TRIGGER CONDITIONS

If any of these occur during testing, DO NOT DEPLOY:

1. ❌ Supplier listings fail to load
2. ❌ New suppliers completely hidden
3. ❌ Buyer can see trust scores in API response
4. ❌ Non-admin can access trust dashboard
5. ❌ Page load time > 5 seconds
6. ❌ Console shows critical errors

---

## 📋 TEST EXECUTION LOG

| Test | Date | Tester | Result | Notes |
|------|------|--------|--------|-------|
| 1 | ___ | ___ | ☐ Pass ☐ Fail | |
| 2 | ___ | ___ | ☐ Pass ☐ Fail | |
| 3 | ___ | ___ | ☐ Pass ☐ Fail | |
| 4 | ___ | ___ | ☐ Pass ☐ Fail | |
| 5 | ___ | ___ | ☐ Pass ☐ Fail | |
| 6 | ___ | ___ | ☐ Pass ☐ Fail | |
| 7 | ___ | ___ | ☐ Pass ☐ Fail | |
| 8 | ___ | ___ | ☐ Pass ☐ Fail | |
| 9 | ___ | ___ | ☐ Pass ☐ Fail | |
| 13 | ___ | ___ | ☐ Pass ☐ Fail | |
| 14 | ___ | ___ | ☐ Pass ☐ Fail | |
| 15 | ___ | ___ | ☐ Pass ☐ Fail | |
| 16 | ___ | ___ | ☐ Pass ☐ Fail | |
| 17 | ___ | ___ | ☐ Pass ☐ Fail | |
| 18 | ___ | ___ | ☐ Pass ☐ Fail | |

---

**Sign-Off:**

- [ ] All critical tests passed
- [ ] No rollback conditions triggered
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Team trained

**Approved by:** ___________________  
**Date:** ___________________

