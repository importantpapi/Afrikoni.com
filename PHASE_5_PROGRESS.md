# PHASE 5 — PROGRESS REPORT

**Date:** 2025-01-27  
**Status:** 🚧 **IN PROGRESS** — Critical foundations complete, UI rendering updates pending

---

## ✅ COMPLETED (Critical Foundations)

### 1. CapabilityContext Created ✅
**File:** `src/context/CapabilityContext.tsx`

**Status:** ✅ Complete
- Provides global capability access via `useCapability()` hook
- Fetches from `company_capabilities` table
- Auto-creates capabilities if missing (safety net)
- Provides `refreshCapabilities()` method

**Integration:**
- Added `CapabilityProvider` wrapper in `src/pages/dashboard/index.jsx`
- Available to all dashboard components

### 2. RequireCapability Guard Created ✅
**File:** `src/guards/RequireCapability.tsx`

**Status:** ✅ Complete
- Replaces `RequireDashboardRole` 
- Checks `canBuy`, `canSell`, `canLogistics`, `canAdmin` flags
- **NEVER redirects** (unlike RequireDashboardRole)
- **NEVER blocks dashboard** (shows inline message or AccessDenied)
- Supports `requireApproved` flag for sell/logistics capabilities
- Shows loading spinner with timeout protection

**Key Differences from RequireDashboardRole:**
- ✅ Uses capabilities, not roles
- ✅ Never redirects (shows message instead)
- ✅ Never blocks dashboard rendering
- ✅ Handles loading/error states gracefully

### 3. Dashboard Entry Point Updated ✅
**File:** `src/pages/dashboard/index.jsx`

**Status:** ✅ Complete
- Added `CapabilityProvider` wrapper around `WorkspaceDashboard`
- No routing changes (as per rules)
- Dashboard still requires `company_id` (unchanged)

### 4. WorkspaceDashboard Updated ✅
**File:** `src/pages/dashboard/WorkspaceDashboard.jsx`

**Status:** ✅ Complete
- Removed local capability fetching logic
- Uses `useCapability()` hook from context instead
- Still passes capabilities to `DashboardLayout` (backward compatible)
- Removed `effectiveRole` calculation (no longer needed)
- Removed `currentRole` prop from `DashboardHome` (capabilities passed instead)

### 5. DashboardHome Data Loading Updated (Partial) ✅
**File:** `src/pages/dashboard/DashboardHome.jsx`

**Status:** ⚠️ **PARTIAL** — Data loading functions updated, UI rendering still uses `currentRole`

**Completed:**
- ✅ Function signature updated: removed `currentRole` prop, added `capabilities` prop
- ✅ Added `useCapability()` hook import
- ✅ Updated `shouldLoadBuyerData()` to use capabilities instead of role
- ✅ Updated `shouldLoadSellerData()` to use capabilities instead of role
- ✅ Updated `getDefaultKPIs()` to remove role parameter
- ✅ Updated `loadKPIs()` to use capabilities instead of role
- ✅ Updated `loadChartData()` to use capabilities instead of role
- ✅ Updated `loadApprovalSummary()` to use capabilities instead of role
- ✅ Updated all function calls to pass capabilities instead of currentRole
- ✅ Updated `useEffect` dependencies to use capabilities instead of role/currentRole
- ✅ Updated `handleRealTimeUpdate` callback to use capabilities

**Still Pending (UI Rendering):**
- ⚠️ `quickActions` object still uses role-based keys (`buyer`, `seller`, `hybrid`)
- ⚠️ Conditional rendering still uses `currentRole === 'buyer'`, `currentRole === 'seller'`, etc. (21 instances)
- ⚠️ UI text/subtitles still use `currentRole` checks
- ⚠️ Empty state messages still use `currentRole` checks
- ⚠️ Widget visibility still uses `currentRole` checks

**Impact:** Dashboard loads and data fetching works correctly, but UI rendering still shows role-based logic. This is **non-blocking** but needs to be completed for full capability-based architecture.

---

## 🚧 IN PROGRESS

### 6. Dashboard Pages Guard Updates (Pending)
**Files:** 25+ dashboard pages using `RequireDashboardRole`

**Status:** ⚠️ **NOT STARTED**

**Affected Files:**
- `src/pages/dashboard/orders.jsx` (line 744)
- `src/pages/dashboard/products.jsx` (line 609)
- `src/pages/dashboard/sales.jsx` (line 290)
- `src/pages/dashboard/rfqs.jsx` (line 683)
- `src/pages/dashboard/analytics.jsx` (line 758)
- `src/pages/dashboard/payments.jsx` (line 401)
- `src/pages/dashboard/fulfillment.jsx` (line 397)
- `src/pages/dashboard/logistics-dashboard.jsx` (line 941)
- `src/pages/dashboard/logistics-quote.jsx` (line 263)
- ... (16 more files)

**Required Changes:**
Replace:
```jsx
<RequireDashboardRole allow={['buyer', 'hybrid']}>
  <OrdersPage />
</RequireDashboardRole>
```

With:
```jsx
<RequireCapability canBuy={true}>
  <OrdersPage />
</RequireCapability>
```

### 7. DashboardRoleContext Deprecation (Pending)
**File:** `src/context/DashboardRoleContext.tsx`

**Status:** ⚠️ **NOT STARTED**

**Current Issue:**
- Still derives role from URL pathname
- Used by `RequireDashboardRole` (which is being replaced)
- Still imported in `App.jsx` (line 202) but can be removed after page updates

**Required Action:**
- Either replace with `CapabilityContext` (already done)
- Or remove entirely if no longer needed
- Update `App.jsx` to remove `DashboardRoleProvider` wrapper (after pages are updated)

### 8. Data Hooks Updates (Partial)
**Files:** `src/hooks/useRealTimeData.js`, `src/utils/queryBuilders.js`, etc.

**Status:** ⚠️ **REVIEW NEEDED**

**Current State:**
- ✅ `useRealTimeDashboardData` already filters by `company_id` (good!)
- ✅ Query builders (`buildOrderQuery`, `buildProductQuery`, `buildRFQQuery`) already use `buyer_company_id`, `seller_company_id`, `company_id` (good!)
- ⚠️ However, calling code still uses role to determine which queries to run

**Required Changes:**
- Update calling code (like `DashboardHome`) to use capabilities instead of roles to determine which queries to run
- ✅ **Already done** for `DashboardHome` data loading functions
- ⚠️ Still pending for other dashboard pages

### 9. Realtime Stability (Partial)
**File:** `src/hooks/useRealTimeData.js`

**Status:** ⚠️ **REVIEW NEEDED**

**Current State:**
- ✅ Already has guards for `company_id` existence (line 89-98)
- ✅ Already scoped to `company_id` (good!)
- ⚠️ Always subscribes to all channels (RFQs, Products, Orders, Messages, Notifications)
- ⚠️ No capability-based filtering (subscribes even if capability doesn't exist)

**Required Changes:**
- Add capability checks before subscribing to channels
- Only subscribe to RFQs channel if `can_buy === true`
- Only subscribe to Products channel if `can_sell === true`
- Always subscribe to Orders, Messages, Notifications (universal)
- Add `ENABLE_REALTIME` flag (as per PHASE 5 requirements)

---

## 📋 NEXT STEPS

### Priority 1: Complete DashboardHome UI Updates
**File:** `src/pages/dashboard/DashboardHome.jsx`

**Tasks:**
1. Replace `quickActions` role-based keys with capability-based logic
2. Replace all `currentRole === 'buyer'` checks with `capabilities.can_buy`
3. Replace all `currentRole === 'seller'` checks with `capabilities.can_sell && capabilities.sell_status === 'approved'`
4. Replace all `currentRole === 'hybrid'` checks with `capabilities.can_buy && capabilities.can_sell`
5. Replace all `currentRole === 'logistics'` checks with `capabilities.can_logistics && capabilities.logistics_status === 'approved'`
6. Update empty state messages to use capabilities
7. Update widget visibility conditions to use capabilities

**Estimated Changes:** ~21 instances of `currentRole` usage in UI rendering sections

### Priority 2: Update Dashboard Pages to Use RequireCapability
**Files:** 25+ dashboard pages

**Tasks:**
1. Replace `RequireDashboardRole` import with `RequireCapability`
2. Update guard props from `allow={[...]}` to `canBuy={true}`, `canSell={true}`, etc.
3. Test each page to ensure it works correctly

**Estimated Changes:** ~25 files, ~25 guard replacements

### Priority 3: Deprecate DashboardRoleContext
**Files:** `src/context/DashboardRoleContext.tsx`, `src/App.jsx`

**Tasks:**
1. Remove `DashboardRoleProvider` wrapper from `App.jsx` (after all pages updated)
2. Mark `DashboardRoleContext.tsx` as deprecated (or remove if unused)
3. Remove `RequireDashboardRole` guard (after all pages updated)

### Priority 4: Update Realtime Subscriptions
**File:** `src/hooks/useRealTimeData.js`

**Tasks:**
1. Add `ENABLE_REALTIME` flag (default: `true` for now, can be `false` for MVP)
2. Add capability checks before subscribing to channels
3. Only subscribe to capability-specific channels if capability exists

### Priority 5: Update Data Hooks (If Needed)
**Files:** Various dashboard pages

**Tasks:**
1. Review all data loading functions in dashboard pages
2. Ensure they use capabilities to determine which queries to run
3. Ensure they query by `company_id` only (no role assumptions)

---

## ✅ VERIFICATION STATUS

### Dashboard Entry ✅
- ✅ `/dashboard` loads instantly (verified: no infinite loops)
- ✅ WorkspaceDashboard renders (verified)
- ✅ CapabilityProvider provides capabilities (verified)

### Data Loading ✅
- ✅ KPIs load based on capabilities (verified in code)
- ✅ Charts load based on capabilities (verified in code)
- ✅ Orders/RFQs/Products queries use `company_id` (verified in code)

### Guard System ✅
- ✅ RequireCapability created and functional (verified)
- ✅ Never redirects (verified in code)
- ✅ Never blocks dashboard (verified in code)

### UI Rendering ⚠️
- ⚠️ Still uses role-based conditional rendering (21 instances pending)
- ⚠️ Widget visibility still role-based (pending update)

---

## 🎯 PHASE 5 COMPLETION CRITERIA

**Not Yet Complete:**
- ❌ All dashboard pages use `RequireCapability` (0/25 done)
- ❌ DashboardHome UI rendering uses capabilities (partial: data loading done, UI pending)
- ❌ DashboardRoleContext deprecated/removed (still in use)
- ❌ Realtime subscriptions are capability-aware (still subscribes to all)
- ❌ `ENABLE_REALTIME` flag added (not yet)

**Estimated Remaining Work:**
- ~21 UI rendering updates in DashboardHome
- ~25 guard replacements in dashboard pages
- ~1 context deprecation
- ~1 realtime subscription update

---

**Current Status: Foundation complete, implementation in progress**
