# ✅ Complete All Tasks - Step-by-Step Guide

Follow this guide to complete all 5 tasks in order.

---

## 📋 TASK 1: Apply Database Migration via Supabase Dashboard

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Afrikoni project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query" button

3. **Copy Migration SQL**
   ```bash
   # The migration file is located at:
   supabase/migrations/20250116000000_extend_quotes_table.sql
   ```
   - Open the file and copy ALL contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

4. **Paste and Execute**
   - Paste into SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

5. **Verify Success**
   - ✅ Should see: "Success. No rows returned."
   - ❌ If you see errors, stop and fix them

### ✅ Checkpoint
- [ ] Migration executed successfully
- [ ] Message: "Success. No rows returned."
- [ ] No error messages

**If migration fails → STOP and fix before proceeding.**

---

## 📋 TASK 2: Run Verification Queries

### Option A: Quick SQL Verification (Recommended)

1. **Open Supabase SQL Editor** (same as above)

2. **Run Query 1: Check Columns**
   ```sql
   SELECT COUNT(*) as column_count
   FROM information_schema.columns 
   WHERE table_schema = 'public'
     AND table_name = 'quotes' 
     AND column_name IN ('incoterms', 'moq', 'status');
   ```
   **Expected Result**: `3` (one row showing count = 3)

3. **Run Query 2: Check Trigger**
   ```sql
   SELECT COUNT(*) as trigger_count
   FROM information_schema.triggers 
   WHERE event_object_schema = 'public'
     AND event_object_table = 'quotes' 
     AND trigger_name = 'trg_prevent_quote_edit';
   ```
   **Expected Result**: `1` (one row showing count = 1)

### Option B: Automated Verification

```bash
# Make sure .env file has Supabase credentials
npm install  # Install dependencies
npm run verify-migration
```

### ✅ Checkpoint
- [ ] Query 1 returns: `3`
- [ ] Query 2 returns: `1`

**If either query doesn't return expected value → STOP. Migration not applied correctly.**

---

## 📋 TASK 3: Test End-to-End RFQ Flow

### Test Scenario: Complete RFQ Lifecycle

#### Step 1: Create RFQ as Buyer

1. **Navigate to RFQ Creation**
   - Go to: `/rfq/create` (or click "Post RFQ" link)
   - Log in as a test buyer account

2. **Complete Step 1: Product Basics**
   - Product name: "Test Product - Cocoa Beans"
   - Category: Select any category
   - Quantity: 1000
   - Unit: "kg"
   - Delivery country: Select any African country
   - Timeline: "Flexible"
   - Click "Continue"

3. **Complete Step 2: Requirements & Budget**
   - Specifications: "Premium grade cocoa beans, organic certified"
   - Budget range (optional): Leave blank or enter values
   - Certifications: Select "Organic" (optional)
   - Incoterms: "FOB"
   - Click "Continue"

4. **Complete Step 3: Trust & Intent**
   - Purchase type: "One-time purchase"
   - Estimated order value: "€10,000 - €50,000"
   - Company name: Your test company name
   - Buyer role: "Procurement Manager"
   - Click "Submit RFQ"

5. **Verify Confirmation**
   - ✅ Confirmation screen appears
   - ✅ RFQ ID displayed
   - ✅ "What happens next" section visible

#### Step 2: Review RFQ as Admin

1. **Navigate to Admin Review**
   - Go to: `/dashboard/admin/rfq-review`
   - Log in as admin account

2. **Find Test RFQ**
   - Should appear in "Pending Review" filter
   - Click "Review" button

3. **Verify RFQ Details**
   - ✅ Product name: "Test Product - Cocoa Beans"
   - ✅ Category visible
   - ✅ Quantity: 1000 kg
   - ✅ Specifications visible
   - ✅ Delivery country visible
   - ✅ Incoterms: FOB
   - ✅ Buyer company name visible

4. **Match Suppliers**
   - Scroll to "Internal Matching" section
   - Add internal notes: "Test RFQ for verification"
   - Select confidence score: "High"
   - Select at least one supplier from shortlist
   - Click "Approve & Match Suppliers"

5. **Verify Status Change**
   - ✅ Success message appears
   - ✅ RFQ status = `matched`
   - ✅ Redirected to list view

#### Step 3: Submit Quote as Supplier

1. **Log in as Matched Supplier**
   - Use account that was matched in admin review
   - Navigate to: `/dashboard/supplier-rfqs` or `/dashboard/rfqs/[rfq-id]`

2. **View Matched RFQ**
   - ✅ RFQ appears in matched RFQs list
   - ✅ Can view all RFQ details
   - ✅ "Submit Quote" button visible

3. **Fill Quote Form**
   - Click "Submit Quote"
   - Unit price: 25.00
   - Total price: Auto-calculates to 25,000.00
   - Currency: USD
   - Incoterms: FOB (required)
   - Lead time: "4-6 weeks" (required)
   - MOQ: 500 (optional)
   - Notes: "Premium quality, organic certified cocoa beans" (max 500 chars)
   - ✅ Check confirmation checkbox: "I confirm this quote is accurate and executable"

4. **Submit Quote**
   - Click "Submit Quote"
   - ✅ Success message: "Quote submitted successfully! Your quote is now locked..."
   - ✅ Quote form disappears
   - ✅ Quote appears in quotes list with status `quote_submitted`

#### Step 4: Verify Quote Locking

1. **Try to Edit Quote**
   - As supplier, try to access quote form again
   - ✅ Quote form should NOT be accessible
   - ✅ Quote cannot be edited

2. **Check Quote Status**
   - ✅ Status = `quote_submitted`
   - ✅ All fields locked (price, incoterms, MOQ, notes)

#### Step 5: Verify Buyer Notification

1. **Check Notifications**
   - Log in as buyer
   - Check notifications (bell icon or `/dashboard/notifications`)
   - ✅ Notification 1: "RFQ received – Afrikoni" (after RFQ submission)
   - ✅ Notification 2: "Suppliers matched for your RFQ" (after admin approval)

2. **Verify Database**
   - In Supabase Dashboard → Table Editor → `notifications`
   - ✅ Should see notifications with:
     - `type`: `rfq_submitted` and `rfq_matched`
     - `related_id`: Points to RFQ ID
     - `user_id` and `company_id`: Correct buyer IDs

### ✅ Checkpoint
- [ ] RFQ created successfully
- [ ] Admin reviewed and matched suppliers
- [ ] Supplier submitted quote
- [ ] Quote locked after submission
- [ ] Buyer received notifications

**If any step fails → Document the issue and fix before proceeding.**

---

## 📋 TASK 4: Complete All 6 Smoke Tests (Mandatory)

Follow the detailed checklist in: `scripts/smoke-test-checklist.md`

### Quick Summary

1. ✅ **Submit RFQ as Buyer** - Complete 4-step form
2. ✅ **Review RFQ as Admin** - View details, match suppliers
3. ✅ **Match Supplier** - Approve RFQ, add suppliers to shortlist
4. ✅ **Submit Quote as Supplier** - Fill form, submit, verify lock
5. ✅ **Confirm Quote Locks** - Verify cannot edit submitted quote
6. ✅ **Confirm Notifications Fire** - Verify buyer receives all notifications

### ✅ Checkpoint
- [ ] All 6 tests completed
- [ ] All 6 tests PASSED
- [ ] No errors or issues found

**If one test fails → Fix only that issue, retest that one test, then continue.**

---

## 📋 TASK 5: Deploy Frontend After Smoke Tests Pass

### Pre-Deployment Checklist

- [ ] All smoke tests passed
- [ ] No console errors in development
- [ ] Environment variables configured
- [ ] Build succeeds locally: `npm run build`

### Deployment Steps

#### Option A: Vercel (Recommended)

1. **Connect Repository**
   - Go to: https://vercel.com
   - Import your Git repository
   - Or use Vercel CLI: `vercel`

2. **Configure Environment Variables**
   - Add in Vercel dashboard:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Any other required env vars

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

4. **Verify Production**
   - Test production URL
   - Verify RFQ flow works
   - Check for console errors

#### Option B: Other Hosting

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder**
   - Upload to your hosting provider
   - Configure environment variables
   - Set up custom domain (if needed)

### Post-Deployment Verification

- [ ] Production site loads
- [ ] Can log in
- [ ] RFQ creation works
- [ ] Admin review accessible
- [ ] Supplier quotes work
- [ ] No console errors

### ✅ Checkpoint
- [ ] Frontend deployed successfully
- [ ] Production URL accessible
- [ ] All features work in production
- [ ] No errors

---

## 🎯 Final Status

After completing all 5 tasks:

- [ ] ✅ Task 1: Migration applied
- [ ] ✅ Task 2: Verification queries passed
- [ ] ✅ Task 3: End-to-end flow tested
- [ ] ✅ Task 4: All 6 smoke tests passed
- [ ] ✅ Task 5: Frontend deployed

**If all checked → YOU ARE LIVE! 🚀**

---

## 📝 Notes

- Document any issues encountered
- Keep test RFQ data for reference
- Monitor production for first few days
- Be ready to manually guide first 5 real buyers

---

*Follow this guide step-by-step. No shortcuts.*

