# 🧪 End-to-End RFQ Flow Test Script

Use this script to test the complete RFQ lifecycle.

---

## Prerequisites

- [ ] Migration applied successfully
- [ ] Test buyer account created
- [ ] Test supplier account created
- [ ] Admin account ready
- [ ] At least one supplier in database

---

## Test Script

### Phase 1: Buyer Creates RFQ

**User**: Buyer  
**URL**: `/rfq/create`

1. Fill Step 1:
   ```
   Product: "Test RFQ - End-to-End Verification"
   Category: [Select any]
   Quantity: 500
   Unit: "pieces"
   Delivery Country: [Select any African country]
   Timeline: "Flexible"
   ```

2. Fill Step 2:
   ```
   Specifications: "Testing complete RFQ flow for verification"
   Budget Range: [Optional - leave blank]
   Certifications: [Optional]
   Incoterms: "FOB"
   ```

3. Fill Step 3:
   ```
   Purchase Type: "One-time purchase"
   Estimated Order Value: "€5,000 - €10,000"
   Company Name: [Your test company]
   Buyer Role: "Procurement Manager"
   ```

4. Submit and **NOTE THE RFQ ID**: `_________________`

**Expected**: Confirmation screen with RFQ ID

---

### Phase 2: Admin Reviews RFQ

**User**: Admin  
**URL**: `/dashboard/admin/rfq-review`

1. Find RFQ in "Pending Review" list
2. Click "Review"
3. Verify all details match Phase 1
4. In "Internal Matching":
   - Notes: "End-to-end test RFQ"
   - Confidence: "High"
   - Select 1-2 suppliers from shortlist
5. Click "Approve & Match Suppliers"

**Expected**: RFQ status = `matched`, suppliers in shortlist

---

### Phase 3: Supplier Submits Quote

**User**: Matched Supplier  
**URL**: `/dashboard/rfqs/[rfq-id]` or `/dashboard/supplier-rfqs`

1. Verify RFQ is visible in matched RFQs
2. Click "Submit Quote"
3. Fill form:
   ```
   Unit Price: 10.00
   Total Price: 5,000.00 (auto-calculated)
   Currency: USD
   Incoterms: FOB
   Lead Time: "3-4 weeks"
   MOQ: 250 (optional)
   Notes: "Ready to supply, quality guaranteed"
   ```
4. ✅ Check: "I confirm this quote is accurate and executable"
5. Submit

**Expected**: Quote created with status `quote_submitted`, form locked

---

### Phase 4: Verify Quote Locking

**User**: Same Supplier

1. Try to access quote form again
2. Verify form is NOT accessible
3. Check quote status in database or UI
4. Try to edit quote (should fail)

**Expected**: Quote cannot be edited, status = `quote_submitted`

---

### Phase 5: Verify Notifications

**User**: Buyer

1. Check notifications (bell icon)
2. Verify notification 1: "RFQ received – Afrikoni"
3. Verify notification 2: "Suppliers matched for your RFQ"
4. Check notification messages are correct

**Expected**: Both notifications received with correct messages

---

## Verification Checklist

- [ ] RFQ created with all fields
- [ ] RFQ ID generated
- [ ] Admin can view all RFQ details
- [ ] Suppliers matched successfully
- [ ] Supplier can see matched RFQ
- [ ] Quote submitted with all fields (incoterms, MOQ, etc.)
- [ ] Quote status = `quote_submitted`
- [ ] Quote locked (cannot edit)
- [ ] Buyer received `rfq_submitted` notification
- [ ] Buyer received `rfq_matched` notification
- [ ] All notifications have correct data

---

## Issues Found

Document any issues here:

1. _________________________________
2. _________________________________
3. _________________________________

---

## Test Result

- [ ] ✅ ALL TESTS PASSED
- [ ] ❌ ISSUES FOUND (see above)

**Date**: _______________  
**Tester**: _______________

