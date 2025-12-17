# 🧪 RFQ System Smoke Test Checklist

**Date**: _______________  
**Tester**: _______________  
**Environment**: [ ] Development [ ] Production

---

## Pre-Test Setup
- [ ] Database migration applied successfully
- [ ] Frontend deployed
- [ ] Test buyer account created
- [ ] Test supplier account created
- [ ] Admin account ready

---

## Test 1: Submit RFQ as Buyer ✅

**Steps:**
1. Navigate to `/rfq/create`
2. Complete Step 1: Product Basics
   - [ ] Product name entered
   - [ ] Category selected
   - [ ] Quantity and unit entered
   - [ ] Delivery country selected
   - [ ] Timeline selected
3. Complete Step 2: Requirements & Budget
   - [ ] Specifications entered
   - [ ] Budget range (optional) entered
   - [ ] Certifications selected (optional)
   - [ ] Incoterms selected
4. Complete Step 3: Trust & Intent
   - [ ] Purchase type selected
   - [ ] Estimated order value selected
   - [ ] Company name entered
   - [ ] Buyer role selected
5. Submit RFQ
   - [ ] Confirmation screen appears
   - [ ] RFQ ID displayed
   - [ ] "What happens next" section visible

**Expected Result**: ✅ RFQ created with status `pending_review`

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Test 2: Review RFQ as Admin ✅

**Steps:**
1. Navigate to `/dashboard/admin/rfq-review`
2. Find the test RFQ in the list
   - [ ] RFQ appears in "Pending Review" filter
   - [ ] All details visible (product, buyer, delivery country, order value)
3. Click "Review" button
4. Verify RFQ Summary section
   - [ ] Product name correct
   - [ ] Category correct
   - [ ] Quantity and unit correct
   - [ ] Specifications visible
   - [ ] Delivery country correct
   - [ ] Timeline visible
   - [ ] Incoterms visible
   - [ ] Budget range visible
5. Verify Buyer Context section
   - [ ] Company name correct
   - [ ] Buyer role visible
   - [ ] Purchase type visible
   - [ ] Estimated order value visible
   - [ ] Past RFQs section (if applicable)

**Expected Result**: ✅ All RFQ details visible and correct

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Test 3: Match Supplier ✅

**Steps:**
1. In Admin RFQ Review detail view
2. Scroll to "Internal Matching" section
3. Add internal notes
   - [ ] Notes field accepts text
4. Select confidence score
   - [ ] Low/Medium/High options available
5. Select suppliers from shortlist
   - [ ] Supplier list loads
   - [ ] Can select multiple suppliers
   - [ ] Selected suppliers shown
6. Click "Approve & Match Suppliers"
   - [ ] Success message appears
   - [ ] RFQ status changes to `matched`
   - [ ] Redirected to list view

**Expected Result**: ✅ RFQ status = `matched`, suppliers in `matched_supplier_ids`

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Test 4: Submit Quote as Supplier ✅

**Steps:**
1. Log in as matched supplier
2. Navigate to `/dashboard/supplier-rfqs` or `/dashboard/rfqs/[rfq-id]`
3. Verify RFQ is visible
   - [ ] RFQ appears in matched RFQs list
   - [ ] Can view RFQ details
4. Click "Submit Quote" button
5. Fill quote form:
   - [ ] Unit price entered
   - [ ] Total price auto-calculates
   - [ ] Currency selected
   - [ ] Incoterms selected (required)
   - [ ] Lead time entered (required)
   - [ ] MOQ entered (optional)
   - [ ] Notes entered (max 500 chars)
   - [ ] Confirmation checkbox checked
6. Submit quote
   - [ ] Success message appears
   - [ ] Quote form disappears
   - [ ] Quote appears in quotes list

**Expected Result**: ✅ Quote created with status `quote_submitted`, all fields saved

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Test 5: Confirm Quote Locks ✅

**Steps:**
1. As supplier, try to edit submitted quote
   - [ ] Quote cannot be edited (form not accessible)
   - [ ] Database trigger prevents modification
2. Verify quote status
   - [ ] Status = `quote_submitted`
   - [ ] Cannot change price, incoterms, MOQ, notes
3. (Optional) Try direct database update
   - [ ] Database trigger blocks update
   - [ ] Error message: "Cannot modify a submitted quote"

**Expected Result**: ✅ Quote locked after submission, only status can be changed by admin

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Test 6: Confirm Notifications Fire ✅

**Steps:**
1. Check buyer notifications after RFQ submission
   - [ ] Notification received: "RFQ received – Afrikoni"
   - [ ] Message: "Your trade request has been received..."
2. Check buyer notifications after admin approval
   - [ ] Notification received: "Suppliers matched for your RFQ"
   - [ ] Message: "We've matched verified African suppliers..."
3. Check notifications table in database
   - [ ] `rfq_submitted` notification exists
   - [ ] `rfq_matched` notification exists
   - [ ] `user_id` and `company_id` correct
   - [ ] `related_id` points to RFQ

**Expected Result**: ✅ All notifications sent correctly with proper data

**Actual Result**: _________________________________

**Notes**: _________________________________

---

## Post-Test Verification

### Database Checks
- [ ] `quotes.incoterms` column exists and accepts values
- [ ] `quotes.moq` column exists and accepts values
- [ ] `quotes.status` = `quote_submitted` for test quote
- [ ] `rfqs.matched_supplier_ids` contains supplier ID
- [ ] `rfqs.status` = `matched`
- [ ] `notifications` table has entries for all events

### Code Verification
- [ ] No console errors
- [ ] No network errors
- [ ] All forms submit successfully
- [ ] All redirects work correctly

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Submit RFQ | [ ] Pass [ ] Fail | |
| 2. Review RFQ | [ ] Pass [ ] Fail | |
| 3. Match Supplier | [ ] Pass [ ] Fail | |
| 4. Submit Quote | [ ] Pass [ ] Fail | |
| 5. Quote Locks | [ ] Pass [ ] Fail | |
| 6. Notifications | [ ] Pass [ ] Fail | |

**Overall Status**: [ ] ✅ ALL PASS [ ] ❌ ISSUES FOUND

**Issues Found**: _________________________________

**Next Steps**: _________________________________

---

*If all 6 tests pass → System is LIVE and ready for real RFQs* 🚀

