# Dashboard Components Migration Status

## ✅ COMPLETED

1. **src/contexts/AuthProvider.jsx** - Core auth provider ✅
2. **src/components/ProtectedRoute.jsx** - Uses AuthProvider ✅
3. **src/auth/PostLoginRouter.jsx** - Centralized routing ✅
4. **src/pages/dashboard/index.jsx** - Main dashboard entry ✅
5. **src/pages/dashboard/logistics-dashboard.jsx** - Example migration ✅
6. **src/pages/dashboard/DashboardHome.jsx** - Dashboard home ✅

## 🔄 IN PROGRESS

- **src/pages/dashboard/orders.jsx** - Needs migration
- **src/pages/dashboard/rfqs.jsx** - Needs migration
- **src/pages/dashboard/products.jsx** - Needs migration

## ⏳ PENDING (60+ files)

All other dashboard components need migration following the same pattern:

### Pattern:
```javascript
// BEFORE
import { getCurrentUserAndRole } from '@/utils/authHelpers';
const { user, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);

// AFTER
import { useAuth } from '@/contexts/AuthProvider';
const { user, profile, role, authReady, loading: authLoading } = useAuth();

useEffect(() => {
  // GUARD: Wait for auth
  if (!authReady || authLoading) return;
  if (!user) {
    navigate('/login');
    return;
  }
  
  // Now safe to query data
  const companyId = profile?.company_id;
  loadData(companyId);
}, [authReady, authLoading, user, profile, role]);
```

### Checklist per component:
- [ ] Replace `getCurrentUserAndRole` → `useAuth()`
- [ ] Add `authReady` guard before queries
- [ ] Replace loading spinner → `SpinnerWithTimeout`
- [ ] Remove `getSession()` / `onAuthStateChange()` duplicates
- [ ] Update dependencies in useEffect

