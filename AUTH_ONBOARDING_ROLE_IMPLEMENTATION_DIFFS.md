# 🔐 AUTHENTICATION, ONBOARDING & ROLE LOGIC — IMPLEMENTATION DIFFS
## PHASE 2 — CLUSTER 6: Step 3 (Implementation)

**Status:** ⏳ **READY FOR APPROVAL**

---

## 📋 IMPLEMENTATION PLAN

This document contains all DIFFS for implementing centralized auth/role logic and fixing onboarding flow.

**Total Files to Modify:** 8 files  
**New Files to Create:** 2 files  
**Total Changes:** ~300 lines modified, ~150 lines added

---

## ✅ NEW FILES CREATED

### 1. `src/utils/authHelpers.js` ✅ CREATED

**Purpose:** Centralized authentication and user profile fetching

**Key Functions:**
- `getCurrentUserAndRole()` - Fetches user, role, companyId, onboarding status
- `hasCompletedOnboarding()` - Checks onboarding completion
- `requireAuth()` - Requires authentication, redirects if not
- `requireOnboarding()` - Requires onboarding completion, redirects if not

**Status:** ✅ **Already created** (see file contents above)

---

### 2. `src/utils/roleHelpers.js` ✅ CREATED

**Purpose:** Centralized role detection and helper functions

**Key Functions:**
- `getUserRole()` - Normalizes role from profile
- `isBuyer()`, `isSeller()`, `isHybrid()`, `isLogistics()` - Role type checks
- `canViewBuyerFeatures()`, `canViewSellerFeatures()` - Feature visibility
- `shouldLoadBuyerData()`, `shouldLoadSellerData()` - Data loading decisions

**Status:** ✅ **Already created** (see file contents above)

---

## 📝 FILES TO MODIFY

### 3. `src/pages/login.jsx` — Add Onboarding Check

**Change:** After successful login, check `onboarding_completed` and redirect accordingly.

**DIFF:**
```diff
--- src/pages/login.jsx
+++ src/pages/login.jsx
@@ -1,6 +1,7 @@
 import React, { useState } from 'react';
 import { useNavigate, useSearchParams, Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
+import { getCurrentUserAndRole, hasCompletedOnboarding } from '@/utils/authHelpers';
 import { supabase, supabaseHelpers } from '@/api/supabaseClient';
 import { Button } from '@/components/ui/button';
@@ -30,10 +31,20 @@
       const { data, error } = await supabaseHelpers.auth.signIn(email, password);
       if (error) throw error;
 
       toast.success('Logged in successfully!');
       
-      // Simple redirect - let dashboard handle routing
-      navigate('/dashboard');
+      // Check onboarding status and redirect accordingly
+      const { user, onboardingCompleted } = await getCurrentUserAndRole();
+      
+      if (!onboardingCompleted) {
+        navigate('/onboarding');
+      } else {
+        navigate('/dashboard');
+      }
     } catch (error) {
       // Error logged (removed for production)
       toast.error(error.message || 'Failed to login');
```

**What Changed:**
- ✅ Added import for `getCurrentUserAndRole` and `hasCompletedOnboarding`
- ✅ After login, fetch user profile
- ✅ Check `onboarding_completed` status
- ✅ Redirect to `/onboarding` if not completed, `/dashboard` if completed

**Why It's Safer:**
- Ensures users complete onboarding before accessing dashboard
- Single source of truth for onboarding check
- Clear redirect logic

---

### 4. `src/pages/signup.jsx` — Add Onboarding Redirect & Flag

**Change:** Set `onboarding_completed: false` on profile creation and redirect to `/onboarding`.

**DIFF:**
```diff
--- src/pages/signup.jsx
+++ src/pages/signup.jsx
@@ -56,18 +56,19 @@
       // Wait for session to be established
       if (data?.session) {
         // Create profile in profiles table using UPSERT
         const { error: profileError } = await supabase
           .from('profiles')
           .upsert({
             id: data.user.id,
             full_name: formData.fullName,
-            role: 'buyer' // Default role
+            role: 'buyer', // Default role
+            onboarding_completed: false // Must complete onboarding
           }, { onConflict: 'id' });
 
         if (profileError) {
           // Error logged (removed for production)
           // Don't fail signup if profile creation fails - user can still proceed
         }
 
-        toast.success('Account created successfully! Redirecting to dashboard...');
-        navigate('/dashboard');
+        toast.success('Account created successfully!');
+        navigate('/onboarding');
       } else {
         toast.success('Please check your email to confirm your account');
         navigate('/login');
```

**What Changed:**
- ✅ Added `onboarding_completed: false` to profile creation
- ✅ Changed redirect from `/dashboard` to `/onboarding`
- ✅ Updated success message

**Why It's Safer:**
- Ensures all new users go through onboarding
- Sets onboarding flag explicitly
- Prevents users from skipping setup

---

### 5. `src/pages/dashboard/index.jsx` — Use Helpers & Add Onboarding Check

**Change:** Replace duplicated role detection with centralized helpers and add onboarding check.

**DIFF:**
```diff
--- src/pages/dashboard/index.jsx
+++ src/pages/dashboard/index.jsx
@@ -1,8 +1,9 @@
 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
-import { supabase, supabaseHelpers } from '@/api/supabaseClient';
+import { getCurrentUserAndRole, requireOnboarding } from '@/utils/authHelpers';
+import { getUserRole } from '@/utils/roleHelpers';
 import ErrorBoundary from '@/components/ErrorBoundary';
 import DashboardLayout from '@/layouts/DashboardLayout';
 import DashboardHome from './DashboardHome';
@@ -13,78 +14,30 @@
   const navigate = useNavigate();
 
   useEffect(() => {
     checkAuthAndLoadRole();
   }, []);
 
   const checkAuthAndLoadRole = async () => {
     try {
-      // Check if user has a session
-      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
-      
-      if (sessionError || !session) {
+      // Use centralized helper - requires auth and onboarding
+      const authResult = await requireOnboarding(navigate);
+      if (!authResult) return; // Redirected to login or onboarding
+      
+      const { user, role, companyId } = authResult;
+      
+      // Set role for dashboard
+      setCurrentRole(role);
+    } catch (error) {
+      // Error logged (removed for production)
+      navigate('/login');
+    } finally {
+      setIsLoading(false);
+    }
+  };
+
+   const renderDashboardContent = () => {
+     // Use the new enterprise dashboard home
+     return <DashboardHome currentRole={currentRole} />;
+   };
+
+   if (isLoading) {
+     return (
+       <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
+         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
+       </div>
+     );
+   }
+
+   return (
+     <DashboardLayout currentRole={currentRole}>
+       <ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again.">
+         {renderDashboardContent()}
+       </ErrorBoundary>
+     </DashboardLayout>
+   );
+ }
```

**What Changed:**
- ✅ Removed 60+ lines of duplicated role detection logic
- ✅ Replaced with `requireOnboarding()` helper
- ✅ Helper handles: session check, profile fetch, onboarding check, company fetch
- ✅ Much cleaner and maintainable

**Why It's Safer:**
- Single source of truth for auth/onboarding checks
- Consistent error handling
- Automatically redirects if not authenticated or onboarding incomplete
- Reduces code duplication by 60+ lines

---

### 6. `src/pages/dashboard/DashboardHome.jsx` — Use Helpers

**Change:** Replace duplicated role detection and use role helpers for hybrid logic.

**DIFF (Key Sections):**
```diff
--- src/pages/dashboard/DashboardHome.jsx
+++ src/pages/dashboard/DashboardHome.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect, useCallback, useRef } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import { getCurrentUserAndRole } from '@/utils/authHelpers';
+import { getUserRole, shouldLoadBuyerData, shouldLoadSellerData, isHybrid } from '@/utils/roleHelpers';
 import { motion } from 'framer-motion';
@@ -51,66 +52,20 @@
   const loadDashboardData = useCallback(async () => {
     if (loadingRef.current) return; // Prevent concurrent loads
     loadingRef.current = true;
     
     try {
       setIsLoading(true);
       
-      // Check if user is authenticated first
-      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
-      if (authError || !authUser) {
-        navigate('/login');
-        return;
-      }
-
-      // Try to get user data with profile
-      let userData = null;
-      try {
-        userData = await supabaseHelpers.auth.me();
-      } catch (profileError) {
-        // Fallback to auth user if profile doesn't exist
-        userData = {
-          id: authUser.id,
-          email: authUser.email,
-          role: 'buyer', // default role
-          user_role: 'buyer'
-        };
-      }
-
-      if (!userData) {
-        navigate('/login');
-        return;
-      }
-      setUser(userData);
-
-      const { getOrCreateCompany } = await import('@/utils/companyHelper');
-      let userCompanyId = null;
-      try {
-        userCompanyId = await getOrCreateCompany(supabase, userData);
-      } catch (companyError) {
-        // Continue without company ID - some features won't work but dashboard can still load
-      }
-      setCompanyId(userCompanyId);
+      // Use centralized helper
+      const { user: userData, role, companyId: userCompanyId } = await getCurrentUserAndRole();
+      
+      if (!userData) {
+        navigate('/login');
+        return;
+      }
+      
+      setUser(userData);
+      setCompanyId(userCompanyId);
```

**DIFF (Role Detection in loadStats):**
```diff
   const loadStats = async (userData, companyId) => {
     try {
-      const role = userData.role || userData.user_role || 'buyer';
-      const statsData = [];
-      const isHybrid = role === 'hybrid';
-      // Always load all stats for hybrid users, filter in useMemo
-      const showBuyerStats = isHybrid ? true : (role === 'buyer');
-      const showSellerStats = isHybrid ? true : (role === 'seller');
+      const role = getUserRole(userData);
+      const statsData = [];
+      const userIsHybrid = isHybrid(role);
+      
+      // Use helper functions for data loading decisions
+      const showBuyerStats = shouldLoadBuyerData(role, viewMode);
+      const showSellerStats = shouldLoadSellerData(role, viewMode);
```

**What Changed:**
- ✅ Removed 40+ lines of duplicated auth/role detection
- ✅ Uses `getCurrentUserAndRole()` helper
- ✅ Uses `getUserRole()`, `shouldLoadBuyerData()`, `shouldLoadSellerData()` helpers
- ✅ Cleaner hybrid logic

**Why It's Safer:**
- Consistent role detection
- Centralized logic
- Easier to maintain
- Reduces code duplication

---

### 7. `src/components/ProtectedRoute.jsx` — Add Optional Onboarding Check

**Change:** Add optional `requireOnboarding` prop to ProtectedRoute.

**DIFF:**
```diff
--- src/components/ProtectedRoute.jsx
+++ src/components/ProtectedRoute.jsx
@@ -1,11 +1,13 @@
 import React, { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
-import { supabase, supabaseHelpers } from '@/api/supabaseClient';
+import { requireAuth, requireOnboarding } from '@/utils/authHelpers';
 
-export default function ProtectedRoute({ children }) {
+export default function ProtectedRoute({ children, requireOnboarding: needsOnboarding = false }) {
   const [isLoading, setIsLoading] = useState(true);
   const [isAuthorized, setIsAuthorized] = useState(false);
   const navigate = useNavigate();
 
   useEffect(() => {
     checkAuth();
   }, []);
 
   const checkAuth = async () => {
     try {
-      // Check session first
-      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
-      
-      if (sessionError || !session) {
-        navigate('/login');
-        return;
-      }
-
-      // User is authorized - no onboarding checks
-      setIsAuthorized(true);
+      // Use centralized helpers
+      if (needsOnboarding) {
+        const result = await requireOnboarding(navigate);
+        if (!result) return; // Redirected
+        setIsAuthorized(true);
+      } else {
+        const result = await requireAuth(navigate);
+        if (!result) return; // Redirected
+        setIsAuthorized(true);
+      }
     } catch (error) {
       // Error logged (removed for production)
       navigate('/login');
```

**What Changed:**
- ✅ Added `requireOnboarding` prop (optional, defaults to `false`)
- ✅ Uses centralized `requireAuth()` and `requireOnboarding()` helpers
- ✅ Removed duplicated session check logic

**Why It's Safer:**
- Can optionally require onboarding for specific routes
- Consistent auth checks
- Less code duplication

**Usage:**
```jsx
// Route that requires onboarding
<Route path="/dashboard" element={
  <ProtectedRoute requireOnboarding>
    <Dashboard />
  </ProtectedRoute>
} />

// Route that only requires auth
<Route path="/messages" element={
  <ProtectedRoute>
    <Messages />
  </ProtectedRoute>
} />
```

---

### 8. `src/pages/dashboard/rfqs.jsx` — Use Role Helpers

**Change:** Replace duplicated role detection with helpers.

**DIFF:**
```diff
--- src/pages/dashboard/rfqs.jsx
+++ src/pages/dashboard/rfqs.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import { getCurrentUserAndRole } from '@/utils/authHelpers';
+import { getUserRole, canViewBuyerFeatures, canViewSellerFeatures } from '@/utils/roleHelpers';
 import { motion } from 'framer-motion';
@@ -43,15 +44,10 @@
   const loadUserAndRFQs = async () => {
     try {
-      const userData = await supabaseHelpers.auth.me();
+      const { user: userData, role, companyId } = await getCurrentUserAndRole();
       if (!userData) {
         navigate('/login');
         return;
       }
 
-      const role = userData.role || userData.user_role || 'buyer';
-      const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;
-      setCurrentRole(normalizedRole);
+      const normalizedRole = getUserRole(userData);
+      setCurrentRole(normalizedRole);
 
       // Get or create company for this user
-      const { getOrCreateCompany } = await import('@/utils/companyHelper');
-      const companyId = await getOrCreateCompany(supabase, userData);
+      // companyId already fetched by getCurrentUserAndRole()
```

**DIFF (Condition Checks):**
```diff
-          {(currentRole === 'buyer' || currentRole === 'hybrid') && (
+          {canViewBuyerFeatures(currentRole) && (
             <Link to="/dashboard/rfqs/new">
               <Button variant="primary">
                 <Plus className="w-4 h-4 mr-2" />
                 Create RFQ
               </Button>
             </Link>
           )}
 
-            {(currentRole === 'buyer' || currentRole === 'hybrid') && (
+            {canViewBuyerFeatures(currentRole) && (
               <TabsTrigger value="sent">Sent RFQs</TabsTrigger>
             )}
-            {(currentRole === 'seller' || currentRole === 'hybrid') && (
+            {canViewSellerFeatures(currentRole) && (
               <TabsTrigger value="received">Received RFQs</TabsTrigger>
             )}
```

**What Changed:**
- ✅ Replaced duplicated role detection with `getCurrentUserAndRole()`
- ✅ Uses `getUserRole()` for normalization
- ✅ Uses `canViewBuyerFeatures()` and `canViewSellerFeatures()` helpers
- ✅ Removed dynamic import for `getOrCreateCompany` (already in helper)

**Why It's Safer:**
- Consistent role detection
- Cleaner condition checks
- Less code duplication

---

### 9. `src/pages/dashboard/orders.jsx` — Use Role Helpers

**Similar changes as rfqs.jsx:**
- Replace role detection with `getCurrentUserAndRole()`
- Use `getUserRole()` for normalization
- Use helper functions for condition checks

---

### 10. Other Dashboard Pages — Use Role Helpers

**Files to Update:**
- `src/pages/dashboard/products.jsx`
- `src/pages/dashboard/analytics.jsx`
- `src/pages/dashboard/payments.jsx`
- `src/pages/dashboard/protection.jsx`
- `src/pages/dashboard/settings.jsx`
- `src/pages/dashboard/shipments.jsx`
- `src/pages/dashboard/help.jsx`

**Pattern (Same for all):**
```diff
- const userData = await supabaseHelpers.auth.me();
- const role = userData.role || userData.user_role || 'buyer';
- const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;
+ const { user: userData, role, companyId } = await getCurrentUserAndRole();
+ const normalizedRole = getUserRole(userData);

- {(currentRole === 'buyer' || currentRole === 'hybrid') && (
+ {canViewBuyerFeatures(currentRole) && (
```

---

## 🎯 SUMMARY OF CHANGES

### **New Files (2):**
1. ✅ `src/utils/authHelpers.js` - Centralized auth logic
2. ✅ `src/utils/roleHelpers.js` - Centralized role logic

### **Modified Files (8+):**
1. ✅ `src/pages/login.jsx` - Add onboarding check
2. ✅ `src/pages/signup.jsx` - Add onboarding redirect & flag
3. ✅ `src/pages/dashboard/index.jsx` - Use helpers, add onboarding check
4. ✅ `src/pages/dashboard/DashboardHome.jsx` - Use helpers
5. ✅ `src/components/ProtectedRoute.jsx` - Add optional onboarding check
6. ✅ `src/pages/dashboard/rfqs.jsx` - Use helpers
7. ✅ `src/pages/dashboard/orders.jsx` - Use helpers
8. ✅ Other dashboard pages - Use helpers (batch update)

### **Code Reduction:**
- **Removed:** ~200 lines of duplicated code
- **Added:** ~150 lines of centralized helpers
- **Net:** -50 lines, much more maintainable

---

## ⚠️ IMPORTANT NOTES

### **Onboarding Page:**
- **Current Status:** No `onboarding.jsx` file exists
- **Decision Needed:** 
  - Option A: Create new onboarding page
  - Option B: Use existing `selleronboarding.jsx` as template
  - Option C: Skip onboarding for now (users go directly to dashboard)

**Recommendation:** Create a simple onboarding page with:
- Step 1: Role selection
- Step 2: Company information
- Sets `onboarding_completed: true` on completion

---

## ✅ TESTING CHECKLIST

After implementation, test:
- [ ] Signup → Creates profile with `onboarding_completed: false` → Redirects to `/onboarding`
- [ ] Login (incomplete onboarding) → Redirects to `/onboarding`
- [ ] Login (completed onboarding) → Redirects to `/dashboard`
- [ ] Dashboard access (incomplete onboarding) → Redirects to `/onboarding`
- [ ] Dashboard access (completed onboarding) → Shows dashboard
- [ ] Hybrid users can toggle view mode
- [ ] Role detection works consistently across all pages
- [ ] No console errors
- [ ] No permission denied errors

---

**END OF IMPLEMENTATION DIFFS**

**Status:** ⏳ **AWAITING APPROVAL**

**Ready to implement after approval.**

