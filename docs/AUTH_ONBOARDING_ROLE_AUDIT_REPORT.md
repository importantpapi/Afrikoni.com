# 🔐 AUTHENTICATION, ONBOARDING & ROLE LOGIC — AUDIT REPORT
## PHASE 2 — CLUSTER 6: Step 1 & 2 (Scan + Specification)

**Date:** 2024  
**Status:** ✅ **AUDIT COMPLETE — READY FOR IMPLEMENTATION**

---

## 📋 EXECUTIVE SUMMARY

This audit scanned **8 core auth/role files** and identified **15 critical issues** across 4 categories:

- **C4.x — Navigation/Redirect Issues:** 4 issues
- **B6.x — Onboarding & Auth UX Issues:** 3 issues  
- **C5.x — Hybrid Logic Missing/Incomplete:** 4 issues
- **A7.2/A7.4 — Duplicated/Fragile Logic:** 4 issues

**Priority Breakdown:**
- 🔴 **Critical:** 6 issues (affects user flow)
- 🟡 **High:** 6 issues (affects code maintainability)
- 🟢 **Medium:** 3 issues (affects code quality)

---

## 1. C4.x — NAVIGATION/REDIRECT ISSUES (4 Issues)

### C4.1 — Login Redirects Without Onboarding Check ❌

**File:** `src/pages/login.jsx` (Line 38)

**Current Behavior:**
```javascript
// After successful login
toast.success('Logged in successfully!');
navigate('/dashboard');  // ❌ Always redirects to dashboard
```

**Problem:**
- No check for `onboarding_completed` status
- No profile fetch after login
- Users who haven't completed onboarding go directly to dashboard
- No way to ensure user has completed setup

**Expected Behavior:**
```javascript
// After successful login
const userProfile = await supabaseHelpers.auth.me();
if (!userProfile.onboarding_completed) {
  navigate('/onboarding');
} else {
  navigate('/dashboard');
}
```

**Priority:** 🔴 **Critical**

---

### C4.2 — Signup Redirects Directly to Dashboard ❌

**File:** `src/pages/signup.jsx` (Line 73)

**Current Behavior:**
```javascript
// After signup
toast.success('Account created successfully! Redirecting to dashboard...');
navigate('/dashboard');  // ❌ Always redirects to dashboard
```

**Problem:**
- New users skip onboarding entirely
- Profile created with minimal data (only `full_name`, `role: 'buyer'`)
- No company information collected
- Users land on dashboard without proper setup

**Expected Behavior:**
```javascript
// After signup
toast.success('Account created successfully!');
navigate('/onboarding');  // ✅ Always redirect to onboarding
```

**Priority:** 🔴 **Critical**

---

### C4.3 — Dashboard Index Has No Onboarding Check ❌

**File:** `src/pages/dashboard/index.jsx` (Lines 17-89)

**Current Behavior:**
```javascript
// Checks session and loads role, but:
// ❌ No check for onboarding_completed
// ❌ Creates profile if missing, but doesn't redirect to onboarding
```

**Problem:**
- Users can access dashboard without completing onboarding
- If profile doesn't exist, creates one with default role but doesn't ensure setup is complete
- No guard against incomplete profiles

**Expected Behavior:**
```javascript
// After loading profile
if (!userData.onboarding_completed) {
  navigate('/onboarding');
  return;
}
```

**Priority:** 🔴 **Critical**

---

### C4.4 — ProtectedRoute Doesn't Check Onboarding ❌

**File:** `src/components/ProtectedRoute.jsx` (Line 24)

**Current Behavior:**
```javascript
// User is authorized - no onboarding checks
setIsAuthorized(true);  // ❌ Only checks session, not onboarding
```

**Problem:**
- ProtectedRoute only checks authentication
- No optional `requireOnboarding` prop
- All protected routes allow access regardless of onboarding status

**Expected Behavior:**
```javascript
// Check onboarding if required
if (requireOnboarding && !userProfile.onboarding_completed) {
  navigate('/onboarding');
  return;
}
```

**Priority:** 🟡 **High**

---

## 2. B6.x — ONBOARDING & AUTH UX ISSUES (3 Issues)

### B6.1 — Onboarding Page Doesn't Exist ❌

**Finding:**
- No `src/pages/onboarding.jsx` file found
- Documentation suggests it was removed
- But login/signup flows still reference it

**Problem:**
- Users have no way to complete onboarding
- No onboarding flow exists
- Signup creates minimal profile and redirects to dashboard

**Expected Behavior:**
- Create `src/pages/onboarding.jsx` with:
  - Step 1: Role selection (buyer, seller, hybrid, logistics)
  - Step 2: Company information
  - Save `onboarding_completed: true` on completion
  - Redirect to `/dashboard` after completion

**Priority:** 🔴 **Critical**

---

### B6.2 — No Onboarding Completion Flag ❌

**Finding:**
- `onboarding_completed` field not found in any code
- No checks for this field anywhere
- Profile creation doesn't set this flag

**Problem:**
- No way to track if user completed onboarding
- No way to prevent users from skipping setup
- No idempotency check (users can't be redirected away from onboarding if already completed)

**Expected Behavior:**
- Add `onboarding_completed` boolean field to `profiles` table
- Set to `false` on signup
- Set to `true` when onboarding completes
- Check this flag in login and dashboard routes

**Priority:** 🔴 **Critical**

---

### B6.3 — Signup Creates Minimal Profile ❌

**File:** `src/pages/signup.jsx` (Lines 59-70)

**Current Behavior:**
```javascript
// Creates profile with only:
{
  id: data.user.id,
  full_name: formData.fullName,
  role: 'buyer'  // Default role
}
// ❌ No company info
// ❌ No onboarding_completed flag
// ❌ No phone, country, etc.
```

**Problem:**
- Profile is incomplete
- User has no company information
- Can't use most dashboard features without company

**Expected Behavior:**
```javascript
// Create profile with:
{
  id: data.user.id,
  full_name: formData.fullName,
  role: 'buyer',  // Default, can be changed in onboarding
  onboarding_completed: false  // ✅ Must complete onboarding
}
```

**Priority:** 🟡 **High**

---

## 3. C5.x — HYBRID LOGIC MISSING/INCOMPLETE (4 Issues)

### C5.1 — Hybrid Role Detection Duplicated ❌

**Files Affected:**
- `src/pages/dashboard/index.jsx` (Line 79-80)
- `src/pages/dashboard/DashboardHome.jsx` (Line 118-120)
- `src/pages/dashboard/rfqs.jsx` (Line 51-52)
- `src/pages/dashboard/orders.jsx` (Similar pattern)
- `src/pages/dashboard/analytics.jsx` (Similar pattern)
- Multiple other dashboard pages

**Current Pattern (Duplicated Everywhere):**
```javascript
// ❌ Same code in 10+ files
const role = userData.role || userData.user_role || 'buyer';
const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;
const isHybrid = role === 'hybrid';
```

**Problem:**
- Role detection logic duplicated across 10+ files
- Inconsistent normalization
- Hard to maintain
- Easy to introduce bugs

**Expected Behavior:**
```javascript
// ✅ Centralized helper
import { getUserRole, isHybrid, isBuyer, isSeller } from '@/utils/roleHelpers';
const role = await getUserRole(userData);
```

**Priority:** 🟡 **High**

---

### C5.2 — Hybrid View Mode Logic Only in DashboardHome ❌

**File:** `src/pages/dashboard/DashboardHome.jsx` (Line 29, 34-43)

**Current Behavior:**
```javascript
// ✅ Has viewMode for hybrid users
const [viewMode, setViewMode] = useState('everything'); // For hybrid users

// ✅ Filters stats based on viewMode
const stats = React.useMemo(() => {
  if (viewMode === 'everything') return allStats;
  if (viewMode === 'buyer') { /* filter buyer stats */ }
  if (viewMode === 'seller') { /* filter seller stats */ }
}, [allStats, viewMode]);
```

**Problem:**
- View mode toggle only exists in DashboardHome
- Other pages (Orders, RFQs, Analytics) don't have view mode toggle
- Hybrid users see all data mixed together on other pages
- No consistent way to switch between buyer/seller views

**Expected Behavior:**
- Add view mode toggle to:
  - Orders page (Buyer Orders / Seller Orders)
  - RFQs page (Sent RFQs / Received RFQs)
  - Analytics page (Buyer Analytics / Seller Analytics)
- Or create a global view mode context

**Priority:** 🟡 **High**

---

### C5.3 — Hybrid Condition Checks Scattered ❌

**Files Affected:**
- `src/pages/dashboard/rfqs.jsx` (Lines 189, 257, 260, 263)
- `src/pages/dashboard/help.jsx` (Lines 251, 254, 262, 316)
- Multiple other pages

**Current Pattern:**
```javascript
// ❌ Repeated everywhere
{(currentRole === 'buyer' || currentRole === 'hybrid') && (
  // Buyer content
)}

{(currentRole === 'seller' || currentRole === 'hybrid') && (
  // Seller content
)}
```

**Problem:**
- Long condition checks repeated
- Hard to read
- Easy to miss a condition
- No helper functions

**Expected Behavior:**
```javascript
// ✅ Use helper functions
import { canViewBuyerFeatures, canViewSellerFeatures } from '@/utils/roleHelpers';

{canViewBuyerFeatures(currentRole) && (
  // Buyer content
)}

{canViewSellerFeatures(currentRole) && (
  // Seller content
)}
```

**Priority:** 🟢 **Medium**

---

### C5.4 — Hybrid Data Loading Logic Duplicated ❌

**File:** `src/pages/dashboard/DashboardHome.jsx` (Lines 116-200)

**Current Behavior:**
```javascript
// ❌ Complex hybrid logic duplicated
const role = userData.role || userData.user_role || 'buyer';
const isHybrid = role === 'hybrid';
const showBuyerStats = isHybrid ? true : (role === 'buyer');
const showSellerStats = isHybrid ? true : (role === 'seller');

// Then loads data conditionally
if (showBuyerStats) { /* load buyer data */ }
if (showSellerStats) { /* load seller data */ }
```

**Problem:**
- Same pattern repeated in multiple pages
- Complex conditional logic
- Hard to maintain
- Inconsistent across pages

**Expected Behavior:**
```javascript
// ✅ Centralized data loading helper
import { shouldLoadBuyerData, shouldLoadSellerData } from '@/utils/roleHelpers';

if (shouldLoadBuyerData(role, viewMode)) { /* load buyer data */ }
if (shouldLoadSellerData(role, viewMode)) { /* load seller data */ }
```

**Priority:** 🟡 **High**

---

## 4. A7.2/A7.4 — DUPLICATED/FRAGILE LOGIC (4 Issues)

### A7.2 — Role Detection Logic Duplicated in 10+ Files ❌

**Files with Duplicated Role Detection:**
1. `src/pages/dashboard/index.jsx` (Lines 17-89)
2. `src/pages/dashboard/DashboardHome.jsx` (Lines 51-114)
3. `src/pages/dashboard/rfqs.jsx` (Lines 43-52)
4. `src/pages/dashboard/orders.jsx` (Lines 28-80)
5. `src/pages/dashboard/products.jsx` (Similar)
6. `src/pages/dashboard/analytics.jsx` (Similar)
7. `src/pages/dashboard/payments.jsx` (Similar)
8. `src/pages/dashboard/protection.jsx` (Similar)
9. `src/pages/dashboard/settings.jsx` (Similar)
10. `src/pages/dashboard/shipments.jsx` (Similar)

**Duplicated Pattern:**
```javascript
// ❌ Same code in every file
const userData = await supabaseHelpers.auth.me();
const role = userData.role || userData.user_role || 'buyer';
const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;
setCurrentRole(normalizedRole);
```

**Problem:**
- 50+ lines of duplicated code
- If logic changes, must update 10+ files
- Inconsistent error handling
- Different fallback behaviors

**Expected Behavior:**
```javascript
// ✅ Single source of truth
import { getCurrentUserAndRole } from '@/utils/authHelpers';
const { user, role } = await getCurrentUserAndRole();
```

**Priority:** 🔴 **Critical**

---

### A7.4 — Profile Fetching Logic Duplicated ❌

**Files with Duplicated Profile Fetching:**
- `src/pages/dashboard/index.jsx` (Lines 27-60)
- `src/api/supabaseClient.js` (Lines 16-61) - `supabaseHelpers.auth.me()`
- Multiple dashboard pages use `supabaseHelpers.auth.me()` but then duplicate error handling

**Current Pattern:**
```javascript
// ❌ Duplicated in dashboard/index.jsx
const { data: profilesData, error: profilesErr } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

if (profilesErr) {
  // Try users table fallback
  // ... 20+ lines of fallback logic
}
```

**Problem:**
- Same fallback logic in multiple places
- `supabaseHelpers.auth.me()` already has this logic, but dashboard/index.jsx reimplements it
- Inconsistent error handling

**Expected Behavior:**
```javascript
// ✅ Use existing helper
const userData = await supabaseHelpers.auth.me();
// Helper already handles profiles/users fallback
```

**Priority:** 🟡 **High**

---

### A7.4 — Company ID Fetching Logic Duplicated ❌

**Files with Duplicated Company Logic:**
- `src/pages/dashboard/DashboardHome.jsx` (Lines 85-92)
- `src/pages/dashboard/orders.jsx` (Lines 42-81)
- `src/pages/dashboard/rfqs.jsx` (Lines 56-57)
- Multiple other pages

**Current Pattern:**
```javascript
// ❌ Duplicated everywhere
const { getOrCreateCompany } = await import('@/utils/companyHelper');
const companyId = await getOrCreateCompany(supabase, userData);
```

**Problem:**
- Dynamic import repeated in every file
- Company fetching logic scattered
- No centralized user context

**Expected Behavior:**
```javascript
// ✅ Include in auth helper
import { getCurrentUserAndRole } from '@/utils/authHelpers';
const { user, role, companyId } = await getCurrentUserAndRole();
// companyId already fetched
```

**Priority:** 🟢 **Medium**

---

### A7.2 — Session Check Logic Duplicated ❌

**Files with Duplicated Session Checks:**
- `src/pages/dashboard/index.jsx` (Lines 19-25)
- `src/components/ProtectedRoute.jsx` (Lines 17-22)
- `src/pages/dashboard/DashboardHome.jsx` (Lines 59-63)
- Multiple dashboard pages

**Current Pattern:**
```javascript
// ❌ Same check everywhere
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !session) {
  navigate('/login');
  return;
}
```

**Problem:**
- Session check duplicated
- ProtectedRoute already checks this, but dashboard pages check again
- Redundant checks

**Expected Behavior:**
```javascript
// ✅ ProtectedRoute handles this
// Dashboard pages can assume user is authenticated
// Only check if needed for specific logic
```

**Priority:** 🟢 **Medium**

---

## 📊 SUMMARY BY PRIORITY

### 🔴 Critical Issues (6)
1. C4.1 — Login redirects without onboarding check
2. C4.2 — Signup redirects directly to dashboard
3. C4.3 — Dashboard has no onboarding check
4. B6.1 — Onboarding page doesn't exist
5. B6.2 — No onboarding completion flag
6. A7.2 — Role detection duplicated in 10+ files

### 🟡 High Priority Issues (6)
1. C4.4 — ProtectedRoute doesn't check onboarding
2. B6.3 — Signup creates minimal profile
3. C5.1 — Hybrid role detection duplicated
4. C5.2 — Hybrid view mode only in DashboardHome
5. C5.4 — Hybrid data loading logic duplicated
6. A7.4 — Profile fetching logic duplicated

### 🟢 Medium Priority Issues (3)
1. C5.3 — Hybrid condition checks scattered
2. A7.4 — Company ID fetching duplicated
3. A7.2 — Session check logic duplicated

---

## 🎯 STEP 2 — DESIRED BEHAVIOR SPECIFICATION

### 🔐 **Auth Flow Specification**

#### **Login Flow:**
```
1. User enters email/password
2. Call supabaseHelpers.auth.signIn()
3. On success:
   a. Fetch user profile (supabaseHelpers.auth.me())
   b. Check onboarding_completed:
      - If false/null → navigate('/onboarding')
      - If true → navigate('/dashboard')
4. Show loading state during auth check
5. Show clear error messages on failure
```

#### **Signup Flow:**
```
1. User enters name, email, password, confirm password
2. Validate inputs (match passwords, min length, etc.)
3. Call supabaseHelpers.auth.signUp()
4. On success:
   a. Create profile with:
      - id: user.id
      - full_name: formData.fullName
      - role: 'buyer' (default)
      - onboarding_completed: false
   b. Navigate('/onboarding') (NEVER directly to dashboard)
5. If email confirmation required:
   - Show message: "Please check your email"
   - Navigate('/login')
6. Show loading state
7. Show clear error messages
```

#### **Logout Flow:**
```
1. Call supabaseHelpers.auth.signOut()
2. Clear session
3. Navigate('/login')
4. Show success toast
```

---

### 🎭 **Role Logic Specification**

#### **Role Storage:**
- **Primary location:** `profiles.role` (or `profiles.user_role` for backward compatibility)
- **Valid roles:** `'buyer'`, `'seller'`, `'hybrid'`, `'logistics'` (normalized from `'logistics_partner'`)
- **Default role:** `'buyer'` (if not set)

#### **Role Detection Helper:**
```javascript
// src/utils/roleHelpers.js

/**
 * Get user role from profile data
 * @param {Object} profile - User profile object
 * @returns {string} - Normalized role ('buyer', 'seller', 'hybrid', 'logistics')
 */
export function getUserRole(profile) {
  if (!profile) return 'buyer';
  const role = profile.role || profile.user_role || 'buyer';
  // Normalize logistics_partner to logistics
  return role === 'logistics_partner' ? 'logistics' : role;
}

/**
 * Check if user is buyer (or hybrid in buyer mode)
 */
export function isBuyer(role, viewMode = 'everything') {
  return role === 'buyer' || (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'buyer'));
}

/**
 * Check if user is seller (or hybrid in seller mode)
 */
export function isSeller(role, viewMode = 'everything') {
  return role === 'seller' || (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'seller'));
}

/**
 * Check if user is hybrid
 */
export function isHybrid(role) {
  return role === 'hybrid';
}

/**
 * Check if user can view buyer features
 */
export function canViewBuyerFeatures(role, viewMode = 'everything') {
  return isBuyer(role, viewMode);
}

/**
 * Check if user can view seller features
 */
export function canViewSellerFeatures(role, viewMode = 'everything') {
  return isSeller(role, viewMode);
}

/**
 * Determine what data to load based on role and view mode
 */
export function shouldLoadBuyerData(role, viewMode = 'everything') {
  return isBuyer(role, viewMode);
}

export function shouldLoadSellerData(role, viewMode = 'everything') {
  return isSeller(role, viewMode);
}
```

#### **Centralized Auth Helper:**
```javascript
// src/utils/authHelpers.js

/**
 * Get current user with profile and role
 * Handles all fallback logic (profiles/users tables)
 * @returns {Promise<{user: Object, role: string, companyId: string|null}>}
 */
export async function getCurrentUserAndRole() {
  // 1. Check session
  // 2. Fetch profile (with fallback)
  // 3. Get or create company
  // 4. Normalize role
  // 5. Return { user, role, companyId }
}

/**
 * Check if user has completed onboarding
 * @param {Object} profile - User profile
 * @returns {boolean}
 */
export function hasCompletedOnboarding(profile) {
  return profile?.onboarding_completed === true;
}
```

---

### 🎓 **Onboarding Flow Specification**

#### **Onboarding Page Structure:**
```
Route: /onboarding

Step 1: Role Selection
- Show 4 role cards: Buyer, Seller, Hybrid, Logistics
- User must select one
- Continue button disabled until selection

Step 2: Company Information
- Company name (required)
- Business type
- Country (required)
- City
- Phone (required)
- Website
- Year established
- Company size
- Description

On Completion:
1. Create/update company in companies table
2. Update profile with:
   - role: selectedRole
   - company_id: company.id
   - onboarding_completed: true
   - All company fields
3. Navigate('/dashboard')
```

#### **Onboarding Idempotency:**
```
If user already completed onboarding:
- Check onboarding_completed === true
- Redirect to /dashboard
- Don't show onboarding form
```

---

### 🔄 **Hybrid User Behavior Specification**

#### **Hybrid View Mode:**
- **Default:** `'everything'` (shows both buyer and seller data)
- **Toggle options:** `'everything'`, `'buyer'`, `'seller'`
- **Location:** Toggle visible in:
  - Dashboard Home (already exists)
  - Orders page (Buyer Orders / Seller Orders)
  - RFQs page (Sent RFQs / Received RFQs)
  - Analytics page (Buyer Analytics / Seller Analytics)

#### **Hybrid Data Loading:**
```
When viewMode === 'everything':
  - Load both buyer and seller data
  - Show combined stats/cards

When viewMode === 'buyer':
  - Load only buyer data
  - Show only buyer stats/cards

When viewMode === 'seller':
  - Load only seller data
  - Show only seller stats/cards
```

#### **Hybrid UI Patterns:**
```javascript
// ✅ Use helper functions
{canViewBuyerFeatures(role, viewMode) && (
  <BuyerSection />
)}

{canViewSellerFeatures(role, viewMode) && (
  <SellerSection />
)}
```

---

## 📁 FILES REQUIRING CHANGES

### **New Files to Create:**
1. `src/utils/authHelpers.js` - Centralized auth logic
2. `src/utils/roleHelpers.js` - Centralized role logic
3. `src/pages/onboarding.jsx` - Onboarding flow (if needed)

### **Files to Modify:**
1. `src/pages/login.jsx` - Add onboarding check
2. `src/pages/signup.jsx` - Add onboarding redirect, set onboarding_completed: false
3. `src/pages/dashboard/index.jsx` - Use helpers, add onboarding check
4. `src/pages/dashboard/DashboardHome.jsx` - Use helpers, improve hybrid logic
5. `src/layouts/DashboardLayout.jsx` - Use helpers (if needed)
6. `src/components/ProtectedRoute.jsx` - Add optional onboarding check
7. All dashboard pages - Replace duplicated role detection with helpers

---

## ✅ NEXT STEPS

**Step 3 will:**
1. Create `src/utils/authHelpers.js` and `src/utils/roleHelpers.js`
2. Update login.jsx with onboarding check
3. Update signup.jsx with onboarding redirect
4. Refactor dashboard/index.jsx to use helpers
5. Refactor DashboardHome.jsx to use helpers
6. Update all dashboard pages to use helpers
7. Add onboarding page (if needed)
8. Add view mode toggles for hybrid users

**Estimated Files to Modify:** 15-20 files  
**Estimated Changes:** 200+ individual fixes

---

**END OF AUDIT REPORT**

**Status:** ✅ **READY FOR IMPLEMENTATION**

**Awaiting approval to proceed with Step 3 (Implementation with DIFFS).**

