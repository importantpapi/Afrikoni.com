# ✅ Auth Migration Guide - Centralized Auth System

## 🎯 Overview

We've implemented a **centralized AuthProvider** that enforces strict sequential auth resolution:
1. Session → 2. Profile → 3. Role → 4. Ready

This eliminates infinite loading spinners by ensuring:
- ✅ No queries run before auth is ready
- ✅ All loading states have mandatory timeouts
- ✅ Role is never null (fallback = "buyer")
- ✅ Single source of truth for auth state

## 📦 New Files Created

1. **`src/contexts/AuthProvider.jsx`** - Centralized auth context
2. **`src/components/ui/SpinnerWithTimeout.jsx`** - Loading spinner with mandatory timeout

## 🔄 Files Updated

1. **`src/App.jsx`** - Wrapped with AuthProvider
2. **`src/components/ProtectedRoute.jsx`** - Now uses AuthProvider
3. **`src/auth/PostLoginRouter.jsx`** - Uses AuthProvider, centralized routing
4. **`src/pages/dashboard/logistics-dashboard.jsx`** - Example migration

## 📋 Migration Checklist for Remaining Components

### Pattern to Follow:

**BEFORE:**
```javascript
import { getCurrentUserAndRole } from '@/utils/authHelpers';

const { user, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
if (!user) {
  navigate('/login');
  return;
}
```

**AFTER:**
```javascript
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';

const { user, profile, role, authReady, loading: authLoading } = useAuth();

// Guard: Wait for auth
useEffect(() => {
  if (!authReady || authLoading) return;
  if (!user) {
    navigate('/login');
    return;
  }
  
  // Now safe to query data
  loadData();
}, [authReady, authLoading, user, profile, role]);
```

## 🔍 Components Needing Migration

### High Priority (Dashboard Components):

1. **`src/pages/dashboard/index.jsx`**
   - Replace `getCurrentUserAndRole` with `useAuth`
   - Add `authReady` guard

2. **`src/pages/dashboard/DashboardHome.jsx`**
   - Replace `getCurrentUserAndRole` with `useAuth`
   - Guard queries with `authReady`

3. **`src/pages/dashboard/fulfillment.jsx`**
   - Already updated but verify `authReady` guards are in place

4. **`src/pages/dashboard/company-info.jsx`**
   - Replace auth checks with `useAuth`
   - Add timeout protection

5. **`src/pages/dashboard/orders.jsx`**
   - Replace `getCurrentUserAndRole` with `useAuth`
   - Guard queries

6. **`src/pages/dashboard/rfqs.jsx`**
   - Replace `getCurrentUserAndRole` with `useAuth`
   - Guard queries

### Medium Priority:

7. **`src/pages/dashboard/products.jsx`**
8. **`src/pages/dashboard/sales.jsx`**
9. **`src/pages/dashboard/shipments.jsx`**
10. **`src/pages/dashboard/notifications.jsx`**

### Low Priority (Can wait):

- Other dashboard sub-pages
- Marketplace pages (less critical)

## 🛡️ Rules to Enforce

1. **NO `supabase.auth.getSession()` outside AuthProvider**
2. **NO `onAuthStateChange()` outside AuthProvider**
3. **ALL queries must wait for `authReady === true`**
4. **ALL loading states must use `SpinnerWithTimeout` or have manual timeout**
5. **Role is NEVER null after authReady (fallback = "buyer")**

## ✅ Testing Checklist

After migration, verify:
- [ ] No infinite loading spinners
- [ ] All dashboards load within 5 seconds or show error
- [ ] Console shows "[AUTH PROVIDER] ✅ AUTH READY" on page load
- [ ] Role-based routing works correctly
- [ ] No duplicate auth calls in Network tab

## 🚀 Next Steps

1. Migrate high-priority dashboard components
2. Test each dashboard after migration
3. Remove old `getCurrentUserAndRole` calls once all components migrated
4. Update UserContext to use AuthProvider internally (optional consolidation)

