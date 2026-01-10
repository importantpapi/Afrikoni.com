# PHASE 0 — FULL AUDIT SUMMARY (READ-ONLY)

**Date:** 2025-01-27  
**Status:** ✅ COMPLETE — No changes made  
**Goal:** Map existing system before refactoring to capability-based single workspace dashboard

---

## 1. DASHBOARD ROUTES IDENTIFIED

### Role-Based Dashboard Routes (TO BE REMOVED)
- `/dashboard/buyer` — Buyer dashboard entry
- `/dashboard/seller` — Seller dashboard entry  
- `/dashboard/hybrid` — Hybrid dashboard entry
- `/dashboard/logistics` — Logistics dashboard entry

### Current Dashboard Entry Points
- `/dashboard` — Base route that redirects to role-specific dashboards
- `/auth/post-login` — Post-login router that decides dashboard redirect

### Dashboard Sub-Routes (KEEP — Internal Modules)
All routes under `/dashboard/*` that are NOT role-specific:
- `/dashboard/orders` — Order management
- `/dashboard/rfqs` — RFQ management
- `/dashboard/products` — Product management
- `/dashboard/messages` — Messages
- `/dashboard/settings` — Settings
- `/dashboard/notifications` — Notifications
- `/dashboard/company-info` — Company settings
- `/dashboard/admin/*` — Admin routes (separate from workspace dashboard)

**Files:**
- `src/pages/dashboard/index.jsx` — Main dashboard router (lines 150-161 redirect to role dashboards)
- `src/utils/roleHelpers.js` — `getDashboardPathForRole()` function (lines 148-163)
- `src/utils/roles.js` — `getDashboardRoute()` function (lines 118-126)
- `src/App.jsx` — Route definitions (line 164: `/dashboard/*`)

---

## 2. ROLE-BASED REDIRECTS IDENTIFIED

### Login/Signup Redirects
**File:** `src/auth/PostLoginRouter.jsx`
- Lines 32-37: Redirects to `/dashboard` if role exists, else `/choose-service`
- **Issue:** Routes to `/dashboard` which then redirects again (double redirect)

**File:** `src/lib/post-login-redirect.ts`
- Lines 21-28: Checks profile.role and redirects to `/${profile.role}/dashboard`
- **Issue:** References old route structure

**File:** `src/pages/login.jsx` & `src/pages/signup.jsx`
- Redirect to `/auth/post-login` after successful auth

### ProtectedRoute Redirects
**File:** `src/components/ProtectedRoute.jsx`
- Lines 24-62: Checks authentication, company_id, admin access
- **Issue:** No role-based redirects (good), but `requireCompanyId` prop exists
- Line 47: Redirects to `/onboarding/company` if company_id missing

### Dashboard Entry Redirects
**File:** `src/pages/dashboard/index.jsx`
- Lines 124-131: Checks `onboarding_completed` flag (legacy)
- Lines 150-161: If on `/dashboard`, redirects to role-specific dashboard
- Lines 78-83: Extracts role from URL path (`/dashboard/buyer`, etc.)
- Lines 89-108: Validates role matches URL path, redirects on mismatch

**File:** `src/components/ServiceProtectedRoute.jsx`
- Lines 17-55: Checks role matches required role, redirects to `/choose-service` if not

### Role Protected Routes
**File:** `src/components/RoleProtectedRoute.tsx`
- Lines 17-56: Checks user roles from `user_roles` table (legacy system)
- Redirects to `/select-role` if role doesn't match

**File:** `src/components/RoleDashboardRoute.tsx`
- Lines 10-37: Uses `DashboardRoleContext` to validate role from URL path
- Redirects to role-specific dashboard home if role doesn't match

---

## 3. USES OF `profile.role` / `user_role` / `onboarding_completed`

### profile.role
**47 occurrences found:**
- `src/pages/dashboard/index.jsx` (line 76): Normalizes role for routing
- `src/auth/PostLoginRouter.jsx` (line 33): Checks if role exists for redirect
- `src/components/ProtectedRoute.jsx` (line 89): Used in `RoleProtectedRoute`
- `src/utils/roleHelpers.js` (line 21): `getUserRole()` function reads `profile.role || profile.user_role`
- `src/layouts/DashboardLayout.jsx` (line 348): Updates `role` and `user_role` in dev switcher
- `src/components/dashboard/RoleSelection.jsx` (line 91): Sets role on selection
- Multiple files check `profile.role` for access control

### user_role (Legacy Field)
**10 occurrences found:**
- `src/utils/companyHelper.js` (line 17): Fallback: `userData.role || userData.user_role`
- `src/layouts/DashboardLayout.jsx` (line 348): Sets both `role` and `user_role` (duplication)
- `src/components/dashboard/AdminCommandCenter.jsx` (line 51): Displays `user.user_role`
- `src/components/layout/Navbar.jsx` (line 661): Displays `user.user_role`
- `src/components/layout/HeaderActions.jsx` (line 127): Displays `user.user_role`

### onboarding_completed (Legacy Flag)
**8 occurrences found:**
- `src/pages/dashboard/index.jsx` (line 75): Checks if onboarding is completed
- `src/pages/dashboard/index.jsx` (line 124): Blocks dashboard if not completed
- `src/components/dashboard/RoleSelection.jsx` (line 90): Sets `onboarding_completed: true` on role selection
- `src/layouts/DashboardLayout.jsx` (line 349): Sets in dev role switcher
- `src/pages/auth-callback.jsx` (line 69): Sets to `false` on profile creation
- `src/utils/authHelpers.js` (lines 108, 119, 165): Used in auth helpers

### onboarding_step (Legacy Field)
**2 occurrences found:**
- Database schema: `profiles.onboarding_step` (integer, default 0)
- Not actively used in routing logic (can be safely removed)

**Database Schema:**
- `profiles.role` — TEXT with CHECK constraint: `('buyer', 'seller', 'hybrid', 'logistics')`
- `profiles.user_role` — TEXT (nullable, legacy)
- `profiles.onboarding_completed` — BOOLEAN (default false)
- `profiles.onboarding_step` — INTEGER (default 0)

---

## 4. REALTIME SUBSCRIPTIONS IDENTIFIED

### Main Realtime Hook
**File:** `src/hooks/useRealTimeData.js`
- Lines 83-293: `useRealTimeDashboardData()` hook
- **Guards:** Only subscribes if `companyId` exists (lines 88-98)
- **Channels Created:**
  1. `dashboard-rfqs-${companyId}` — RFQs for buyers
  2. `dashboard-products-${companyId}` — Products for sellers
  3. `dashboard-orders-${companyId}` — Orders for buyers/sellers
  4. `dashboard-messages-${companyId}` — Messages
  5. `dashboard-notifications-${userId}` — Notifications (uses userId, not companyId)

**File:** `src/pages/dashboard/DashboardHome.jsx`
- Lines 244-250: Uses `useRealTimeDashboardData()` hook
- **Guard:** Only passes `companyId` if it exists (line 245-247)
- Line 219: `handleRealTimeUpdate` callback processes realtime events

### Other Realtime Subscriptions
**File:** `src/pages/dashboard/notifications.jsx`
- Lines 45-88: Subscribes to notifications table
- **Guard:** Checks for `companyId || userId || user.email` (line 53)
- Uses channel: `notifications-updates`

**File:** `src/pages/messages-premium.jsx`
- Lines 224-310: Subscribes to messages table
- Uses channel: `messages-realtime`

**File:** `src/pages/dashboard/support-chat.jsx`
- Lines 209-247: Subscribes to support tickets
- Uses channel: `support-${ticketNumber}`

**File:** `src/pages/dashboard/admin/support-tickets.jsx`
- Lines 170-223: Admin realtime subscription
- Uses channel: `admin-support-${ticketNumber}-${timestamp}`

**File:** `src/pages/dashboard/risk.jsx`
- Lines 482-487: Subscribes to multiple tables (profiles, disputes, audit_log, shipments, companies)

**File:** `src/components/notificationbell.jsx`
- Lines 23-82: Notification bell realtime subscription

**Issues Found:**
- ✅ Most subscriptions have guards for `companyId`
- ⚠️ Some subscriptions use `userId` directly (not ideal for company-centric model)
- ⚠️ No global flag to disable realtime (PHASE 5 requirement)

---

## 5. SUPABASE TABLES RELATED TO CORE ENTITIES

### profiles Table
**Columns:**
- `id` (UUID, PK, FK → auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (TEXT, CHECK: 'buyer', 'seller', 'hybrid', 'logistics') — **TO BE DEPRECATED**
- `user_role` (TEXT, nullable) — **LEGACY, TO BE REMOVED**
- `onboarding_completed` (BOOLEAN, default false) — **TO BE DEPRECATED**
- `onboarding_step` (INTEGER, default 0) — **TO BE DEPRECATED**
- `company_id` (UUID, FK → companies.id) — **KEEP (REQUIRED)**
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- `Users can view own profile` — Uses `auth.uid() = id`
- `Users can update own profile` — Uses `auth.uid() = id`
- `Users can insert own profile` — Uses `auth.uid() = id`
- **Issue:** No public/anon policies (GOOD)

### companies Table
**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users) — **Legacy, may conflict with profiles.company_id**
- `name`, `company_name` (TEXT) — Duplicate?
- `email`, `owner_email` (TEXT) — Duplicate?
- `country`, `city`, `address` (TEXT)
- `description`, `industry`, `company_type` (TEXT)
- `verified` (BOOLEAN), `verification_status` (TEXT)
- `role` (TEXT) — **Legacy, should not exist on companies**
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- `authenticated_users_can_insert_companies` — Allows authenticated insert
- `authenticated_users_can_view_companies` — Allows authenticated view
- `authenticated_users_can_update_own_companies` — Uses `current_company_id()`
- **Issue:** Some migrations show `TO authenticated, anon` grants (RISKY — PHASE 2)

### products Table
**Columns:**
- `id` (UUID, PK)
- `company_id` (UUID, FK → companies.id) — **REQUIRED**
- `category_id` (UUID, FK → categories.id)
- `title`, `description` (TEXT)
- `price_min`, `price_max` (NUMERIC)
- `currency` (TEXT, default 'USD')
- `moq` (INTEGER)
- `country_of_origin` (TEXT)
- `status` (TEXT, CHECK: 'active', 'inactive', 'pending', 'deleted')
- `views` (INTEGER, default 0)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- `products_select` — Uses `company_id = current_company_id()`
- `products_insert` — Uses `company_id = current_company_id()`
- `products_update` — Uses `company_id = current_company_id()`
- `products_delete` — Uses `company_id = current_company_id()`
- **Issue:** Some migrations show `GRANT ALL ON products TO authenticated, anon` (RISKY — PHASE 2)

### orders Table
**Columns:**
- `id` (UUID, PK)
- `buyer_company_id` (UUID, FK → companies.id) — **REQUIRED**
- `seller_company_id` (UUID, FK → companies.id) — **REQUIRED**
- `total_amount` (NUMERIC)
- `currency` (TEXT, default 'USD')
- `status` (TEXT, CHECK: 'pending', 'processing', 'completed', 'cancelled')
- `quantity` (INTEGER)
- `unit` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- `orders_select` — Uses `buyer_company_id = current_company_id() OR seller_company_id = current_company_id()`
- `orders_insert` — Uses `buyer_company_id = current_company_id() OR seller_company_id = current_company_id()`
- `orders_update` — Uses `buyer_company_id = current_company_id() OR seller_company_id = current_company_id()`
- `orders_delete` — Uses `buyer_company_id = current_company_id() OR seller_company_id = current_company_id()`

### rfqs Table
**Columns:**
- `id` (UUID, PK)
- `buyer_company_id` (UUID, FK → companies.id) — **REQUIRED**
- `title`, `description` (TEXT)
- `category_id` (UUID, FK → categories.id)
- `status` (TEXT, CHECK: 'open', 'closed', 'awarded')
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- `rfqs_select` — Uses `buyer_company_id = current_company_id() OR company_id = current_company_id()`
- `rfqs_insert` — Uses `buyer_company_id = current_company_id() OR company_id = current_company_id()`
- `rfqs_update` — Uses `buyer_company_id = current_company_id() OR company_id = current_company_id()`
- `rfqs_delete` — Uses `buyer_company_id = current_company_id() OR company_id = current_company_id()`
- **Note:** Some policies reference `company_id` (should be `buyer_company_id` only)

### Other Related Tables
- `notifications` — Has `company_id` and `user_id` columns
- `messages` — Uses `sender_company_id` and `receiver_company_id`
- `audit_log` — Has `company_id` column
- `categories` — Public table, no company isolation needed

---

## 6. DANGEROUS RLS POLICIES IDENTIFIED

### Public/Anon Access (TO BE REMOVED IN PHASE 2)
**File:** `supabase/migrations/20260110_ultimate_fix.sql`
- Lines 58, 92, 126: `GRANT ... TO authenticated, anon`
- Lines 177-179: `GRANT ALL ON products/categories/product_images TO authenticated, anon`

**File:** `supabase/migrations/20250124000002_fix_signup_database_errors.sql`
- Line 236: `GRANT EXECUTE ON FUNCTION public.safe_create_profile(uuid, text) TO anon`

**Tables Affected:**
- `companies` — Some policies allow `authenticated, anon`
- `products` — Grants to `authenticated, anon`
- `categories` — Grants to `authenticated, anon`
- `product_images` — Grants to `authenticated, anon`

**Action Required (PHASE 2):**
- Remove all `anon` roles from RLS policies
- Remove all `GRANT ... TO anon` statements
- Ensure only `authenticated` users with valid `company_id` can access company data

---

## 7. KEY COMPONENTS IDENTIFIED

### Dashboard Components
- `src/pages/dashboard/index.jsx` — Main dashboard router (TO BE REPLACED)
- `src/pages/dashboard/buyer/BuyerHome.jsx` — Buyer dashboard home (TO BE REFACTORED)
- `src/pages/dashboard/seller/SellerHome.jsx` — Seller dashboard home (TO BE REFACTORED)
- `src/pages/dashboard/hybrid/HybridHome.jsx` — Hybrid dashboard home (TO BE REFACTORED)
- `src/pages/dashboard/logistics/LogisticsHome.jsx` — Logistics dashboard home (TO BE REFACTORED)
- `src/pages/dashboard/DashboardHome.jsx` — Shared dashboard home component (REUSE)

### Layout Components
- `src/layouts/DashboardLayout.jsx` — Main dashboard layout (TO BE REFACTORED)
- Uses `currentRole` prop to determine sidebar items

### Route Protection Components
- `src/components/ProtectedRoute.jsx` — Auth guard (TO BE SIMPLIFIED)
- `src/components/RoleProtectedRoute.tsx` — Role guard (TO BE DEPRECATED)
- `src/components/RoleDashboardRoute.tsx` — Dashboard role guard (TO BE DEPRECATED)
- `src/components/ServiceProtectedRoute.jsx` — Service guard (TO BE DEPRECATED)

### Context Providers
- `src/contexts/AuthProvider.jsx` — Auth context (KEEP)
- `src/context/RoleContext.tsx` — Role context (TO BE REFACTORED)
- `src/context/DashboardRoleContext.tsx` — Dashboard role context (TO BE DEPRECATED)

---

## 8. LEGACY CODE PATTERNS TO REMOVE

### Pattern 1: Role-Based Routing
```javascript
// CURRENT (TO BE REMOVED)
if (role === 'buyer') navigate('/dashboard/buyer');
if (role === 'seller') navigate('/dashboard/seller');
if (role === 'hybrid') navigate('/dashboard/hybrid');
if (role === 'logistics') navigate('/dashboard/logistics');
```

### Pattern 2: Onboarding Flag Checks
```javascript
// CURRENT (TO BE REMOVED)
if (!onboarding_completed) {
  showRoleSelection();
  return;
}
```

### Pattern 3: Profile Role Checks
```javascript
// CURRENT (TO BE REPLACED)
const userRole = profile.role || profile.user_role || 'buyer';
if (!['buyer', 'seller', 'hybrid', 'logistics'].includes(userRole)) {
  redirectToRoleSelection();
}
```

### Pattern 4: Multiple Role Fields
```javascript
// CURRENT (TO BE CLEANED)
profile.role = selectedRole;
profile.user_role = selectedRole; // Duplicate!
profile.onboarding_completed = true;
```

---

## 9. SUMMARY STATISTICS

- **Dashboard Routes:** 4 role-based routes (buyer, seller, hybrid, logistics)
- **Redirect Points:** 8 files with role-based redirects
- **profile.role Usage:** 47 occurrences
- **onboarding_completed Usage:** 8 occurrences
- **Realtime Subscriptions:** 6 main subscription points
- **Database Tables:** 12 core tables related to profiles/companies/products/orders/rfqs
- **RLS Policies with Public/Anon:** 5 dangerous grants found
- **Components to Refactor:** 15+ components need changes

---

## 10. NEXT STEPS (PHASE 1)

1. **Create `company_capabilities` table** with capability flags
2. **Add RLS policies** for capability table
3. **Create trigger** to auto-create capabilities row on company creation
4. **Verify:** Every company has exactly one capabilities row

---

**END OF PHASE 0 AUDIT** ✅
