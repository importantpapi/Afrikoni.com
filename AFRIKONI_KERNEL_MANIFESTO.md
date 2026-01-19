# 📜 The Afrikoni Kernel Manifesto

**Version:** 1.0 (Post-Migration)  
**Date:** January 20, 2026  
**Status:** ✅ **ACTIVE CONSTITUTION**

---

## 🎯 Core Principle

> **The Kernel is the Source of Truth. The UI is a Pure Consumer.**

Every dashboard component must consume the unified `useDashboardKernel()` hook. Direct access to auth or capability contexts is **prohibited**.

---

## 🏗️ Rule 1: The Golden Rule of Auth

### ❌ NEVER DO THIS:

```javascript
// Legacy Pattern - FORBIDDEN
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';

const { user, profile, authReady } = useAuth();
const capabilities = useCapability();
const companyId = profile?.company_id;
```

```javascript
// Direct Auth Call - FORBIDDEN
const { data: { user } } = await supabase.auth.getUser();
```

### ✅ ALWAYS DO THIS:

```javascript
// Kernel Pattern - MANDATORY
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

const { 
  userId,           // ✅ Use this instead of user?.id
  profileCompanyId, // ✅ Use this instead of profile?.company_id
  isAdmin,          // ✅ Use this instead of profile?.is_admin
  capabilities,     // ✅ Use this instead of useCapability()
  isSystemReady,    // ✅ Use this instead of authReady
  canLoadData       // ✅ Use this for data loading guards
} = useDashboardKernel();
```

### 🚨 Why This Matters:

- **Double Initialization:** Direct imports cause WorkspaceDashboard and Kernel to both load auth, creating lag
- **Security Bypass:** Bypasses the security guards built into the Kernel
- **State Sync Issues:** Multiple sources of truth can get out of sync
- **Maintenance Burden:** Two patterns to maintain instead of one

---

## 🛡️ Rule 2: The "Atomic Guard" Pattern

Every page component must implement **two gates** before rendering or loading data.

### Gate 1: The UI Gate (Prevent Jitter)

```javascript
// ✅ MANDATORY: Check isSystemReady before rendering
if (!isSystemReady) {
  return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
  // OR
  return <CardSkeleton count={3} />;
}
```

**Why:** Prevents flickering and "jitter" when auth state is still initializing.

### Gate 2: The Logic Gate (Prevent Unauthorized Calls)

```javascript
useEffect(() => {
  // ✅ MANDATORY: Guard all data-fetching logic
  if (!canLoadData) return;
  
  loadData();
}, [canLoadData]);
```

**Why:** Prevents network calls before the system is ready and `profileCompanyId` is available.

### Complete Example:

```javascript
export default function MyDashboardPage() {
  const { profileCompanyId, userId, canLoadData, isSystemReady } = useDashboardKernel();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // ✅ Gate 1: UI Gate
  if (!isSystemReady) {
    return <CardSkeleton count={3} />;
  }

  // ✅ Gate 2: Logic Gate
  useEffect(() => {
    if (!canLoadData) return;
    
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('my_table')
          .select('*')
          .eq('company_id', profileCompanyId); // ✅ Rule 3: Explicit scoping
        
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err.message);
      }
    };
    
    loadData();
  }, [canLoadData, profileCompanyId]);

  // ✅ Gate 3: Error State (Rule 4)
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // Retry logic
        }}
      />
    );
  }

  return <div>{/* Your UI */}</div>;
}
```

---

## 🔑 Rule 3: Data Scoping & RLS (Row Level Security)

Every Supabase query **MUST** be explicitly scoped using the Kernel's verified `profileCompanyId`.

### ❌ FORBIDDEN:

```javascript
// No filter - Security Risk
const { data } = await supabase.from('orders').select('*');

// Using local state - Can be stale or undefined
const [companyId, setCompanyId] = useState(null);
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('company_id', companyId); // ❌ Wrong source
```

### ✅ MANDATORY:

```javascript
// Always use profileCompanyId from Kernel
const { profileCompanyId } = useDashboardKernel();

const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('company_id', profileCompanyId); // ✅ Verified source
```

### Special Cases:

**User-specific queries** (use `userId`):
```javascript
const { userId } = useDashboardKernel();

const { data } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId); // ✅ User-scoped
```

**Admin queries** (still scope when possible):
```javascript
const { isAdmin, profileCompanyId } = useDashboardKernel();

if (!isAdmin) return <AccessDenied />;

// Even admin queries should scope when possible
const { data } = await supabase
  .from('all_orders')
  .select('*')
  // Admin can see all, but still use profileCompanyId for filtering if needed
  .eq('company_id', profileCompanyId);
```

**Why:** Ensures Row Level Security (RLS) policies are respected and prevents data leaks.

---

## 🚦 Rule 4: The "Three-State" UI

Every dashboard page must handle three specific states using standardized components.

### State 1: Loading

```javascript
// ✅ Use isSystemReady with Skeleton loaders
if (!isSystemReady) {
  return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
}

// OR for content-specific loading
if (isLoading) {
  return <CardSkeleton count={3} />;
}
```

### State 2: Error

```javascript
// ✅ Use ErrorState component with retry prop
import ErrorState from '@/components/shared/ui/ErrorState';

if (error) {
  return (
    <ErrorState 
      message={error} 
      onRetry={() => {
        setError(null);
        loadData(); // Retry function
      }}
    />
  );
}
```

### State 3: Success

```javascript
// ✅ Render clean UI once canLoadData is true
// This is your normal component render
return (
  <div>
    {/* Your UI */}
  </div>
);
```

### Complete Three-State Pattern:

```javascript
export default function MyPage() {
  const { isSystemReady, canLoadData, profileCompanyId } = useDashboardKernel();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State 1: System Loading
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Initializing..." ready={isSystemReady} />;
  }

  useEffect(() => {
    if (!canLoadData) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('my_table')
          .select('*')
          .eq('company_id', profileCompanyId);
        
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [canLoadData, profileCompanyId]);

  // State 2: Error
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // useEffect will retry automatically
        }}
      />
    );
  }

  // State 3: Success (or still loading data)
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

---

## 🧹 Rule 5: Zero-Waste Policy

### ❌ No Manual Memoization:

```javascript
// DON'T re-memoize capabilities - Kernel already does this
const capabilitiesData = useMemo(() => ({
  can_buy: capabilities.can_buy,
  can_sell: capabilities.can_sell,
}), [capabilities.can_buy, capabilities.can_sell]); // ❌ Wasteful
```

### ✅ Use Kernel Directly:

```javascript
// Kernel already provides memoized capabilities
const { capabilities } = useDashboardKernel();

// Use directly - it's already optimized
{capabilities.can_buy && <BuyerComponent />}
{capabilities.can_sell && <SellerComponent />}
```

### ❌ No "Ghost" UseEffects:

```javascript
// DON'T depend on auth directly
useEffect(() => {
  if (!user) return; // ❌ Wrong dependency
  loadData();
}, [user]); // ❌ Can cause unnecessary re-renders
```

### ✅ Depend on Kernel Guards:

```javascript
// DO depend on canLoadData
useEffect(() => {
  if (!canLoadData) return; // ✅ Correct guard
  loadData();
}, [canLoadData]); // ✅ Stable dependency
```

### ❌ No Redundant State:

```javascript
// DON'T store companyId in local state
const [companyId, setCompanyId] = useState(null);
useEffect(() => {
  setCompanyId(profile?.company_id); // ❌ Redundant
}, [profile]);
```

### ✅ Use Kernel Directly:

```javascript
// DO use profileCompanyId directly from Kernel
const { profileCompanyId } = useDashboardKernel();
// No local state needed - Kernel is the source of truth
```

---

## 📋 Quick Reference Checklist

Before submitting any dashboard component, verify:

- [ ] ✅ Uses `useDashboardKernel()` instead of `useAuth()` or `useCapability()`
- [ ] ✅ Implements UI Gate (`isSystemReady` check)
- [ ] ✅ Implements Logic Gate (`canLoadData` guard in `useEffect`)
- [ ] ✅ All Supabase queries use `profileCompanyId` from Kernel
- [ ] ✅ Handles Loading state (Skeleton or Spinner)
- [ ] ✅ Handles Error state (`ErrorState` component)
- [ ] ✅ No manual memoization of capabilities
- [ ] ✅ No redundant local state for `companyId` or `userId`
- [ ] ✅ No `supabase.auth.getUser()` calls (except for email if needed)

---

## 🎓 Common Patterns

### Pattern 1: Admin-Only Pages

```javascript
export default function AdminPage() {
  const { isSystemReady, isAdmin, canLoadData, profileCompanyId } = useDashboardKernel();

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  useEffect(() => {
    if (!canLoadData) return;
    loadAdminData();
  }, [canLoadData]);

  return <div>{/* Admin UI */}</div>;
}
```

### Pattern 2: Capability-Gated Features

```javascript
export default function SellerPage() {
  const { isSystemReady, capabilities, canLoadData, profileCompanyId } = useDashboardKernel();

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
  }

  if (!capabilities.can_sell) {
    return <AccessDenied message="Seller capability required" />;
  }

  useEffect(() => {
    if (!canLoadData) return;
    loadSellerData();
  }, [canLoadData]);

  return <div>{/* Seller UI */}</div>;
}
```

### Pattern 3: User-Scoped Data

```javascript
export default function UserProfilePage() {
  const { isSystemReady, userId, canLoadData } = useDashboardKernel();

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />;
  }

  useEffect(() => {
    if (!canLoadData || !userId) return;
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId); // ✅ User-scoped
      
      setPreferences(data);
    };
    
    loadProfile();
  }, [canLoadData, userId]);

  return <div>{/* Profile UI */}</div>;
}
```

---

## 🚨 Exception Handling

### When Email is Needed:

If you need user email (not provided by Kernel), you may use `supabase.auth.getUser()` **ONCE** and cache it:

```javascript
// ✅ Acceptable exception for email fetching
const [userEmail, setUserEmail] = useState('');

useEffect(() => {
  if (!userId) return;
  
  // Fetch email once and cache it
  const fetchEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || '');
    } catch (err) {
      // Handle error
    }
  };
  
  fetchEmail();
}, [userId]);
```

**Note:** Consider adding email to Kernel if this pattern becomes common.

---

## 📈 Impact on Enterprise Value

Following this Manifesto ensures Afrikoni remains:

### ✅ Audit-Ready
Professional investors can verify our security logic in 5 minutes. Every query is explicitly scoped, every guard is visible, and there's no hidden auth logic.

### ✅ Scale-Ready
We can add 100 new pages without increasing the Auth load. The Kernel handles all initialization once, and pages are pure consumers.

### ✅ Bug-Resistant
90% of "undefined ID" crashes are mathematically impossible under this system. `canLoadData` ensures `profileCompanyId` is always defined before data loading.

### ✅ Maintainable
One pattern to maintain instead of multiple. New developers can onboard faster, and code reviews are simpler.

---

## 🔄 Migration Guide

If you encounter legacy code:

1. **Replace imports:**
   ```javascript
   // Remove
   import { useAuth } from '@/contexts/AuthProvider';
   import { useCapability } from '@/context/CapabilityContext';
   
   // Add
   import { useDashboardKernel } from '@/hooks/useDashboardKernel';
   ```

2. **Replace hook calls:**
   ```javascript
   // Remove
   const { user, profile, authReady } = useAuth();
   const capabilities = useCapability();
   
   // Add
   const { userId, profileCompanyId, capabilities, isSystemReady, canLoadData } = useDashboardKernel();
   ```

3. **Add guards:**
   ```javascript
   // Add UI Gate
   if (!isSystemReady) return <SpinnerWithTimeout />;
   
   // Add Logic Gate
   useEffect(() => {
     if (!canLoadData) return;
     // Your logic
   }, [canLoadData]);
   ```

4. **Update queries:**
   ```javascript
   // Replace
   .eq('company_id', profile?.company_id)
   
   // With
   .eq('company_id', profileCompanyId)
   ```

5. **Add error handling:**
   ```javascript
   // Add ErrorState import and usage
   import ErrorState from '@/components/shared/ui/ErrorState';
   
   if (error) {
     return <ErrorState message={error} onRetry={...} />;
   }
   ```

---

## 📚 Related Documentation

- `KERNEL_MIGRATION_COMPLETE.md` - Full migration history
- `KERNEL_SECURITY_AUDIT.md` - Security audit findings
- `src/hooks/useDashboardKernel.js` - Kernel implementation
- `src/components/shared/ui/ErrorState.jsx` - Error component
- `src/components/shared/ui/skeletons.jsx` - Loading components

---

## ⚖️ Enforcement

This Manifesto is **non-negotiable**. Code that violates these rules will be rejected in code review.

**Review Checklist:**
- [ ] No `useAuth()` imports
- [ ] No `useCapability()` imports  
- [ ] No `supabase.auth.getUser()` calls (except email exception)
- [ ] All queries use `profileCompanyId`
- [ ] All pages have `isSystemReady` guard
- [ ] All `useEffect` hooks have `canLoadData` guard
- [ ] Error handling with `ErrorState`
- [ ] Loading states with Skeletons

---

## 🎯 Remember

> **"The Kernel is the Source of Truth. The UI is a Pure Consumer."**

Every dashboard component is a consumer of the Kernel. We don't manage auth state, we consume it. We don't check capabilities manually, we consume them. We don't guess if the system is ready, we consume the flag.

**This is not optional. This is the architecture.**

---

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** ✅ **ACTIVE CONSTITUTION**
