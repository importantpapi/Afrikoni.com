# Batch Migration Plan - Dashboard Components

## Strategy
Migrate high-traffic dashboard components first, then batch process the rest.

## Priority 1 (Critical - User-facing dashboards)
1. ✅ DashboardHome.jsx
2. ✅ orders.jsx
3. ✅ rfqs.jsx
4. ✅ products.jsx
5. ✅ settings.jsx
6. ✅ company-info.jsx

## Priority 2 (Important)
- sales.jsx
- shipments.jsx
- notifications.jsx

## Migration Pattern for Each:
1. Replace `getCurrentUserAndRole` → `useAuth()`
2. Add `authReady` guard before queries
3. Replace loading spinner → `SpinnerWithTimeout`
4. Remove `getSession()` / `onAuthStateChange()` duplicates

