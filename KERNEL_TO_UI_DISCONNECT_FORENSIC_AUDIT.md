# 🕵️ SYSTEM FORENSIC AUDIT: KERNEL-TO-UI DISCONNECT

**Date:** 2026-01-20  
**Status:** READ-ONLY ANALYSIS  
**Issue:** Admin Dashboard defaulting to "Buyer View" despite Database Kernel being active

---

## EXECUTIVE SUMMARY

The Admin signal (`profile.is_admin = true`) is correctly extracted from the database but is being lost in the UI rendering pipeline due to **context hierarchy violations** and **capability dependency gaps**. The system has **two parallel admin detection mechanisms** that are not properly synchronized:

1. **Database Kernel:** `profile.is_admin` ✅ (Working)
2. **Capability System:** Requires `company_id` ❌ (Blocking admin without company)

---

## CHAIN OF FAILURE ANALYSIS

### 🔴 FAILURE POINT #1: Context Hierarchy Violation
**Location:** `src/components/layout/Navbar.jsx:215`

**Problem:**
```javascript
const capabilities = useCapability(); // Line 215
```

**Root Cause:**
- `Navbar` component is rendered in `src/layout.jsx` (public layout)
- `CapabilityProvider` only wraps `/dashboard/*` routes in `src/App.jsx:305`
- `Navbar` is **OUTSIDE** the `CapabilityProvider` context tree
- `useCapability()` hook returns **defaults** instead of throwing error (by design)

**Evidence:**
```javascript
// src/App.jsx:305 - CapabilityProvider ONLY wraps dashboard routes
<Route path="/dashboard/*" element={
  <CapabilityProvider>
    <RequireCapability require={null}>
      <Dashboard />
    </RequireCapability>
  </CapabilityProvider>
}>

// src/layout.jsx:493 - Navbar rendered OUTSIDE dashboard context
<Navbar user={user} onLogout={handleLogout} />
```

**Impact:** 
- Console warning: `[useCapability] Used outside CapabilityProvider - returning defaults`
- Navbar receives `{ can_buy: true, can_sell: false, ... }` (buyer defaults)
- Admin status not accessible via capabilities in Navbar

**Severity:** 🟡 MEDIUM (Navbar doesn't need capabilities, but warning is misleading)

---

### 🔴 FAILURE POINT #2: Capability Context Requires Company ID
**Location:** `src/context/CapabilityContext.tsx:99`

**Problem:**
```javascript
if (!authReady || !user || !targetCompanyId) {
  console.log('[CapabilityContext] Prerequisites not ready...');
  setCapabilities(prev => ({
    ...prev,
    ready: true, // ✅ ALWAYS true - never block rendering
    company_id: prev?.company_id ?? null,
  }));
  return; // ⚠️ EXITS WITHOUT FETCHING CAPABILITIES
}
```

**Root Cause:**
- `CapabilityContext` requires `profile?.company_id` to fetch capabilities
- **Admin users may not have a `company_id`** (they're system-level users)
- When `company_id` is null, capabilities fetch is **skipped entirely**
- System falls back to defaults: `{ can_buy: true, can_sell: false, ... }`

**Evidence:**
```javascript
// src/context/CapabilityContext.tsx:74
const targetCompanyId = profile?.company_id; // ⚠️ NULL for admins without company

// Line 99: Guard exits if no company_id
if (!authReady || !user || !targetCompanyId) {
  return; // ⚠️ NO CAPABILITIES FETCHED
}
```

**Impact:**
- Admin users without `company_id` get **buyer defaults** (`can_buy: true`)
- Sidebar building logic uses capabilities, not admin status
- Admin sidebar sections may not appear

**Severity:** 🔴 HIGH (Blocks admin access if no company_id)

---

### 🔴 FAILURE POINT #3: Admin Status Not Integrated into Capability System
**Location:** `src/context/CapabilityContext.tsx` (Missing Integration)

**Problem:**
- `CapabilityContext` does **NOT** check `profile.is_admin`
- Admin status is checked separately via `isAdmin()` utility
- Sidebar building logic (`buildSidebarFromCapabilities`) doesn't receive admin status
- Admin sections are conditionally rendered based on `isUserAdmin` state, not capabilities

**Evidence:**
```javascript
// src/context/CapabilityContext.tsx - NO is_admin check
const fetchCapabilities = async (forceRefresh = false) => {
  const targetCompanyId = profile?.company_id; // ⚠️ Only checks company_id
  // ... no profile.is_admin check
}

// src/layouts/DashboardLayout.jsx:343 - Admin checked SEPARATELY
const admin = isAdmin(contextUser, contextProfile);
setIsUserAdmin(admin || false);

// src/layouts/DashboardLayout.jsx:576 - Sidebar built from capabilities ONLY
menuItems = buildSidebarFromCapabilities(capabilitiesData);
// ⚠️ Admin sections added LATER, not integrated into capability system
```

**Impact:**
- Admin status exists in parallel to capabilities
- Sidebar building doesn't consider admin status when determining "view"
- Admin may see buyer view if capabilities default to buyer

**Severity:** 🔴 HIGH (Admin status not part of capability system)

---

### 🟡 FAILURE POINT #4: Sidebar View Determination Logic
**Location:** `src/layouts/DashboardLayout.jsx:570-576`

**Problem:**
```javascript
// Sidebar is built SOLELY from capabilities
menuItems = buildSidebarFromCapabilities(capabilitiesData);

// Admin sections added AFTER sidebar build
if (isUserAdmin && !location.pathname.startsWith('/dashboard/admin')) {
  menuItems.push({ icon: AlertTriangle, label: 'Admin Panel', ... });
}
```

**Root Cause:**
- Sidebar "view" (Buyer/Seller/Admin) is determined by **capabilities only**
- Admin status is checked **after** sidebar build
- If capabilities default to buyer (`can_buy: true`), sidebar shows buyer view
- Admin panel link is added, but main sidebar still shows buyer sections

**Evidence:**
```javascript
// src/layouts/DashboardLayout.jsx:430-550
// buildSidebarFromCapabilities() builds menu based on:
// - can_buy → Buyer sections
// - can_sell → Seller sections  
// - can_logistics → Logistics sections
// ⚠️ NO admin check in this function

// Admin panel added separately at line 632
if (isUserAdmin && !location.pathname.startsWith('/dashboard/admin')) {
  menuItems.push({ icon: AlertTriangle, label: 'Admin Panel', ... });
}
```

**Impact:**
- Admin sees buyer sidebar + admin panel link
- Admin-specific sections (Risk, Compliance, Audit) only show if `isUserAdmin` is true
- But main sidebar structure is still buyer-oriented

**Severity:** 🟡 MEDIUM (Admin sections exist but sidebar structure is buyer-first)

---

### 🟡 FAILURE POINT #5: Auth Loading Timeout
**Location:** `src/contexts/AuthProvider.jsx:112-119`

**Problem:**
```javascript
timeoutId = setTimeout(() => {
  if (isMounted && loading && !hasInitializedRef.current) {
    console.warn('[Auth] Loading timeout - forcing to false');
    setAuthReady(true);
    setLoading(false);
    hasInitializedRef.current = true;
  }
}, 10000); // ⚠️ 10 second timeout
```

**Root Cause:**
- If `ipapi.co` API call in `auditLogger.js` takes > 10 seconds or returns 429
- Auth initialization may timeout before profile loads
- Profile may be `null` when timeout fires
- `isAdmin` check fails because `profile` is null

**Evidence:**
```javascript
// src/utils/auditLogger.js:21
const response = await fetch('https://ipapi.co/json/');
// ⚠️ This is NOT awaited in AuthProvider, but if called during login...
// Could potentially delay auth initialization

// src/contexts/AuthProvider.jsx:82-90
const { data: profileData } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle();
// ⚠️ If this takes > 10 seconds, timeout fires and profile may be null
```

**Impact:**
- Rare edge case, but could cause `profile` to be null
- `isAdmin()` returns `false` if profile is null
- Admin status lost

**Severity:** 🟢 LOW (Edge case, timeout is safety mechanism)

---

### 🟡 FAILURE POINT #6: Network Error (429) Not Blocking Auth
**Location:** `src/utils/auditLogger.js:21-32`

**Problem:**
```javascript
const response = await fetch('https://ipapi.co/json/');
if (!response.ok) throw new Error('IP API failed');
// ⚠️ 429 errors would throw here, but...
// This is called in logAuditEvent(), NOT during auth initialization
```

**Root Cause:**
- `getClientIPAndCountry()` is called **asynchronously** in `logAuditEvent()`
- Auth initialization does **NOT** await audit logging
- 429 errors from `ipapi.co` do **NOT** block auth flow
- **This is NOT the root cause** of the admin issue

**Evidence:**
```javascript
// src/pages/login.jsx:91 - Audit logging is NON-BLOCKING
try {
  await logLoginEvent({ user: { email }, profile: null, success: true });
} catch (_) {} // ⚠️ Errors are silently caught

// AuthProvider doesn't call auditLogger during initialization
// So 429 errors cannot block auth
```

**Impact:** 
- None - this is a red herring
- Audit logging failures don't affect auth state

**Severity:** 🟢 NONE (Not a real issue)

---

## CRITICAL FINDINGS

### 1. **Admin Override Gap**
**Problem:** Admin users without `company_id` cannot access admin features because:
- `CapabilityContext` requires `company_id` to fetch capabilities
- Without capabilities, system defaults to buyer view
- Admin status exists but is not integrated into capability system

**Solution Required:**
- Add admin check to `CapabilityContext` fetch logic
- If `profile.is_admin === true`, bypass `company_id` requirement
- Return admin-specific capabilities or flag

### 2. **Context Hierarchy Issue**
**Problem:** `Navbar` uses `useCapability()` outside `CapabilityProvider`
- Not blocking admin access (Navbar doesn't need capabilities)
- But creates console warnings and confusion

**Solution Required:**
- Remove `useCapability()` from Navbar (it doesn't need it)
- Or wrap Layout in CapabilityProvider (overkill for public pages)

### 3. **Sidebar View Logic**
**Problem:** Sidebar "view" determined by capabilities, not admin status
- Admin sections added as afterthought
- Main sidebar structure is buyer-first

**Solution Required:**
- Check admin status **before** building sidebar
- If admin, show admin-first sidebar structure
- Integrate admin sections into main sidebar build logic

---

## DATA FLOW TRACE

### ✅ CORRECT FLOW (Database → AuthProvider)
```
1. Supabase Session → profile.is_admin = true ✅
2. AuthProvider.resolveAuth() → profileData.is_admin = true ✅
3. setProfile(profileData) → profile.is_admin = true ✅
4. useAuth() → profile.is_admin = true ✅
```

### ❌ BROKEN FLOW (AuthProvider → Dashboard)
```
1. useDashboardKernel() → isAdmin: !!profile?.is_admin ✅ (TRUE)
2. CapabilityContext.fetchCapabilities() → Requires company_id ❌
3. Admin has no company_id → Fetch skipped ❌
4. Capabilities default to: { can_buy: true, can_sell: false } ❌
5. buildSidebarFromCapabilities() → Buyer sidebar built ❌
6. Admin panel link added separately → But main sidebar is buyer ❌
```

---

## ROOT CAUSE SUMMARY

**Primary Root Cause:** `CapabilityContext` requires `company_id` to fetch capabilities, but admin users may not have a `company_id`. When `company_id` is null, capabilities fetch is skipped and system defaults to buyer capabilities.

**Secondary Root Cause:** Admin status (`profile.is_admin`) is checked separately from capabilities, but sidebar building logic uses capabilities as the primary source of truth. Admin status is not integrated into the capability system.

**Tertiary Issue:** `Navbar` component uses `useCapability()` outside `CapabilityProvider`, causing console warnings (but not blocking admin access).

---

## RECOMMENDATIONS

### Immediate Fixes (High Priority)

1. **Add Admin Override to CapabilityContext**
   ```typescript
   // In fetchCapabilities(), before company_id check:
   if (profile?.is_admin === true) {
     // Admin users get full capabilities regardless of company_id
     setCapabilities({
       can_buy: true,
       can_sell: true,
       can_logistics: true,
       sell_status: 'approved',
       logistics_status: 'approved',
       company_id: null, // Admins don't need company_id
       loading: false,
       ready: true,
       error: null,
     });
     return;
   }
   ```

2. **Integrate Admin Check into Sidebar Building**
   ```javascript
   // In buildSidebarFromCapabilities(), check admin FIRST:
   const buildSidebarFromCapabilities = (caps, isAdmin = false) => {
     if (isAdmin) {
       // Build admin-first sidebar structure
       return buildAdminSidebar();
     }
     // Otherwise build capability-based sidebar
     return buildCapabilitySidebar(caps);
   };
   ```

3. **Remove useCapability() from Navbar**
   ```javascript
   // Navbar doesn't need capabilities - remove the hook call
   // const capabilities = useCapability(); // ❌ REMOVE THIS
   ```

### Medium-Term Improvements

4. **Add Admin Flag to CapabilityData Type**
   ```typescript
   export type CapabilityData = {
     can_buy: boolean;
     can_sell: boolean;
     can_logistics: boolean;
     sell_status: CapabilityStatus;
     logistics_status: CapabilityStatus;
     company_id: string | null;
     is_admin: boolean; // ✅ ADD THIS
     loading: boolean;
     ready: boolean;
     error: string | null;
   };
   ```

5. **Create Admin-Specific Sidebar Builder**
   - Separate function for admin sidebar structure
   - Admin-first navigation (Admin Panel, Risk, Compliance, Audit at top)
   - Capability sections below admin sections

---

## VERIFICATION CHECKLIST

- [ ] Verify `profile.is_admin` is correctly extracted from database ✅
- [ ] Verify `AuthProvider` correctly sets `profile.is_admin` ✅
- [ ] Verify `useDashboardKernel()` correctly derives `isAdmin` ✅
- [ ] Verify `CapabilityContext` handles admin users without `company_id` ❌
- [ ] Verify sidebar building checks admin status before capabilities ❌
- [ ] Verify admin sections appear in sidebar when `isAdmin === true` ⚠️ (Partial - added separately)
- [ ] Verify Navbar doesn't use `useCapability()` outside provider ❌

---

## CONCLUSION

The Admin Dashboard defaults to "Buyer View" because:

1. **Admin users without `company_id`** cannot fetch capabilities
2. **Capabilities default to buyer** when fetch is skipped
3. **Sidebar building uses capabilities** as primary source of truth
4. **Admin status is checked separately** but not integrated into capability system

**Fix Priority:** 🔴 HIGH - Admin users cannot access admin features if they don't have a `company_id`.

**Estimated Fix Time:** 2-3 hours
- Add admin override to CapabilityContext (30 min)
- Integrate admin check into sidebar building (1 hour)
- Remove useCapability() from Navbar (15 min)
- Testing and verification (1 hour)

---

**Report Generated:** 2026-01-20  
**Analyst:** Senior Full-Stack Engineer  
**Status:** READ-ONLY ANALYSIS COMPLETE
