# 🔍 REPAIR CLUSTER 1 — PHASE R1: RUNTIME ERROR IDENTIFICATION REPORT

**Date:** 2024  
**Status:** Analysis Complete

---

## 📋 EXECUTIVE SUMMARY

This report identifies all potential runtime errors and crashes across the Afrikoni codebase. Issues are categorized by page/component and include root cause analysis.

---

## 🚨 DASHBOARD CRASHES

### Issue D1: Missing Parameters in `getCurrentUserAndRole()` Calls

**Location:** Multiple dashboard pages  
**Files Affected:**
- `src/pages/dashboard/orders.jsx` line 38
- `src/pages/dashboard/rfqs.jsx` line 53
- `src/pages/dashboard/products.jsx` line 52
- `src/pages/dashboard/orders/[id].jsx` line 43

**Error Pattern:**
```javascript
const { user, profile, role, companyId } = await getCurrentUserAndRole();
```

**Root Cause:** `getCurrentUserAndRole` requires `supabase` and `supabaseHelpers` parameters, but many calls omit them.

**Expected Error:**
```
TypeError: Cannot read property 'auth' of undefined
```

**Impact:** HIGH — All dashboard list pages will crash on load.

---

### Issue D2: Wrong Field Name in Products Query

**Location:** `src/pages/dashboard/DashboardHome.jsx` line 314

**Error Pattern:**
```javascript
.eq('supplier_id', companyId)
```

**Root Cause:** Products table uses `company_id`, not `supplier_id`. This was partially fixed but one instance remains.

**Expected Error:**
- Query returns no results (silent failure)
- Seller stats don't load correctly

**Impact:** MEDIUM — Seller stats in dashboard home won't show product count.

---

### Issue D3: Inconsistent Auth Helper Usage in Detail Pages

**Location:** 
- `src/pages/dashboard/rfqs/[id].jsx` line 47

**Error Pattern:**
```javascript
const userData = await supabaseHelpers.auth.me();
```

**Root Cause:** Detail pages use old `supabaseHelpers.auth.me()` instead of centralized `getCurrentUserAndRole()`. This can cause:
- Missing profile data
- Missing company ID
- Inconsistent role detection

**Impact:** MEDIUM — RFQ detail page may not load user context correctly.

---

### Issue D4: Unsafe Array Operations in DashboardHome

**Location:** `src/pages/dashboard/DashboardHome.jsx`

**Potential Issues:**
- Line 197-198: `(revenueRes.data || [])` — Good, but `revenueRes` could be undefined
- Line 241: `notifications.forEach` — Already protected with `Array.isArray()` check
- Line 264: `recentOrders.forEach` — Already protected with `Array.isArray()` check

**Status:** Most array operations are already protected, but some query results may not be.

**Impact:** LOW — Most operations are safe, but edge cases could crash.

---

## 🔐 ONBOARDING/AUTH CRASHES

### Issue A1: Double Call to `getCurrentUserAndRole`

**Location:** `src/pages/onboarding.jsx` lines 51 and 66

**Error Pattern:**
```javascript
const { user, onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
// ... later ...
const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
```

**Root Cause:** Inefficient but not a crash. However, if the first call fails, the second will also fail.

**Impact:** LOW — Performance issue, not a crash.

---

### Issue A2: Missing Error Handling in Onboarding

**Location:** `src/pages/onboarding.jsx` line 66

**Error Pattern:**
```javascript
const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
if (profile) {
  // Uses profile data
}
```

**Root Cause:** If `getCurrentUserAndRole` throws, the catch block redirects to login, but the error handling could be more graceful.

**Impact:** LOW — Already has error handling, but could be improved.

---

## 🛒 MARKETPLACE CRASHES

### Issue M1: Array Safety in Marketplace

**Location:** `src/pages/marketplace.jsx`

**Status:** Already has `Array.isArray()` checks in most places (lines 110, 119, etc.)

**Potential Issue:**
- Line 110: `Array.isArray(data) ? data.map(...)` — Good
- Line 119: `applyClientSideFilters(productsWithImages)` — Need to verify this function handles null/undefined

**Impact:** LOW — Most operations are protected.

---

### Issue M2: Query Result Safety

**Location:** `src/pages/marketplace.jsx` line 99

**Error Pattern:**
```javascript
const { data, error } = result;
```

**Root Cause:** If `paginateQuery` returns unexpected shape, destructuring could fail.

**Impact:** LOW — `paginateQuery` should return consistent shape.

---

## 📦 OTHER PAGES

### Issue O1: Products Page - Array Safety

**Location:** `src/pages/dashboard/products.jsx` line 82

**Error Pattern:**
```javascript
const productsWithImages = (result.data || []).map(product => {
  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
```

**Root Cause:** `product.product_images` might not be an array. The `?.find()` is safe, but if `product_images` is null, the fallback `product.product_images?.[0]` could still access null.

**Impact:** LOW — Mostly safe, but edge case exists.

---

### Issue O2: RFQ Detail - Missing Helper Usage

**Location:** `src/pages/dashboard/rfqs/[id].jsx` line 47

**Error Pattern:**
```javascript
const userData = await supabaseHelpers.auth.me();
const role = userData.role || userData.user_role || 'buyer';
```

**Root Cause:** Should use `getCurrentUserAndRole()` and `getUserRole()` helpers for consistency.

**Impact:** MEDIUM — Inconsistent role detection, may not get company ID.

---

### Issue O3: Order Detail - Missing Parameters

**Location:** `src/pages/dashboard/orders/[id].jsx` line 43

**Error Pattern:**
```javascript
const { user, profile, role } = await getCurrentUserAndRole();
```

**Root Cause:** Missing required parameters `supabase` and `supabaseHelpers`.

**Impact:** HIGH — Order detail page will crash on load.

---

## 📊 SUMMARY BY SEVERITY

### HIGH PRIORITY (Will Crash)
1. **D1** - Missing parameters in `getCurrentUserAndRole()` calls (4 files)
2. **O3** - Order detail page missing parameters

### MEDIUM PRIORITY (May Fail Silently)
1. **D2** - Wrong field name `supplier_id` in DashboardHome
2. **D3** - Inconsistent auth helper in RFQ detail
3. **O2** - RFQ detail missing helper usage

### LOW PRIORITY (Edge Cases)
1. **D4** - Some query results may be undefined
2. **A1** - Double call to getCurrentUserAndRole
3. **M1/M2** - Array safety edge cases
4. **O1** - Products page array edge case

---

## 🎯 RECOMMENDED FIX ORDER

1. **Fix D1 & O3** - Add missing parameters to all `getCurrentUserAndRole()` calls
2. **Fix D2** - Change `supplier_id` to `company_id` in DashboardHome
3. **Fix D3 & O2** - Standardize auth helper usage in detail pages
4. **Review D4, M1, O1** - Add additional safety checks where needed

---

## 📝 NEXT STEPS

Proceed to **PHASE R2** to fix dashboard crashes first, then **PHASE R3** for remaining pages.

