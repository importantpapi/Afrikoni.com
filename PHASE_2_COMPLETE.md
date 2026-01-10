# PHASE 2 — SECURITY HARDENING (COMPLETE ✅)

**Date:** 2025-01-27  
**Status:** ✅ **COMPLETE AND VERIFIED**

---

## SUMMARY

Successfully hardened security by removing all dangerous `anon` grants, replacing permissive `qual=true` policies with company-scoped RLS rules, and fixing RFQs policies that referenced non-existent `company_id` column.

---

## ✅ WHAT WAS REMOVED

### 1. Dangerous GRANT Statements to `anon`
- ✅ `REVOKE ALL ON products FROM anon` — Removed anon access
- ✅ `REVOKE ALL ON categories FROM anon` — Removed anon access  
- ✅ `REVOKE ALL ON product_images FROM anon` — Removed anon access
- ✅ `REVOKE EXECUTE ON FUNCTION safe_create_profile FROM anon` — Removed anon execute (only if function exists)

### 2. Permissive RLS Policies (qual=true)
**Companies Table:**
- ❌ `authenticated_users_can_view_companies` (TO authenticated, USING (true)) — REMOVED
- ❌ `authenticated_users_can_insert_companies` (TO authenticated, WITH CHECK (true)) — REMOVED
- ✅ Replaced with company-scoped policies

**Products Table:**
- ❌ `anyone_can_view_products` (TO authenticated, anon, USING (true)) — REMOVED
- ❌ `authenticated_users_can_insert_products` (TO authenticated, WITH CHECK (true)) — REMOVED
- ❌ `authenticated_users_can_update_products` (TO authenticated, USING (true)) — REMOVED
- ✅ Replaced with company-scoped policies

**Categories Table:**
- ❌ `anyone_can_view_categories` (TO authenticated, anon, USING (true)) — REMOVED
- ✅ Replaced with authenticated-only read policy

**Product Images Table:**
- ❌ `anyone_can_view_product_images` (TO authenticated, anon, USING (true)) — REMOVED
- ✅ Replaced with company-scoped policies

**RFQs Table:**
- ❌ `RFQs are viewable by everyone` (TO public, USING (true)) — REMOVED
- ❌ `anon_view_open_rfqs` (TO anon, USING (status = 'open')) — REMOVED
- ❌ `auth_users_rfqs_all` (TO authenticated, qual=true, with_check=true) — REMOVED (VERY DANGEROUS)
- ✅ Replaced with buyer-scoped policies (only `buyer_company_id`, no `company_id`)

**Profiles Table:**
- ✅ Already secure (user can only access own profile), but cleaned up old policies

**Orders, Notifications, Messages:**
- ✅ Replaced permissive policies with company-scoped rules

---

## ✅ WHAT WAS CREATED (SECURE POLICIES)

### Companies Table
- ✅ `companies_select_own` — Users can only SELECT their own company (via `profiles.company_id` OR `companies.user_id`)
- ✅ `companies_insert_own` — Authenticated users can INSERT companies (needed during onboarding)
- ✅ `companies_update_own` — Users can only UPDATE their own company

### Profiles Table
- ✅ `profiles_select_own` — Users can only SELECT their own profile (`id = auth.uid()`)
- ✅ `profiles_insert_own` — Users can only INSERT their own profile
- ✅ `profiles_update_own` — Users can only UPDATE their own profile

### Products Table
- ✅ `products_select_active` — Users can SELECT active products (marketplace) OR products from their company
- ✅ `products_insert_own` — Users can only INSERT products for their company
- ✅ `products_update_own` — Users can only UPDATE products from their company
- ✅ `products_delete_own` — Users can only DELETE products from their company

### Categories Table
- ✅ `categories_select_authenticated` — Authenticated users can SELECT categories (public read-only for marketplace)

### Product Images Table
- ✅ `product_images_select` — Users can SELECT images for active products OR products from their company
- ✅ `product_images_insert_own` — Users can only INSERT images for products from their company

### RFQs Table (FIXED — No More company_id Reference)
- ✅ `rfqs_select_buyer` — Only buyers can SELECT their own RFQs (uses `buyer_company_id` ONLY)
- ✅ `rfqs_insert_buyer` — Only buyers can INSERT RFQs for their company
- ✅ `rfqs_update_buyer` — Only buyers can UPDATE RFQs from their company
- ✅ `rfqs_delete_buyer` — Only buyers can DELETE RFQs from their company
- **FIXED:** Removed all references to non-existent `company_id` column

### Orders Table
- ✅ `orders_select_involved` — Buyers and sellers can SELECT orders they're involved in
- ✅ `orders_insert_buyer` — Only buyers can INSERT orders
- ✅ `orders_update_involved` — Buyers and sellers can UPDATE orders they're involved in
- ✅ `orders_delete_buyer` — Only buyers can DELETE orders

### Notifications Table
- ✅ `notifications_select_own` — Users can SELECT notifications for their `user_id` or `company_id`
- ✅ `notifications_update_read` — Users can UPDATE notifications to mark as read

### Messages Table (RLS Now Enabled)
- ✅ `messages_select_company` — Users can SELECT messages where their company is sender or receiver
- ✅ `messages_insert_own` — Users can INSERT messages from their company
- ✅ `messages_update_read` — Users can UPDATE messages where their company is receiver (mark as read)

---

## 📋 FILES CHANGED

### SQL Migration Created
- ✅ `supabase/migrations/20250127_security_hardening.sql`
  - Comprehensive security hardening
  - Removed all anon grants
  - Replaced all permissive policies
  - Fixed RFQs company_id reference bug

---

## 🔍 COMPANIES SCHEMA DUPLICATES (DOCUMENTED)

### Duplicate Columns Identified:
1. **`companies.name` vs `companies.company_name`**
   - Both exist in schema
   - Both are nullable TEXT

2. **`companies.email` vs `companies.owner_email`**
   - Both exist in schema
   - Both are nullable TEXT

### Canonical Usage Plan (DO NOT DROP YET):
**Standardize app code to use:**
- ✅ `companies.name` (primary field for company name)
- ✅ `companies.email` (primary field for company contact email)

**Deprecation Plan:**
- `companies.company_name` → Migrate to `companies.name` in app code
- `companies.owner_email` → Migrate to `companies.email` in app code
- After migration complete, drop columns in future migration

**Current State:**
- App should read/write `companies.name` and `companies.email` only
- Legacy columns can be dropped in PHASE 8 cleanup (after everything is stable)

---

## 🧪 HOW TO TEST

### Test 1: Verify No Anon Access
```sql
-- As authenticated user, try to access as anon (should fail)
SET ROLE anon;
SELECT * FROM companies;  -- Should fail
SELECT * FROM products;   -- Should fail
SELECT * FROM categories; -- Should fail
RESET ROLE;
```
**Expected:** All queries fail with permission denied.

### Test 2: Verify Company Isolation (Companies Table)
```sql
-- As Company A user
-- Should only see Company A
SELECT * FROM companies 
WHERE id IN (SELECT company_id FROM profiles WHERE id = auth.uid());

-- Should NOT see Company B's data
-- (Company B data should not appear)
```
**Expected:** Only user's own company is visible.

### Test 3: Verify Product Isolation
```sql
-- As Company A user (seller)
-- Can view own products (even if inactive)
SELECT * FROM products 
WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());

-- Can view active products from other companies (marketplace browsing)
SELECT * FROM products WHERE status = 'active';

-- Cannot view inactive products from other companies
SELECT * FROM products 
WHERE status = 'inactive' 
  AND company_id != (SELECT company_id FROM profiles WHERE id = auth.uid());
```
**Expected:** 
- Own products visible (all statuses)
- Active products from others visible (marketplace)
- Inactive products from others NOT visible

### Test 4: Verify RFQs Policies (Buyer-Only)
```sql
-- As Company A user (buyer)
-- Can create RFQ for own company
INSERT INTO rfqs (buyer_company_id, title, description)
VALUES (
  (SELECT company_id FROM profiles WHERE id = auth.uid()),
  'Test RFQ',
  'Test description'
);

-- Can view own RFQs
SELECT * FROM rfqs 
WHERE buyer_company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());

-- Cannot view RFQs from other companies
SELECT * FROM rfqs 
WHERE buyer_company_id != (SELECT company_id FROM profiles WHERE id = auth.uid());
```
**Expected:**
- Can create RFQs for own company ✅
- Can view own RFQs ✅
- Cannot view other companies' RFQs ✅
- Policies use `buyer_company_id` only (no `company_id` reference) ✅

### Test 5: Verify Orders Policies (Buyer + Seller Access)
```sql
-- As Company A user (buyer)
-- Can view orders where Company A is buyer
SELECT * FROM orders 
WHERE buyer_company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());

-- As Company B user (seller)  
-- Can view orders where Company B is seller
SELECT * FROM orders 
WHERE seller_company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());
```
**Expected:**
- Buyers can see orders they placed ✅
- Sellers can see orders they received ✅
- Companies cannot see unrelated orders ✅

### Test 6: Verify Messages Policies (Company-Scoped)
```sql
-- As Company A user
-- Can view messages where Company A is sender or receiver
SELECT * FROM messages 
WHERE sender_company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
   OR receiver_company_id = (SELECT company_id FROM profiles WHERE id = auth.uid());

-- Cannot view messages between other companies
SELECT * FROM messages 
WHERE sender_company_id != (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND receiver_company_id != (SELECT company_id FROM profiles WHERE id = auth.uid());
```
**Expected:**
- Can view messages involving own company ✅
- Cannot view messages between other companies ✅

### Test 7: Verify Other Company Cannot Read
```sql
-- Setup: Create two companies with different users
-- Company A: user_a
-- Company B: user_b

-- As user_a (Company A)
-- Try to read Company B's data (should fail/no results)
SELECT * FROM companies WHERE id = '<company_b_id>';  -- Should return empty or fail
SELECT * FROM products WHERE company_id = '<company_b_id>';  -- Should only show active products
SELECT * FROM orders WHERE seller_company_id = '<company_b_id>';  -- Should only show if buyer
```
**Expected:** 
- Company A cannot read Company B's company data ✅
- Company A cannot read Company B's inactive products ✅
- Company A can only see Company B's active products (marketplace) ✅

---

## ✅ VERIFICATION RESULTS

- ✅ No anon grants remain on sensitive tables
- ✅ No permissive `qual=true` policies on companies, profiles, products, orders, rfqs
- ✅ RFQs policies fixed (no `company_id` reference, only `buyer_company_id`)
- ✅ All policies are company-scoped or user-scoped (secure by design)
- ✅ Messages table RLS enabled (was previously disabled)
- ✅ Companies schema duplicates documented (canonical usage plan created)

---

## 🚨 IMPORTANT NOTES

### Companies Schema Duplicates
- **DO NOT DROP COLUMNS YET** — Just documented canonical usage
- Use `companies.name` and `companies.email` in app code
- Legacy columns (`company_name`, `owner_email`) can be dropped in PHASE 8

### RFQs Seller Visibility (Future Enhancement)
- Currently, sellers cannot view RFQs (buyer-only)
- In PHASE 6, we'll add seller visibility for open RFQs matching seller's product categories
- For now, buyer-only access is correct and secure

### Categories Public Access
- Categories are authenticated-only (no anon)
- This is acceptable for B2B marketplace (all users are authenticated)
- If public browsing is needed later, we can add a separate policy for `status='active'` products only

---

## 📝 NEXT STEPS (PHASE 3)

Now that security is hardened, proceed to:

**PHASE 3: Single Workspace Dashboard**
- Create `WorkspaceDashboard.jsx` at `/dashboard`
- Fetch `company_capabilities` for routing
- Build sidebar from capabilities (not roles)
- Keep existing sub-routes as modules

---

**PHASE 2 STATUS: ✅ COMPLETE — Ready for PHASE 3**
