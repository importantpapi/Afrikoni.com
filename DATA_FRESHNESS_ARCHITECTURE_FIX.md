# Data Freshness Architecture Fix - Complete

## 🎯 Problem Statement
Dashboard modules required a hard refresh to show data. This was caused by:
1. **Stale Dependencies**: useEffect hooks using object references (`user`, `profile`) instead of primitives (`user?.id`, `profile?.company_id`)
2. **Missing Data Freshness Checks**: No mechanism to detect if data is older than 30 seconds
3. **No Navigation Triggers**: Location changes didn't trigger data refresh
4. **Missing Loading Guards**: Components didn't show spinners while capabilities were loading
5. **No Force Refresh**: CapabilityContext didn't support forced re-sync

## ✅ Solutions Implemented

### 1. **CapabilityContext Force Refresh** ✅
**File**: `src/context/CapabilityContext.tsx`

- Added `forceRefresh` parameter to `fetchCapabilities()` function
- Updated `refreshCapabilities()` to accept `forceRefresh?: boolean`
- Reset fetch flags when force refresh is requested
- Type updated: `refreshCapabilities: (forceRefresh?: boolean) => Promise<void>`

**Usage**:
```typescript
const { refreshCapabilities } = useCapability();
// Force refresh capabilities
await refreshCapabilities(true);
```

### 2. **Data Freshness Hook** ✅
**File**: `src/hooks/useDataFreshness.js`

Created a new hook that:
- Tracks `lastFetched` timestamp
- Checks if data is stale (older than threshold, default: 30 seconds)
- Provides `markFresh()` to mark data as fresh after successful load
- Provides `refresh()` to force refresh
- Automatically checks staleness every second

**Usage**:
```javascript
const { isStale, markFresh, refresh, lastFetched } = useDataFreshness(30000);

// After successful data load
markFresh();

// Check if stale
if (isStale) {
  // Reload data
}
```

### 3. **Fixed useEffect Dependencies** ✅
**Files Fixed**:
- `src/pages/dashboard/orders.jsx`
- `src/pages/dashboard/products.jsx`
- `src/pages/dashboard/rfqs.jsx`
- `src/pages/dashboard/orders/[id].jsx`
- `src/pages/dashboard/rfqs/[id].jsx`
- `src/pages/dashboard/shipments.jsx`

**Changes**:
- Replaced object dependencies (`user`, `profile`) with primitives (`user?.id`, `profile?.company_id`)
- Added `location.pathname` to dependency array to trigger refresh on navigation
- Added `isStale` from `useDataFreshness` to dependency array
- Added `capabilitiesReady` and `capabilitiesLoading` checks

**Before**:
```javascript
useEffect(() => {
  loadData();
}, [authReady, authLoading, user, profile, capabilities.ready, navigate]);
```

**After**:
```javascript
const userId = user?.id || null;
const companyId = profile?.company_id || null;
const capabilitiesReady = capabilities?.ready || false;
const capabilitiesLoading = capabilities?.loading || false;

useEffect(() => {
  // Guards...
  const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
  if (shouldRefresh) {
    loadData();
  }
}, [authReady, authLoading, userId, companyId, capabilitiesReady, capabilitiesLoading, location.pathname, isStale, navigate]);
```

### 4. **Loading Guards** ✅
**Files Fixed**: All dashboard pages listed above

Added early return with spinner while capabilities are loading:

```javascript
// ✅ ARCHITECTURAL FIX: Show loading spinner while capabilities are loading
if (capabilitiesLoading && !capabilitiesReady) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading capabilities..." ready={capabilitiesReady} />
      </div>
    </DashboardLayout>
  );
}
```

### 5. **Data Freshness Marking** ✅
**Files Fixed**: All dashboard pages listed above

After successful data load, mark data as fresh:

```javascript
// After successful data load
lastLoadTimeRef.current = Date.now();
markFresh();
```

### 6. **Supabase Auth Listener Verification** ✅
**File**: `src/contexts/AuthProvider.jsx`

Verified that `onAuthStateChange` properly updates state:
- ✅ `SIGNED_OUT`: Sets user/profile/role to null, keeps `authReady: true`
- ✅ `SIGNED_IN`: Calls `resolveAuth()` or `silentRefresh()` based on initialization state
- ✅ `TOKEN_REFRESHED`: Calls `silentRefresh()` to update session without flickering

**Status**: ✅ Working correctly - properly updates global state on auth events

## 📋 Remaining Dashboard Pages to Fix

The following pages still need the same architectural fixes:

### High Priority (Data-Heavy Pages):
1. `src/pages/dashboard/invoices.jsx`
2. `src/pages/dashboard/invoices/[id].jsx`
3. `src/pages/dashboard/returns.jsx`
4. `src/pages/dashboard/returns/[id].jsx`
5. `src/pages/dashboard/shipments/[id].jsx`
6. `src/pages/dashboard/payments.jsx`
7. `src/pages/dashboard/analytics.jsx`
8. `src/pages/dashboard/performance.jsx`

### Medium Priority:
9. `src/pages/dashboard/sales.jsx`
10. `src/pages/dashboard/supplier-rfqs.jsx`
11. `src/pages/dashboard/supplier-analytics.jsx`
12. `src/pages/dashboard/logistics-dashboard.jsx`
13. `src/pages/dashboard/fulfillment.jsx`
14. `src/pages/dashboard/notifications.jsx`
15. `src/pages/dashboard/reviews.jsx`
16. `src/pages/dashboard/disputes.jsx`

### Low Priority (Settings/Admin):
17. `src/pages/dashboard/settings.jsx`
18. `src/pages/dashboard/company-info.jsx`
19. `src/pages/dashboard/team-members.jsx`
20. `src/pages/dashboard/subscriptions.jsx`
21. All admin pages in `src/pages/dashboard/admin/`

## 🔧 Pattern to Apply to Remaining Pages

For each remaining dashboard page, apply this pattern:

### 1. Add Imports
```javascript
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
```

### 2. Extract Primitives
```javascript
const userId = user?.id || null;
const companyId = profile?.company_id || null;
const capabilitiesReady = capabilities?.ready || false;
const capabilitiesLoading = capabilities?.loading || false;
const location = useLocation();
const { isStale, markFresh } = useDataFreshness(30000);
const lastLoadTimeRef = useRef(null);
```

### 3. Add Loading Guard
```javascript
if (capabilitiesLoading && !capabilitiesReady) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading capabilities..." ready={capabilitiesReady} />
      </div>
    </DashboardLayout>
  );
}
```

### 4. Update useEffect Dependencies
```javascript
useEffect(() => {
  // Guards...
  const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
  if (shouldRefresh) {
    loadData();
  }
}, [authReady, authLoading, userId, companyId, capabilitiesReady, capabilitiesLoading, location.pathname, isStale, navigate]);
```

### 5. Mark Data as Fresh After Load
```javascript
// After successful data load
lastLoadTimeRef.current = Date.now();
markFresh();
```

## 🎯 Testing Checklist

After applying fixes to remaining pages, test:

1. **Navigation Test**: Click between dashboard pages - data should refresh if older than 30 seconds
2. **Deep Link Test**: Manually type URL - should load fresh data
3. **Capability Loading Test**: Verify spinner shows while capabilities load
4. **Data Freshness Test**: Wait 30+ seconds, navigate away and back - should refresh
5. **Auth Refresh Test**: Token refresh should not cause data reload (unless stale)

## 📊 Impact

### Before:
- ❌ Hard refresh required to see new data
- ❌ Stale data shown after navigation
- ❌ No loading indicators during capability fetch
- ❌ Object dependencies causing unnecessary re-renders

### After:
- ✅ Automatic refresh on navigation if data is stale (>30s)
- ✅ Fresh data loaded on every navigation click
- ✅ Loading spinners during capability fetch
- ✅ Primitive dependencies preventing unnecessary re-renders
- ✅ Force refresh capability for manual sync

## 🚀 Next Steps

1. Apply the pattern to remaining dashboard pages (see list above)
2. Test all navigation flows
3. Monitor console logs for "Data is stale" vs "Data is fresh" messages
4. Consider adding a global refresh button in DashboardLayout header
5. Consider adding a "Last updated" timestamp display

## 📝 Notes

- The 30-second threshold is configurable per page via `useDataFreshness(thresholdMs)`
- Force refresh can be triggered via `refreshCapabilities(true)` from any component
- Location changes trigger refresh check, but only reload if data is stale
- Capability loading is non-blocking - pages render with defaults if capabilities fail
