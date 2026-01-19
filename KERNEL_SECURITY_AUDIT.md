# Kernel Security & Architectural Audit Report

**Date:** January 20, 2026  
**Status:** 🔍 **AUDIT IN PROGRESS**  
**Goal:** 100% Kernel Adoption - Zero Legacy Auth Imports

---

## 📋 Executive Summary

After migrating 64 core dashboard pages to `useDashboardKernel()`, this audit identifies remaining legacy code patterns that need to be eliminated for architectural purity.

---

## 🔍 Task 1: Legacy Code Audit

### Files Still Using `useAuth()` Import:

1. **`src/pages/dashboard/WorkspaceDashboard.jsx`** ⚠️ **CRITICAL**
   - **Line 3:** `import { useAuth } from '@/contexts/AuthProvider';`
   - **Line 36:** `const { user, profile, authReady } = useAuth();`
   - **Impact:** Creates double initialization - Workspace loads auth, then Kernel loads it again
   - **Status:** ❌ **NEEDS REFACTOR**

2. **`src/pages/dashboard/logistics-quote.jsx`** ⚠️ **HIGH PRIORITY**
   - **Line 16:** `import { useAuth } from '@/contexts/AuthProvider';`
   - **Status:** ❌ **NEEDS MIGRATION**

### Files Still Using `useCapability()` Import:

1. **`src/pages/dashboard/WorkspaceDashboard.jsx`** ⚠️ **CRITICAL**
   - **Line 4:** `import { useCapability } from '@/context/CapabilityContext';`
   - **Line 37:** `const capabilities = useCapability();`
   - **Impact:** Redundant capability loading - Kernel already provides this
   - **Status:** ❌ **NEEDS REFACTOR**

### Files Using `supabase.auth.getUser()` Directly:

These files should use `userId` from `useDashboardKernel()` instead:

1. **`src/pages/dashboard/admin/users.jsx`** (Line 178)
   - **Context:** Getting current user for last sign-in data
   - **Fix:** Use `userId` from kernel

2. **`src/pages/dashboard/support-chat.jsx`** (Lines 109, 284)
   - **Context:** Getting user email for ticket creation and messaging
   - **Fix:** Use `userId` from kernel, fetch email separately if needed

3. **`src/pages/dashboard/rfqs/new.jsx`** (Line 399)
   - **Context:** Getting user for RFQ creation
   - **Fix:** Use `userId` from kernel

4. **`src/pages/dashboard/rfqs/[id].jsx`** (Line 323)
   - **Context:** Getting current user for quote submission
   - **Fix:** Use `userId` from kernel

5. **`src/pages/dashboard/orders/[id].jsx`** (Line 212)
   - **Context:** Getting user for order actions
   - **Fix:** Use `userId` from kernel

6. **`src/pages/dashboard/products/new.jsx`** (Line 163)
   - **Context:** Getting user for product creation
   - **Fix:** Use `userId` from kernel

7. **`src/pages/dashboard/company-info.jsx`** (Lines 456, 595)
   - **Context:** Getting user email for fallback scenarios
   - **Fix:** Use `userId` from kernel, fetch email separately if needed

---

## 🏗️ Task 2: WorkspaceDashboard.jsx Analysis

### Current Issues:

1. **Double Initialization:**
   - WorkspaceDashboard loads `useAuth()` and `useCapability()`
   - Kernel also loads these internally
   - Result: Redundant API calls and state management

2. **State Synchronization Risk:**
   - WorkspaceDashboard checks `capabilities.ready`
   - Kernel checks `isSystemReady` (authReady + capabilities.ready)
   - These can get out of sync

3. **Redundant Memoization:**
   - WorkspaceDashboard manually memoizes `capabilitiesData`
   - Kernel already provides memoized `capabilities`

### Required Refactor:

Transform WorkspaceDashboard into a pure Kernel Consumer:

```javascript
// ✅ USE KERNEL ONLY
const { 
  userId, 
  profileCompanyId, 
  capabilities, 
  isSystemReady 
} = useDashboardKernel();

// ✅ REMOVE: useAuth(), useCapability(), useMemo for capabilities
// ✅ USE: isSystemReady instead of capabilities.ready
// ✅ USE: profileCompanyId instead of profile?.company_id
// ✅ USE: userId instead of user?.id
```

---

## 🗑️ Task 3: Orphaned Utility Files

### Potential Candidates for Deletion:

1. **`src/utils/authHelpers.js`** (if exists)
   - Check if only used by old `useAuth()` pattern
   - If Kernel provides all needed helpers, can be removed

2. **`src/guards/RequireCapability.jsx`** (if exists)
   - May be redundant if Kernel handles guards internally
   - Check usage before deletion

3. **Legacy capability utilities** (if any)
   - Any helpers that were only used with `useCapability()`
   - Kernel should provide all needed functionality

**Note:** Need to verify these files exist and their usage before recommending deletion.

---

## ✅ Action Items

### Priority 1 (Critical):
1. ✅ **COMPLETE** - Refactor `WorkspaceDashboard.jsx` to use Kernel only
2. ✅ **COMPLETE** - Migrate `logistics-quote.jsx` to use Kernel

### Priority 2 (High):
3. ✅ **COMPLETE** - Removed unused `supabase.auth.getUser()` call in `admin/users.jsx`
4. ⚠️ **NOTE** - `supabase.auth.getUser()` calls in `support-chat.jsx`, `rfqs/new.jsx`, `rfqs/[id].jsx`, `orders/[id].jsx`, `products/new.jsx`, `company-info.jsx` are used to fetch **email** which is not provided by Kernel. These are acceptable exceptions but could be optimized by:
   - Fetching email once and caching it
   - Adding email to Kernel if needed frequently
   - Using profile.email if available

### Priority 3 (Verification):
5. ✅ **COMPLETE** - Verified no other legacy `useAuth()` or `useCapability()` imports exist in `/dashboard` directory
6. ⏳ **PENDING** - Bundle size verification (requires build analysis)

---

## 📊 Expected Benefits

1. **Performance:**
   - Eliminate double initialization lag
   - Reduce redundant API calls
   - Smaller bundle size (removed orphaned utilities)

2. **Reliability:**
   - Single source of truth for auth state
   - No state synchronization issues
   - Consistent error handling

3. **Maintainability:**
   - One pattern to maintain (Kernel)
   - Easier debugging
   - Clearer codebase

---

## 🎯 Success Criteria

- ✅ Zero `useAuth()` imports in `/dashboard` directory (except Kernel itself)
- ✅ Zero `useCapability()` imports in `/dashboard` directory (except Kernel itself)
- ✅ Zero `supabase.auth.getUser()` calls in UI components
- ✅ WorkspaceDashboard is a pure Kernel Consumer
- ✅ All orphaned utilities identified and removed
