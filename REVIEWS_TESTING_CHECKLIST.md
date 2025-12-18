# 🧪 REVIEWS & TRUST SYSTEM - TESTING CHECKLIST

**Before deploying to production, complete all 7 tests below.**

---

## ✅ TEST 1: Buyer tries to review a non-completed order → BLOCKED

**Expected Behavior:** Review button should NOT appear

**Steps:**
1. Log in as a **buyer**
2. Go to `Dashboard → Orders`
3. Find an order with status = `pending`, `processing`, `shipped`, or `delivered`
4. Check the Actions column

**✅ PASS Criteria:**
- No "⭐ Review" button visible for non-completed orders
- Only "View" and "Reorder" buttons appear

**❌ FAIL If:**
- Review button appears for non-completed orders
- User can somehow access review modal

**Fix Location:** `src/pages/dashboard/orders.jsx` (line ~347)

---

## ✅ TEST 2: Buyer reviews a completed order → Review created as pending

**Expected Behavior:** Review submits successfully with status = 'pending'

**Steps:**
1. Log in as a **buyer**
2. Mark one of your orders as `status = 'completed'` (use DB or admin panel)
3. Go to `Dashboard → Orders`
4. Click "⭐ Review" button on the completed order
5. Fill out:
   - Rating: 4 stars
   - Comment: "Great service, fast shipping!"
   - Tags: Select "Communication" and "Delivery"
6. Click "Submit Review"

**✅ PASS Criteria:**
- Modal opens successfully
- Form submits without errors
- Success message: "Review submitted! It will be visible after admin approval."
- Modal closes
- Order Actions column now shows "Review Pending" badge
- **Check Database:**
  ```sql
  SELECT * FROM reviews WHERE order_id = '[order-id]';
  -- Should show: status = 'pending', rating = 4, comment filled
  ```

**❌ FAIL If:**
- Error on submission
- Review created with status = 'approved' (should be pending!)
- No badge appears after submission

**Fix Location:** `src/components/reviews/LeaveReviewModal.jsx`

---

## ✅ TEST 3: Buyer tries to submit a second review for same order → BLOCKED

**Expected Behavior:** Duplicate review attempt rejected

**Steps:**
1. Use the same buyer account from Test 2
2. Try to click "Review" on the same order again
3. (Button shouldn't even be there, but if you bypass UI and submit via API)

**✅ PASS Criteria:**
- "⭐ Review" button is gone (replaced with "Review Pending" or "Reviewed" badge)
- If somehow submitted via API → Database constraint error: `one_review_per_order`
- Error message: "You have already reviewed this order"

**❌ FAIL If:**
- Second review is created in database
- No duplicate prevention

**Fix Location:** 
- UI: `src/pages/dashboard/orders.jsx`
- DB: `reviews` table constraint (already set)

---

## ✅ TEST 4: Seller tries to create a review → BLOCKED BY RLS

**Expected Behavior:** RLS policy prevents sellers from creating reviews

**Steps:**
1. Log in as a **seller**
2. Go to `Dashboard → Orders` (if sellers can see orders)
3. Try to manually insert a review via Supabase client:
   ```javascript
   await supabase.from('reviews').insert({
     order_id: '[some-order-id]',
     buyer_company_id: '[buyer-company-id]',
     seller_company_id: '[your-company-id]',
     rating: 5,
     status: 'pending'
   });
   ```

**✅ PASS Criteria:**
- Insert fails with RLS policy error
- OR: UI doesn't even show review buttons for sellers
- Error message related to permissions

**❌ FAIL If:**
- Seller can create a review
- Seller can see review buttons

**Fix Location:** Database RLS policies (already implemented)

---

## ✅ TEST 5: Admin approves review → Appears everywhere + trust score updates

**Expected Behavior:** Approval triggers all downstream updates

**Steps:**
1. Log in as **admin**
2. Go to `Dashboard → Admin → Reviews Moderation`
3. Find the pending review from Test 2
4. Click "✅ Approve"
5. Confirm the action

**✅ PASS Criteria:**

**A. Review Status Changed:**
```sql
SELECT status, approved_at, approved_by FROM reviews WHERE id = '[review-id]';
-- Should show: status = 'approved', approved_at = [timestamp], approved_by = [admin-id]
```

**B. Trust Score Updated:**
```sql
SELECT trust_score, average_rating, approved_reviews_count, last_trust_score_update 
FROM companies WHERE id = '[seller-company-id]';
-- Should show updated values, not the defaults
```

**C. Appears on Public Profile:**
- Navigate to `/business/[seller-company-id]`
- Go to "Reviews" tab
- Approved review is visible with "Verified Order" badge

**D. Appears on Seller Dashboard:**
- Log in as the seller
- Go to `Dashboard → Trust & Reviews`
- Review appears in the list
- Trust score reflects the new review

**E. Success Toast:**
- Admin sees: "Review approved! Trust score updated."

**❌ FAIL If:**
- Status doesn't change to 'approved'
- Trust score stays at 50 (default)
- Review doesn't appear on public profile
- Review doesn't appear in seller dashboard
- `approved_at` or `approved_by` is NULL

**Fix Location:** 
- DB trigger: `on_review_status_change()`
- Function: `update_company_trust_metrics()`

---

## ✅ TEST 6: Admin rejects review → Never appears + no trust change

**Expected Behavior:** Rejection keeps review hidden permanently

**Steps:**
1. Create another review (repeat Test 2 with different order)
2. Log in as **admin**
3. Go to `Dashboard → Admin → Reviews Moderation`
4. Find the new pending review
5. Click "❌ Reject"
6. (Optional) Enter rejection reason
7. Confirm

**✅ PASS Criteria:**

**A. Review Status Changed:**
```sql
SELECT status FROM reviews WHERE id = '[review-id]';
-- Should show: status = 'rejected'
```

**B. Trust Score UNCHANGED:**
```sql
SELECT trust_score, approved_reviews_count FROM companies WHERE id = '[seller-company-id]';
-- Should match values from before this test (no change)
```

**C. NOT on Public Profile:**
- Visit `/business/[seller-company-id]`
- Rejected review is NOT visible

**D. NOT on Seller Dashboard:**
- Log in as seller
- Go to `Dashboard → Trust & Reviews`
- Rejected review is NOT in the list

**E. Success Toast:**
- Admin sees: "Review rejected"

**❌ FAIL If:**
- Review becomes visible anywhere
- Trust score changes
- Approved reviews count increases

**Fix Location:** `src/pages/dashboard/admin/reviews-moderation.jsx`

---

## ✅ TEST 7: Buyer tries to edit review after submit → BLOCKED

**Expected Behavior:** Reviews are immutable after creation

**Steps:**
1. Use a review from Test 2 (pending status)
2. Try to edit via UI (there should be no edit button)
3. Try to update via Supabase client:
   ```javascript
   await supabase.from('reviews')
     .update({ rating: 5, comment: 'Updated comment' })
     .eq('id', '[review-id]');
   ```

**✅ PASS Criteria:**
- No "Edit" button in UI
- Update via API blocked by RLS (no UPDATE policy exists)
- Error related to permissions

**❌ FAIL If:**
- Review can be edited
- Rating or comment changes after creation

**Fix Location:** Database RLS policies (no UPDATE policy = immutable)

---

## 📊 TESTING SUMMARY TABLE

| Test | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Non-completed order review blocked | ⬜ | Check UI logic |
| 2 | Completed order review creates pending | ⬜ | Check status in DB |
| 3 | Duplicate review blocked | ⬜ | Check constraint |
| 4 | Seller cannot create review | ⬜ | Test RLS |
| 5 | Approval updates everything | ⬜ | Most important! |
| 6 | Rejection keeps hidden | ⬜ | Check visibility |
| 7 | Reviews are immutable | ⬜ | Test edit block |

**All 7 tests must pass before production deployment.**

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Trust score not updating after approval
**Fix:** Check if trigger `trigger_review_status_change` exists and is enabled
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_review_status_change';
```

### Issue: Buyer can't submit review (permission error)
**Fix:** Check RLS policy "Buyers can create reviews for completed orders"
```sql
SELECT * FROM pg_policies WHERE tablename = 'reviews' AND policyname LIKE '%create%';
```

### Issue: Reviews showing before approval
**Fix:** Check WHERE clause in query - must filter `status = 'approved'`

### Issue: Review button showing for non-completed orders
**Fix:** Check condition in `orders.jsx`:
```javascript
const canReview = currentRole === 'buyer' && order.status === 'completed' && !reviewStatus;
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before going live:

- [ ] All 7 tests passed
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Routes added to `App.jsx`
- [ ] Sidebar navigation updated
- [ ] Admin panel accessible to admins only
- [ ] Sample test data cleaned from production DB
- [ ] Error logging configured
- [ ] Monitoring set up for review submissions

---

## 🎯 SUCCESS METRICS

After deployment, track:
- ✅ Reviews submission rate
- ✅ Admin approval time (target: <24 hours)
- ✅ Average trust score trend
- ✅ Reviews per completed deal ratio
- ✅ Zero duplicate reviews
- ✅ Zero unauthorized reviews

---

**Completion Date:** __________  
**Tested By:** __________  
**Deployed By:** __________  

✅ **SYSTEM READY FOR PRODUCTION**

