# RFQ Creation Pipeline - Forensic Audit Report

**Date:** January 20, 2026  
**Auditor:** Senior Full-Stack Database Architect & Forensic Engineer  
**Status:** 🔴 **CRITICAL ISSUES IDENTIFIED** - Read-Only Analysis

---

## 🎯 Executive Summary

This forensic audit identified **6 CRITICAL MISMATCHES** between the code, database schema, and RLS policies that are causing:
- ❌ Infinite spinner (state management + schema mismatch)
- ❌ Schema cache errors (missing column)
- ❌ 403 Forbidden errors (RLS policy conflicts)
- ❌ 23505 duplicate key errors (unique constraint violation)

**Root Causes:**
1. **MISSING COLUMN:** `buyer_user_id` does not exist in `rfqs` table
2. **STATUS CONSTRAINT VIOLATION:** Code uses `'in_review'` and `'matched'` but constraint only allows `'draft', 'open', 'pending', 'awarded', 'closed'`
3. **UNIQUE CONSTRAINT:** `companies.user_id` has UNIQUE constraint causing 23505 errors on lazy profile creation
4. **RLS POLICY CONFLICTS:** Multiple overlapping policies with conflicting `WITH CHECK` conditions
5. **STATE ZOMBIES:** Early returns bypass finally block, causing spinner to persist

---

## 🔴 CRITICAL FINDING #1: Missing Column `buyer_user_id`

### Database Schema (Actual)
```sql
-- rfqs table columns (from information_schema.columns)
-- NO buyer_user_id column exists!
Columns found:
- id (uuid)
- buyer_company_id (uuid) ✅ EXISTS
- category_id (uuid)
- title (text)
- description (text)
- ... (21 total columns)
-- buyer_user_id ❌ MISSING
```

### Code Expectation (rfqService.js:162)
```javascript
const rfqData = {
  // ...
  buyer_user_id: user.id, // ❌ COLUMN DOES NOT EXIST IN DATABASE
  // ...
};
```

### Impact
- **Schema Cache Error:** "Could not find column in schema cache"
- **Database Error:** Column `buyer_user_id` does not exist (code 42703)
- **RFQ Creation Fails:** Insert fails silently or throws error

### Recommendation
**Option A:** Add `buyer_user_id` column to `rfqs` table
```sql
ALTER TABLE public.rfqs 
ADD COLUMN buyer_user_id UUID REFERENCES auth.users(id);
```

**Option B:** Remove `buyer_user_id` from `rfqService.js` payload
```javascript
// Remove this line:
buyer_user_id: user.id, // ❌ REMOVE - column doesn't exist
```

**Preferred:** Option A (add column) - maintains audit trail of which user created the RFQ

---

## 🔴 CRITICAL FINDING #2: Status Constraint Violation

### Database Constraint (Actual)
```sql
-- rfqs_status_check constraint
CHECK (status = ANY (ARRAY[
  'draft'::text, 
  'open'::text, 
  'pending'::text, 
  'awarded'::text, 
  'closed'::text
]))
```

**Allowed Values:** `'draft'`, `'open'`, `'pending'`, `'awarded'`, `'closed'`

### Code Usage (rfqService.js)
```javascript
// Line 160: ✅ VALID
status: 'open', // ✅ Allowed

// Line 280 (createRFQInReview): ❌ INVALID
status: 'in_review', // ❌ NOT ALLOWED - Constraint violation!

// Other places may use: ❌ INVALID
status: 'matched', // ❌ NOT ALLOWED - Constraint violation!
```

### Impact
- **Constraint Violation:** Code 23514 (check constraint violation)
- **RFQ Creation Fails:** Insert rejected by database
- **Silent Failure:** Error may be swallowed, causing spinner to persist

### Recommendation
**Option A:** Update constraint to include missing statuses
```sql
ALTER TABLE public.rfqs 
DROP CONSTRAINT rfqs_status_check;

ALTER TABLE public.rfqs 
ADD CONSTRAINT rfqs_status_check 
CHECK (status = ANY (ARRAY[
  'draft'::text, 
  'open'::text, 
  'pending'::text,
  'in_review'::text,  -- ✅ ADD
  'matched'::text,    -- ✅ ADD
  'awarded'::text, 
  'closed'::text,
  'cancelled'::text   -- ✅ ADD (if used)
]));
```

**Option B:** Change code to use only allowed statuses
- Use `'open'` instead of `'in_review'`
- Use `'pending'` instead of `'matched'`

**Preferred:** Option A (update constraint) - maintains existing code logic

---

## 🔴 CRITICAL FINDING #3: Unique Constraint on `companies.user_id`

### Database Constraint (Actual)
```sql
-- companies_user_id_key constraint
UNIQUE (user_id)
```

**Constraint Type:** UNIQUE  
**Column:** `user_id`  
**Impact:** Only ONE company per user_id allowed

### Code Behavior (rfqService.js:92-105)
```javascript
// Lazy Profile Strategy tries to INSERT company
const { data: newCompany, error: createError } = await supabase
  .from('companies')
  .insert({
    user_id: user.id,  // ❌ If company already exists, violates UNIQUE constraint
    // ...
  });
```

### Impact
- **23505 Error:** Duplicate key value violates unique constraint
- **Lazy Profile Fails:** Cannot create second company for same user
- **RFQ Creation Blocked:** If company creation fails, RFQ creation may fail

### Root Cause Analysis
1. User already has company (from previous creation)
2. `getOrCreateCompany()` fails to find it (RLS issue?)
3. Lazy profile tries to INSERT new company
4. UNIQUE constraint violation (23505)

### Recommendation
**Fix Lazy Profile Logic:**
```javascript
// ✅ BEFORE INSERT: Check if company already exists
const { data: existingCompany } = await supabase
  .from('companies')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (existingCompany?.id) {
  companyId = existingCompany.id;
  // Don't try to INSERT again
} else {
  // Only INSERT if company doesn't exist
  const { data: newCompany } = await supabase
    .from('companies')
    .insert({ user_id: user.id, ... });
}
```

**OR:** Use UPSERT instead of INSERT
```javascript
const { data: company } = await supabase
  .from('companies')
  .upsert({
    user_id: user.id,
    company_name: defaultCompanyName,
    // ...
  }, {
    onConflict: 'user_id',  // ✅ Handle duplicate gracefully
    ignoreDuplicates: false
  })
  .select('id')
  .single();
```

---

## 🔴 CRITICAL FINDING #4: `current_company_id()` Function Discrepancy

### Migration File Definition
```sql
-- From: supabase/migrations/20251215190000_current_company_id.sql
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
as $$
  select company_id
  from public.profiles
  where id = auth.uid();
$$;
```

### Actual Database Function
```sql
-- From: information_schema.routines (actual database)
SELECT current_setting('app.current_company_id', true)::uuid;
```

### Impact
- **Function Mismatch:** Database function differs from migration file
- **Returns NULL:** If `app.current_company_id` session variable is not set, function returns NULL
- **RLS Policy Failure:** Policies using `current_company_id()` will fail if function returns NULL
- **403 Forbidden:** RLS policies block operations when function returns NULL

### Root Cause
- Migration file defines function to SELECT from `profiles` table
- Actual database function uses session variable `app.current_company_id`
- Session variable must be set via `set_current_company()` function
- If not set, function returns NULL, breaking RLS policies

### Recommendation
**Option A:** Update function to match migration file
```sql
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;
```

**Option B:** Ensure session variable is set before RFQ creation
- Call `set_current_company(company_id)` before RFQ operations
- Or update RLS policies to handle NULL gracefully

**Preferred:** Option A (update function) - more reliable, doesn't depend on session state

---

## 🔴 CRITICAL FINDING #5: RLS Policy Conflicts

### Companies Table RLS Policies

**INSERT Policies (3 policies):**
1. `Users can insert own company` (public)
   - `WITH CHECK: auth.uid() = user_id`
2. `Authenticated users can create own company` (authenticated)
   - `WITH CHECK: user_id = auth.uid() OR user_id IS NULL`
3. **CONFLICT:** Both policies apply to same operation

**SELECT Policies (3 policies):**
1. `Users can view all companies` (public)
   - `USING: true` (everyone can view)
2. `Users can select own company` (authenticated)
   - `USING: user_id = auth.uid()`
3. `Users can view own company` (authenticated)
   - `USING: auth.uid() = user_id`
4. **REDUNDANCY:** Multiple policies doing the same thing

### RFQs Table RLS Policies

**INSERT Policies (4 policies):**
1. `Authenticated users can create RFQs` (authenticated)
   - `WITH CHECK: true` ✅ Simple
2. `Universal Insert for Auth Users` (authenticated)
   - `WITH CHECK: true` ✅ Simple
3. `Users can create own RFQs` (authenticated)
   - `WITH CHECK: true` ✅ Simple
4. `rfqs_insert_optimized` (public)
   - `WITH CHECK: buyer_company_id = current_company_id()` ⚠️ **COMPLEX**
   - **ISSUE:** `current_company_id()` function may not exist or return NULL

**SELECT Policies (4 policies):**
- Multiple overlapping policies
- Some use `current_company_id()` function
- Some use direct `auth.uid()` checks

### Impact
- **403 Forbidden:** RLS policies may block operations
- **Policy Conflicts:** Multiple policies may conflict
- **Function Dependency:** `current_company_id()` may not exist or return NULL

### Recommendation
**Audit `current_company_id()` Function:**
```sql
-- Check if function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'current_company_id';
```

**CRITICAL DISCREPANCY FOUND:**
- **Migration File Definition:** `SELECT company_id FROM public.profiles WHERE id = auth.uid();`
- **Actual Database Function:** `SELECT current_setting('app.current_company_id', true)::uuid;`
- **Impact:** Function uses session variable instead of profiles table
- **Issue:** If `app.current_company_id` is not set, function returns NULL
- **RLS Policies:** Policies using `current_company_id()` will fail if function returns NULL

**If function returns NULL:**
- Policies using `current_company_id()` will fail
- RLS policies will block operations
- Need to ensure `app.current_company_id` is set before RFQ creation

**Simplify RLS Policies:**
- Remove redundant policies
- Use consistent policy patterns
- Avoid function dependencies in policies

---

## 🔴 CRITICAL FINDING #6: Frontend State Zombies

### Component State Management (new.jsx)

**Loading State Variables:**
- `isLoading` - Main loading state
- `isLoadingCities` - City loading state

**Issue Identified:**

**Line 409:** Early return bypasses finally block
```javascript
if (!result.success) {
  toast.error(result.error || 'Failed to create RFQ. Please try again.');
  return; // ❌ EARLY RETURN - finally block still executes, but...
}
```

**Line 427:** Navigation happens before finally block
```javascript
navigate(`/dashboard/rfqs/${result.data.id}`);
// ❌ Navigation happens, but component may unmount before finally executes
```

**Line 420-425:** Finally block
```javascript
} finally {
  setIsLoading(false);  // ✅ Should execute, but...
  setIsLoadingCities(false);
}
```

### Root Cause Analysis

**Scenario 1: Early Return**
1. `result.success = false`
2. Early return at line 409
3. Finally block executes ✅
4. But error toast may trigger re-render
5. Component may unmount/remount
6. State may persist in unmounted component

**Scenario 2: Navigation Before Finally**
1. `result.success = true`
2. Navigation at line 427
3. Component unmounts
4. Finally block may not execute (race condition)
5. State persists in memory

**Scenario 3: Unhandled Promise Rejection**
1. `createRFQ()` throws error
2. Error caught in catch block
3. But if error occurs in finally block, it's unhandled
4. State never resets

### Impact
- **Infinite Spinner:** `isLoading` never resets
- **Button Disabled:** Submit button stays disabled
- **UI Frozen:** User cannot interact with form

### Recommendation
**Fix State Management:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ✅ Set loading BEFORE any async operations
  setIsLoading(true);
  setIsLoadingCities(false);
  
  try {
    const result = await createRFQ({ user, formData });
    
    if (!result.success) {
      toast.error(result.error || 'Failed to create RFQ. Please try again.');
      // ✅ DON'T return early - let finally handle cleanup
      return; // Finally will still execute
    }
    
    toast.success('RFQ created successfully!');
    
    // ✅ Reset state BEFORE navigation
    setIsLoading(false);
    setIsLoadingCities(false);
    
    // ✅ Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    navigate(`/dashboard/rfqs/${result.data.id}`);
  } catch (error) {
    console.error('[CreateRFQ] Error:', error);
    toast.error(`Failed to create RFQ: ${error.message || 'Please try again'}`);
  } finally {
    // ✅ ALWAYS reset state (safety valve)
    setIsLoading(false);
    setIsLoadingCities(false);
  }
};
```

**OR:** Use ref to track loading state
```javascript
const isLoadingRef = useRef(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isLoadingRef.current) return; // Prevent double submission
  
  isLoadingRef.current = true;
  setIsLoading(true);
  
  try {
    // ... RFQ creation logic ...
  } finally {
    isLoadingRef.current = false;
    setIsLoading(false);
    setIsLoadingCities(false);
  }
};
```

---

## 📊 Schema Comparison Table

| Column | Database Schema | Code Expectation | Status |
|--------|----------------|------------------|--------|
| `buyer_user_id` | ❌ **MISSING** | ✅ Used in rfqService.js:162 | 🔴 **MISMATCH** |
| `buyer_company_id` | ✅ EXISTS (uuid, nullable) | ✅ Used correctly | ✅ Match |
| `status` | ✅ EXISTS (text) | ✅ Used correctly | ⚠️ **CONSTRAINT MISMATCH** |
| `unit_type` | ✅ EXISTS (text, nullable) | ✅ Used correctly | ✅ Match |
| `target_country` | ✅ EXISTS (text, nullable) | ✅ Used correctly | ✅ Match |
| `target_city` | ✅ EXISTS (text, nullable) | ✅ Used correctly | ✅ Match |
| `attachments` | ✅ EXISTS (ARRAY) | ✅ Used correctly | ✅ Match |

---

## 🔍 RLS Policy Analysis

### Companies Table Policies

| Policy Name | Command | Roles | WITH CHECK | Status |
|------------|---------|-------|------------|--------|
| `Users can insert own company` | INSERT | public | `auth.uid() = user_id` | ⚠️ **CONFLICTS** |
| `Authenticated users can create own company` | INSERT | authenticated | `user_id = auth.uid() OR user_id IS NULL` | ⚠️ **CONFLICTS** |
| `Users can view all companies` | SELECT | public | `true` | ✅ Works |
| `Users can select own company` | SELECT | authenticated | `user_id = auth.uid()` | ✅ Works |
| `Users can view own company` | SELECT | authenticated | `auth.uid() = user_id` | ⚠️ **REDUNDANT** |

**Issues:**
- ⚠️ Multiple INSERT policies may conflict
- ⚠️ Redundant SELECT policies
- ⚠️ `user_id IS NULL` check may allow unauthorized inserts

### RFQs Table Policies

| Policy Name | Command | Roles | WITH CHECK | Status |
|------------|---------|-------|------------|--------|
| `Authenticated users can create RFQs` | INSERT | authenticated | `true` | ✅ Works |
| `Universal Insert for Auth Users` | INSERT | authenticated | `true` | ⚠️ **REDUNDANT** |
| `Users can create own RFQs` | INSERT | authenticated | `true` | ⚠️ **REDUNDANT** |
| `rfqs_insert_optimized` | INSERT | public | `buyer_company_id = current_company_id()` | ⚠️ **FUNCTION DEPENDENCY** |

**Issues:**
- ⚠️ Multiple redundant INSERT policies
- ⚠️ `current_company_id()` function dependency
- ⚠️ Function may not exist or return NULL

---

## 🚨 Schema Cache Investigation

### Error: "Could not find column in schema cache"

**Root Cause:**
- Code tries to INSERT `buyer_user_id` column
- Column doesn't exist in database
- PostgREST schema cache doesn't have column
- Error: "Could not find column in schema cache"

**Solution:**
1. **Add column to database:**
   ```sql
   ALTER TABLE public.rfqs 
   ADD COLUMN buyer_user_id UUID REFERENCES auth.users(id);
   ```

2. **Reload schema cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **OR:** Restart Supabase project (forces schema reload)

---

## 📋 Detailed Findings

### Finding 1: Missing Column `buyer_user_id`

**Location:** `src/services/rfqService.js:162`

**Code:**
```javascript
buyer_user_id: user.id, // Appended by Kernel
```

**Database Schema:**
- Column does NOT exist in `rfqs` table
- No migration found that adds this column

**Impact:**
- Schema cache error
- Database error (42703)
- RFQ creation fails

**Recommendation:**
- Add column via migration
- OR remove from code payload

---

### Finding 2: Status Constraint Violation

**Location:** `src/services/rfqService.js:280`

**Code:**
```javascript
status: 'in_review', // Mobile wizard uses 'in_review'
```

**Database Constraint:**
```sql
CHECK (status = ANY (ARRAY['draft', 'open', 'pending', 'awarded', 'closed']))
```

**Impact:**
- Constraint violation (23514)
- RFQ creation fails
- Silent failure possible

**Recommendation:**
- Update constraint to include `'in_review'` and `'matched'`
- OR change code to use allowed statuses

---

### Finding 3: Unique Constraint on `companies.user_id`

**Location:** `src/services/rfqService.js:92-105`

**Code:**
```javascript
const { data: newCompany, error: createError } = await supabase
  .from('companies')
  .insert({
    user_id: user.id, // ❌ Violates UNIQUE constraint if company exists
    // ...
  });
```

**Database Constraint:**
```sql
UNIQUE (user_id)
```

**Impact:**
- Duplicate key error (23505)
- Lazy profile creation fails
- RFQ creation blocked

**Recommendation:**
- Check for existing company before INSERT
- Use UPSERT instead of INSERT
- Handle duplicate gracefully

---

### Finding 4: RLS Policy Conflicts

**Location:** Multiple policies on `companies` and `rfqs` tables

**Issues:**
1. Multiple INSERT policies may conflict
2. `current_company_id()` function dependency
3. Redundant policies

**Impact:**
- 403 Forbidden errors
- Inconsistent behavior
- Policy evaluation overhead

**Recommendation:**
- Audit and consolidate policies
- Remove redundant policies
- Verify `current_company_id()` function exists

---

### Finding 5: Frontend State Zombies

**Location:** `src/pages/dashboard/rfqs/new.jsx:370-435`

**Issues:**
1. Early return may bypass state cleanup
2. Navigation before finally block
3. Unhandled promise rejections

**Impact:**
- Infinite spinner
- Button stays disabled
- UI frozen

**Recommendation:**
- Reset state before navigation
- Use refs for loading state
- Ensure finally block always executes

---

## 🎯 Priority Fixes

### P0 - Critical (Blocks RFQ Creation)

1. **Add `buyer_user_id` column** to `rfqs` table
2. **Fix status constraint** to include `'in_review'` and `'matched'`
3. **Fix lazy profile logic** to handle UNIQUE constraint (check before INSERT)
4. **Fix `current_company_id()` function** to match migration file (SELECT from profiles)

### P1 - High (Causes Errors)

5. **Audit RLS policies** and remove conflicts
6. **Fix frontend state management** (early returns, navigation)
7. **Handle NULL `current_company_id()`** in RLS policies

### P2 - Medium (Performance/UX)

7. **Remove redundant RLS policies**
8. **Optimize policy evaluation**
9. **Add better error handling**

---

## 📝 Recommendations Summary

### Database Changes Required

1. **Add `buyer_user_id` column:**
   ```sql
   ALTER TABLE public.rfqs 
   ADD COLUMN buyer_user_id UUID REFERENCES auth.users(id);
   ```

2. **Update status constraint:**
   ```sql
   ALTER TABLE public.rfqs DROP CONSTRAINT rfqs_status_check;
   ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_status_check 
   CHECK (status = ANY (ARRAY['draft', 'open', 'pending', 'in_review', 'matched', 'awarded', 'closed', 'cancelled']));
   ```

3. **Reload schema cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Code Changes Required

1. **Fix lazy profile logic** (check for existing company before INSERT, use UPSERT)
2. **Fix frontend state management** (reset state before navigation, ensure finally executes)
3. **Add error handling** for constraint violations (23505, 23514, 42703)
4. **Handle `current_company_id()` NULL** cases in service layer

### RLS Policy Cleanup

1. **Remove redundant policies**
2. **Verify `current_company_id()` function**
3. **Consolidate overlapping policies**

---

## 🔍 Verification Queries

### Check Column Existence
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rfqs'
  AND column_name = 'buyer_user_id';
-- Expected: 0 rows (column doesn't exist)
```

### Check Status Constraint
```sql
SELECT check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'rfqs_status_check';
-- Expected: Only allows 'draft', 'open', 'pending', 'awarded', 'closed'
```

### Check Unique Constraint
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND constraint_type = 'UNIQUE';
-- Expected: companies_user_id_key UNIQUE constraint exists
```

### Check current_company_id Function
```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'current_company_id';
-- Actual: Function exists but uses current_setting('app.current_company_id', true)::uuid
-- Issue: Returns NULL if session variable not set
-- Migration file shows different definition (SELECT from profiles table)
-- ⚠️ MISMATCH: Function definition differs from migration file
```

---

## 📊 Impact Assessment

### Current State
- ❌ RFQ creation fails due to missing column
- ❌ Status constraint violations
- ❌ Duplicate key errors on lazy profile
- ❌ RLS policy conflicts
- ❌ Infinite spinner on errors

### After Fixes
- ✅ RFQ creation succeeds
- ✅ All status values allowed
- ✅ Lazy profile handles duplicates
- ✅ RLS policies work correctly
- ✅ Spinner always stops

---

**End of Forensic Audit Report**

**Next Steps:**
1. Apply database migrations (add column, update constraint)
2. Fix code logic (lazy profile, state management)
3. Clean up RLS policies
4. Reload schema cache
5. Test RFQ creation end-to-end
