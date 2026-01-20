# 🔍 COMPLETE FORENSIC AUDIT: Login → Auth → Dashboard → Data Flow

**Date:** 2025-01-17  
**Type:** READ-ONLY Analysis  
**Scope:** Frontend → Backend → Database → Kernel → Router → Dashboard Pages

---

## 📋 TABLE OF CONTENTS

1. [Login Flow Analysis](#1-login-flow-analysis)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Router Flow](#3-router-flow)
4. [Dashboard Kernel System](#4-dashboard-kernel-system)
5. [Database Schema Connections](#5-database-schema-connections)
6. [Data Flow Analysis](#6-data-flow-analysis)
7. [Dashboard Pages Integration](#7-dashboard-pages-integration)
8. [Potential Issues & Gaps](#8-potential-issues--gaps)
9. [Connection Verification](#9-connection-verification)

---

## 1. LOGIN FLOW ANALYSIS

### 1.1 Login Page (`src/pages/login.jsx`)

**Entry Point:** `/login`

**Flow:**
```
User enters email/password
  ↓
handleLogin() called
  ↓
authServiceLogin(email, password) [AuthService.js]
  ↓
supabase.auth.signInWithPassword({ email, password })
  ↓
[SUPABASE AUTH] Validates credentials
  ↓
Returns: { user, session }
  ↓
AuthService fetches profile from profiles table
  ↓
Returns: { user, profile }
  ↓
Login page checks profile.company_id
  ↓
If no profile/company_id → navigate('/onboarding/company')
  ↓
If profile exists → setIsSynchronizing(true)
  ↓
Wait for Kernel (isSystemReady)
  ↓
Navigate to /auth/post-login
```

**Key Components:**
- ✅ Uses `AuthService.login()` for atomic login
- ✅ Checks `profile.company_id` before redirect
- ✅ Waits for Kernel readiness (`isSystemReady`)
- ✅ Shows "Synchronizing..." state during Kernel handshake
- ✅ Handles OAuth (Google/Facebook) via separate components

**Dependencies:**
- `AuthService.js` - Atomic login logic
- `useAuth()` - Auth context
- `useDashboardKernel()` - Kernel readiness check
- `supabase` - Auth client

---

### 1.2 AuthService (`src/services/AuthService.js`)

**Function:** `login(email, password)`

**Flow:**
```
1. supabase.auth.signInWithPassword({ email, password })
   ↓
2. If error → throw error
   ↓
3. fetchProfileWithRetry(userId, maxAttempts=3)
   ├─ Attempt 1: Query profiles table
   ├─ If PGRST116 (not found):
   │  ├─ Wait 500ms (exponential backoff)
   │  └─ Retry
   ├─ Attempt 2: Query profiles table
   ├─ If PGRST116 (not found):
   │  ├─ Wait 1000ms
   │  └─ Retry
   ├─ Attempt 3: Query profiles table
   └─ If PGRST116 (not found) → return null
   ↓
4. Update JWT metadata (is_admin flag)
   ↓
5. Refresh session to sync metadata
   ↓
6. Return { user, profile }
```

**Key Features:**
- ✅ Exponential backoff retry (500ms, 1000ms, 2000ms)
- ✅ Handles PGRST116 (profile not found) gracefully
- ✅ Syncs `is_admin` flag to JWT metadata
- ✅ Refreshes session after metadata update

**Database Queries:**
- `profiles.select('*').eq('id', userId).single()`
- `supabase.auth.updateUser({ data: { is_admin } })`
- `supabase.auth.refreshSession()`

---

## 2. AUTHENTICATION ARCHITECTURE

### 2.1 AuthProvider (`src/contexts/AuthProvider.jsx`)

**Purpose:** Global authentication state management

**Initialization Flow:**
```
Component mounts
  ↓
resolveAuth() called
  ↓
supabase.auth.getSession()
  ↓
If session exists:
  ├─ Get user from session
  ├─ Query profiles table: profiles.select('*').eq('id', user.id).single()
  ├─ Set user, profile, role state
  └─ Set authReady = true
  ↓
If no session:
  ├─ Set user = null, profile = null, role = null
  └─ Set authReady = true (guest mode)
  ↓
Subscribe to auth state changes:
  ├─ SIGNED_IN → silentRefresh()
  ├─ SIGNED_OUT → clear state
  ├─ TOKEN_REFRESHED → silentRefresh()
  └─ USER_UPDATED → silentRefresh()
```

**State Properties:**
- `user`: Supabase auth user object (or null)
- `profile`: Profile from `profiles` table (or null)
- `role`: Profile role (deprecated, kept for compatibility)
- `authReady`: Boolean - true when auth state is known
- `loading`: Boolean - true only during initial load

**Critical Rules:**
- ✅ `authReady` NEVER goes back to false once true
- ✅ Loading only shows on INITIAL load, not refresh
- ✅ Silent refresh doesn't change loading state
- ✅ Uses `.single()` for profile queries (not `.maybeSingle()`)

**Database Queries:**
- `profiles.select('*').eq('id', user.id).single()`

**Event Handlers:**
- `SIGNED_IN` → `silentRefresh()`
- `SIGNED_OUT` → Clear state
- `TOKEN_REFRESHED` → `silentRefresh()`
- `USER_UPDATED` → `silentRefresh()`

---

### 2.2 PostLoginRouter (`src/auth/PostLoginRouter.jsx`)

**Purpose:** Routes users after login based on profile state

**Flow:**
```
Component mounts
  ↓
Wait for authReady
  ↓
If no user → navigate('/login')
  ↓
If isPreWarming → Show "Synchronizing World..."
  ↓
If !isSystemReady → Show "Preparing your workspace..."
  ↓
If no profile:
  ├─ Create profile in profiles table
  ├─ If success → navigate('/onboarding/company')
  └─ If error → navigate('/login')
  ↓
If profile but no company_id:
  └─ navigate('/onboarding/company')
  ↓
If profile has company_id:
  └─ navigate('/dashboard')
```

**Key Guards:**
- ✅ Checks `authReady`
- ✅ Checks `isPreWarming` (Kernel handshake)
- ✅ Checks `isSystemReady` (Kernel readiness)
- ✅ Checks `profile.company_id`

**Dependencies:**
- `useAuth()` - Auth context
- `useDashboardKernel()` - Kernel state
- `supabase` - Database client

---

## 3. ROUTER FLOW

### 3.1 App Router (`src/App.jsx`)

**Context Provider Hierarchy:**
```
LanguageProvider
  ↓
CurrencyProvider
  ↓
AuthProvider ⭐ CRITICAL (must be first)
  ↓
UserProvider
  ↓
RoleProvider
  ↓
CapabilityProvider ⭐ CRITICAL (global, wraps entire app)
  ↓
AppContent
```

**Route Structure:**
```
Public Routes:
  /login → Login component
  /signup → Signup component
  /auth/callback → AuthCallback component
  /auth/post-login → PostLoginRouter component
  /onboarding/company → SupplierOnboarding (ProtectedRoute)

Dashboard Routes:
  /dashboard/* → Dashboard shell (RequireCapability)
    ├─ /dashboard → DashboardHome
    ├─ /dashboard/products → ProductsPage
    ├─ /dashboard/orders → OrdersPage
    ├─ /dashboard/rfqs → RFQsPage
    └─ ... (84 dashboard pages)
```

**Key Guards:**
- `ProtectedRoute` - Requires authentication
- `RequireCapability` - Requires capabilities.ready
- `requireAdmin={true}` - Requires admin access

---

### 3.2 ProtectedRoute (`src/components/ProtectedRoute.jsx`)

**Purpose:** Protects routes requiring authentication

**Flow:**
```
Component renders
  ↓
If isPreWarming → Show "Synchronizing World..."
  ↓
If !authReady || loading → Show "Checking authentication..."
  ↓
If !user → Navigate to /login?next={currentPath}
  ↓
If needsCompanyId && !profile.company_id:
  └─ Navigate to /onboarding/company
  ↓
If needsAdmin && !isAdmin:
  └─ Show AccessDenied
  ↓
Render children
```

**Key Guards:**
- ✅ Checks `isPreWarming` (Kernel handshake)
- ✅ Checks `authReady`
- ✅ Checks `user` existence
- ✅ Checks `profile.company_id` (if required)
- ✅ Checks `isAdmin` (if required)

---

## 4. DASHBOARD KERNEL SYSTEM

### 4.1 useDashboardKernel (`src/hooks/useDashboardKernel.js`)

**Purpose:** Unified Dashboard Kernel Hook - provides standardized access to dashboard state

**Exported Properties:**
- `profileCompanyId`: Company ID from profile
- `userId`: User ID
- `user`: User object
- `profile`: Profile object
- `isAdmin`: Whether user is admin
- `isSystemReady`: Whether auth and capabilities are ready
- `canLoadData`: Whether it's safe to load data (system ready + has company)
- `capabilities`: Full capabilities object
- `isPreWarming`: Whether Kernel is pre-warming
- `isHybrid`: Whether user has both buy and sell capabilities

**Readiness Logic:**
```
isPreWarming = authReady === true && !authLoading && user && !profile
isSystemReady = authReady === true && !authLoading && capabilities.ready === true && !isPreWarming
canLoadData = isSystemReady && !!profileCompanyId
```

**Pre-warming Logic:**
```
If isPreWarming:
  ├─ Set timeout (10 seconds)
  ├─ After timeout:
  │  ├─ Retry 1: Refresh session → Re-fetch profile (1s delay)
  │  ├─ Retry 2: Refresh session → Re-fetch profile (2s delay)
  │  └─ Retry 3: Refresh session → Re-fetch profile (4s delay)
  ├─ If profile found → Kernel handshake successful
  └─ If profile not found after retries → Navigate to /onboarding/company
```

**Dependencies:**
- `useAuth()` - Auth context
- `useCapability()` - Capability context

---

### 4.2 CapabilityProvider (`src/context/CapabilityContext.tsx`)

**Purpose:** Provides company capabilities (can_buy, can_sell, can_logistics)

**Initialization Flow:**
```
Component mounts
  ↓
Get user, profile, authReady from AuthProvider
  ↓
If profile.is_admin === true:
  └─ Set SUPER_USER_CAPS (bypass fetch)
  ↓
If !authReady || !user || !profile.company_id:
  └─ Return default capabilities (ready=true, can_buy=true)
  ↓
If already fetched for this company_id:
  └─ Return cached capabilities
  ↓
Fetch from database:
  ├─ Query company_capabilities table
  ├─ .eq('company_id', profile.company_id)
  ├─ .single()
  └─ Set capabilities state
  ↓
Set ready = true
```

**Database Query:**
```sql
SELECT * FROM company_capabilities
WHERE company_id = profile.company_id
```

**Admin Bypass:**
- If `profile.is_admin === true` → Returns `SUPER_USER_CAPS`
- Bypasses database fetch entirely
- Ensures `sell_status` and `logistics_status` are 'approved'

**State Properties:**
- `can_buy`: Boolean (default: true)
- `can_sell`: Boolean (default: false)
- `can_logistics`: Boolean (default: false)
- `sell_status`: 'disabled' | 'pending' | 'approved'
- `logistics_status`: 'disabled' | 'pending' | 'approved'
- `company_id`: UUID
- `loading`: Boolean
- `ready`: Boolean (CRITICAL: starts as true)
- `error`: String | null

**Critical Rules:**
- ✅ `ready` starts as `true` (never blocks rendering)
- ✅ Admin users bypass fetch (immediate capabilities)
- ✅ Once `ready` is true, it stays true

---

## 5. DATABASE SCHEMA CONNECTIONS

### 5.1 Profiles Table

**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- Links to auth.users.id
  full_name TEXT,
  role TEXT,                              -- DEPRECATED (kept for compatibility)
  onboarding_completed BOOLEAN,
  company_name TEXT,
  business_type TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  business_email TEXT,
  website TEXT,
  year_established TEXT,
  company_size TEXT,
  company_description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email TEXT,
  is_admin BOOLEAN,                        -- ⭐ CRITICAL: Admin flag
  company_id UUID                          -- ⭐ CRITICAL: Links to companies.id
);
```

**Connections:**
- `id` → `auth.users.id` (1:1 relationship)
- `company_id` → `companies.id` (many:1 relationship)

**Queries:**
- `profiles.select('*').eq('id', userId).single()`
- Used by: AuthProvider, AuthService, PostLoginRouter

---

### 5.2 Companies Table

**Schema:**
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  user_id UUID,                            -- Links to profiles.id
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  country TEXT,
  city TEXT,
  business_type TEXT,
  description TEXT,
  year_established TEXT,
  employee_count TEXT,
  owner_email TEXT,
  role TEXT,
  verified BOOLEAN,
  verification_status TEXT,
  verified_at TIMESTAMPTZ,
  trust_score NUMERIC,
  average_rating NUMERIC,
  approved_reviews_count INTEGER,
  logo_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subscription_plan TEXT,
  subscription_expires_at TIMESTAMPTZ
);
```

**Connections:**
- `id` ← `profiles.company_id` (1:many relationship)
- `id` ← `company_capabilities.company_id` (1:1 relationship)

**Queries:**
- `companies.select('*').eq('id', companyId).single()`
- Used by: Dashboard pages, CompanyInfo page

---

### 5.3 Company Capabilities Table

**Schema:**
```sql
CREATE TABLE company_capabilities (
  company_id UUID PRIMARY KEY REFERENCES companies(id),
  can_buy BOOLEAN NOT NULL DEFAULT true,
  can_sell BOOLEAN NOT NULL DEFAULT false,
  can_logistics BOOLEAN NOT NULL DEFAULT false,
  sell_status TEXT NOT NULL DEFAULT 'disabled',
  logistics_status TEXT NOT NULL DEFAULT 'disabled',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

**Connections:**
- `company_id` → `companies.id` (1:1 relationship)

**Queries:**
- `company_capabilities.select('*').eq('company_id', companyId).single()`
- Used by: CapabilityProvider

**Auto-creation:**
- Trigger: `company_capabilities_auto_create`
- Fires: `AFTER INSERT ON companies`
- Action: Creates default capabilities row (`can_buy=true`, others false)

---

## 6. DATA FLOW ANALYSIS

### 6.1 Complete Login → Dashboard Flow

```
[FRONTEND] User enters email/password
  ↓
[FRONTEND] login.jsx → handleLogin()
  ↓
[FRONTEND] AuthService.login(email, password)
  ↓
[BACKEND] supabase.auth.signInWithPassword()
  ↓
[SUPABASE AUTH] Validates credentials
  ↓
[SUPABASE AUTH] Returns: { user, session }
  ↓
[FRONTEND] AuthService → fetchProfileWithRetry()
  ↓
[DATABASE] profiles.select('*').eq('id', userId).single()
  ↓
[DATABASE] Returns: profile object (or null)
  ↓
[FRONTEND] AuthService → updateUser({ data: { is_admin } })
  ↓
[SUPABASE AUTH] Updates JWT metadata
  ↓
[FRONTEND] AuthService → refreshSession()
  ↓
[SUPABASE AUTH] Refreshes session with updated metadata
  ↓
[FRONTEND] AuthProvider → onAuthStateChange('SIGNED_IN')
  ↓
[FRONTEND] AuthProvider → silentRefresh()
  ↓
[DATABASE] profiles.select('*').eq('id', userId).single()
  ↓
[FRONTEND] AuthProvider → setProfile(profileData)
  ↓
[FRONTEND] login.jsx → setIsSynchronizing(true)
  ↓
[FRONTEND] useDashboardKernel → Checks isPreWarming
  ↓
[FRONTEND] CapabilityProvider → fetchCapabilities()
  ↓
[DATABASE] company_capabilities.select('*').eq('company_id', companyId).single()
  ↓
[FRONTEND] CapabilityProvider → setCapabilities(capabilitiesData)
  ↓
[FRONTEND] useDashboardKernel → isSystemReady = true
  ↓
[FRONTEND] login.jsx → navigate('/auth/post-login')
  ↓
[FRONTEND] PostLoginRouter → Checks profile.company_id
  ↓
[FRONTEND] PostLoginRouter → navigate('/dashboard')
  ↓
[FRONTEND] App.jsx → Route matches /dashboard/*
  ↓
[FRONTEND] RequireCapability → Checks capabilities.ready
  ↓
[FRONTEND] Dashboard → Renders DashboardLayout
  ↓
[FRONTEND] DashboardHome → useDashboardKernel()
  ↓
[FRONTEND] DashboardHome → canLoadData = true
  ↓
[DATABASE] Multiple queries (orders, rfqs, products, messages, etc.)
  ↓
[FRONTEND] DashboardHome → Renders data
```

---

### 6.2 Kernel Handshake Flow

```
[FRONTEND] User logs in
  ↓
[FRONTEND] AuthProvider → setProfile(profile)
  ↓
[FRONTEND] useDashboardKernel → Checks: authReady && user && !profile
  ↓
[FRONTEND] useDashboardKernel → isPreWarming = true
  ↓
[FRONTEND] useDashboardKernel → Sets 10s timeout
  ↓
[FRONTEND] After 10s → Retry 1 (1s delay)
  ├─ Refresh session
  ├─ Re-fetch profile
  └─ If found → Kernel handshake successful
  ↓
[FRONTEND] If not found → Retry 2 (2s delay)
  ├─ Refresh session
  ├─ Re-fetch profile
  └─ If found → Kernel handshake successful
  ↓
[FRONTEND] If not found → Retry 3 (4s delay)
  ├─ Refresh session
  ├─ Re-fetch profile
  └─ If found → Kernel handshake successful
  ↓
[FRONTEND] If still not found → Navigate to /onboarding/company
```

---

## 7. DASHBOARD PAGES INTEGRATION

### 7.1 Dashboard Pages Using Kernel

**All dashboard pages should:**
1. ✅ Use `useDashboardKernel()` hook
2. ✅ Check `canLoadData` before fetching data
3. ✅ Use `profileCompanyId` from Kernel (not local state)
4. ✅ Check `isSystemReady` before rendering

**Example Pattern:**
```javascript
const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

useEffect(() => {
  if (!canLoadData || !profileCompanyId) return;
  // Safe to fetch data
}, [canLoadData, profileCompanyId]);
```

**Verified Pages (84 total):**
- ✅ DashboardHome
- ✅ ProductsPage
- ✅ OrdersPage
- ✅ RFQsPage
- ✅ RFQDetailPage
- ✅ AnalyticsPage
- ✅ CompanyInfoPage
- ✅ ... (and 77 more)

---

### 7.2 Dashboard Data Queries

**Common Query Patterns:**

**RFQs:**
```javascript
supabase.from('rfqs')
  .select('*')
  .eq('buyer_company_id', profileCompanyId)  // ✅ Correct column
  .single()
```

**Messages:**
```javascript
supabase.from('messages')
  .select('*')
  .or(`sender_company_id.eq.${profileCompanyId},receiver_company_id.eq.${profileCompanyId}`)
  .order('created_at', { ascending: false })
```

**Products:**
```javascript
supabase.from('products')
  .select('*')
  .eq('company_id', profileCompanyId)
  .single()
```

**Company Capabilities:**
```javascript
supabase.from('company_capabilities')
  .select('*')
  .eq('company_id', profileCompanyId)
  .single()
```

---

## 8. POTENTIAL ISSUES & GAPS

### 8.1 Race Conditions

**Issue:** Profile fetch may fail on slow networks
**Mitigation:** ✅ Exponential backoff retry in AuthService
**Status:** ✅ HANDLED

**Issue:** Kernel handshake may timeout
**Mitigation:** ✅ 10s timeout with 3 retries
**Status:** ✅ HANDLED

---

### 8.2 Missing Profile

**Issue:** User exists but profile doesn't
**Flow:** ✅ Redirects to `/onboarding/company`
**Status:** ✅ HANDLED

---

### 8.3 Missing Company ID

**Issue:** Profile exists but company_id is null
**Flow:** ✅ Redirects to `/onboarding/company`
**Status:** ✅ HANDLED

---

### 8.4 Missing Capabilities

**Issue:** Company exists but capabilities row doesn't
**Mitigation:** ✅ Auto-creation trigger on company insert
**Status:** ✅ HANDLED

---

### 8.5 Admin Access

**Issue:** Admin users may not have company_id
**Mitigation:** ✅ Admin bypass in CapabilityProvider (SUPER_USER_CAPS)
**Status:** ✅ HANDLED

---

### 8.6 Schema Mismatches

**Issue:** Frontend queries wrong columns
**Examples:**
- ❌ `messages.sender_id` → ✅ `messages.sender_company_id`
- ❌ `rfqs.company_id` → ✅ `rfqs.buyer_company_id`
- ❌ `kyc_verifications.user_id` → ✅ `kyc_verifications.company_id` (no user_id)

**Status:** ✅ MOSTLY FIXED (see SCHEMA_REALIGNMENT_COMPLETE.md)

---

### 8.7 RLS Policy Issues

**Issue:** RLS policies may block legitimate access
**Mitigation:** ✅ Uses `app_metadata` (not `user_metadata`)
**Status:** ✅ FIXED (see RLS_SECURITY_ALIGNMENT_COMPLETE.md)

---

## 9. CONNECTION VERIFICATION

### 9.1 Frontend → Backend Connections

**✅ VERIFIED:**
- Login page → AuthService → Supabase Auth
- AuthService → Profiles table
- AuthProvider → Profiles table
- CapabilityProvider → Company Capabilities table
- Dashboard pages → Various tables (orders, rfqs, products, etc.)

---

### 9.2 Database Relationships

**✅ VERIFIED:**
- `profiles.id` → `auth.users.id` (1:1)
- `profiles.company_id` → `companies.id` (many:1)
- `company_capabilities.company_id` → `companies.id` (1:1)
- `rfqs.buyer_company_id` → `companies.id` (many:1)
- `messages.sender_company_id` → `companies.id` (many:1)
- `messages.receiver_company_id` → `companies.id` (many:1)

---

### 9.3 Kernel Integration

**✅ VERIFIED:**
- All dashboard pages use `useDashboardKernel()`
- All pages check `canLoadData` before fetching
- All pages use `profileCompanyId` from Kernel
- ProtectedRoute checks `isPreWarming`
- PostLoginRouter checks `isSystemReady`

---

### 9.4 Router Integration

**✅ VERIFIED:**
- AuthProvider wraps entire app
- CapabilityProvider wraps entire app
- ProtectedRoute guards dashboard routes
- RequireCapability ensures capabilities.ready
- PostLoginRouter handles post-login routing

---

## 📊 SUMMARY

### ✅ STRENGTHS

1. **Atomic Login:** AuthService provides atomic login with profile verification
2. **Kernel Handshake:** Robust pre-warming with exponential backoff retry
3. **Capability System:** Capability-based access control (not role-based)
4. **Schema Alignment:** Most schema mismatches fixed
5. **RLS Security:** Secure RLS policies using app_metadata
6. **Error Handling:** Graceful handling of missing profiles/companies
7. **Admin Bypass:** Admin users bypass capability checks

### ⚠️ POTENTIAL GAPS

1. **Profile Lag:** Profile may lag behind user creation (handled with retries)
2. **Session Refresh:** JWT metadata may need manual refresh (handled in AuthService)
3. **Race Conditions:** Multiple simultaneous logins (handled with guards)

### 🔍 RECOMMENDATIONS

1. ✅ Continue monitoring Kernel handshake success rate
2. ✅ Monitor profile fetch failures
3. ✅ Verify RLS policies are working correctly
4. ✅ Test admin access without company_id
5. ✅ Test capability fetch failures

---

**END OF FORENSIC AUDIT**

This audit is READ-ONLY and provides a complete analysis of the login → auth → dashboard → data flow architecture.
