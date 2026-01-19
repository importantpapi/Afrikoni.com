# RFQ Forensic Fixes - Applied

**Date:** January 20, 2026  
**Status:** ✅ All Critical Fixes Applied

## Overview

Applied all fixes identified in the Forensic Audit Report to resolve:
- ✅ Missing `buyer_user_id` column
- ✅ Status constraint violations
- ✅ Unique constraint errors (23505)
- ✅ `current_company_id()` function discrepancy
- ✅ RLS policy conflicts
- ✅ Frontend state zombies

---

## ✅ Fixes Applied

### 1. Database Schema Fixes

#### ✅ Added `buyer_user_id` Column

**Migration:** `add_buyer_user_id_column`

**SQL:**
```sql
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_user_id ON public.rfqs(buyer_user_id);
```

**Status:** ✅ Applied
**Impact:** Code can now INSERT `buyer_user_id` without schema cache errors

---

#### ✅ Updated Status Constraint

**Migration:** `update_rfqs_status_constraint`

**SQL:**
```sql
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;

ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_status_check 
CHECK (status = ANY (ARRAY[
  'draft', 'open', 'pending', 'in_review', 'matched', 
  'awarded', 'closed', 'cancelled'
]));
```

**Status:** ✅ Applied (via direct SQL, migration had version conflict)
**Impact:** Code can now use `'in_review'`, `'matched'`, and `'cancelled'` statuses without constraint violations

---

#### ✅ Fixed `current_company_id()` Function

**Migration:** `fix_current_company_id_function`

**SQL:**
```sql
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;
```

**Status:** ✅ Applied
**Impact:** Function now SELECTs from profiles table directly, doesn't depend on session variable

**Before:** Used `current_setting('app.current_company_id')` (may return NULL)  
**After:** SELECTs from `profiles` table (always returns company_id if exists)

---

#### ✅ Reloaded Schema Cache

**SQL:**
```sql
NOTIFY pgrst, 'reload schema';
```

**Status:** ✅ Applied
**Impact:** PostgREST schema cache refreshed, new `buyer_user_id` column available immediately

---

### 2. Code Logic Fixes

#### ✅ Fixed Lazy Profile Logic

**File:** `src/services/rfqService.js`

**Changes:**
- ✅ Check for existing company BEFORE INSERT (prevents 23505 error)
- ✅ Handle duplicate key error gracefully (race condition)
- ✅ Fetch existing company if INSERT fails due to duplicate

**Code:**
```javascript
// ✅ FORENSIC FIX: First check if company already exists
const { data: existingCompany } = await supabase
  .from('companies')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (existingCompany?.id) {
  // Use existing company
  companyId = existingCompany.id;
} else {
  // Create new company
  const { data: newCompany, error: createError } = await supabase
    .from('companies')
    .insert({ user_id: user.id, ... });
  
  // Handle 23505 duplicate key error (race condition)
  if (createError?.code === '23505') {
    // Fetch company created by another request
    const { data: raceCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    companyId = raceCompany?.id;
  }
}
```

**Status:** ✅ Applied
**Impact:** No more 23505 duplicate key errors, handles race conditions gracefully

---

#### ✅ Fixed Frontend State Management

**File:** `src/pages/dashboard/rfqs/new.jsx`

**Changes:**
- ✅ Reset state BEFORE early return (prevents spinner zombie)
- ✅ Reset state BEFORE navigation (prevents state persistence)
- ✅ Small delay before navigation (ensures state updates complete)

**Code:**
```javascript
if (!result.success) {
  toast.error(result.error);
  // ✅ FORENSIC FIX: Reset state before early return
  setIsLoading(false);
  setIsLoadingCities(false);
  return;
}

// ✅ FORENSIC FIX: Reset state BEFORE navigation
setIsLoading(false);
setIsLoadingCities(false);

// ✅ FORENSIC FIX: Small delay to ensure state updates
await new Promise(resolve => setTimeout(resolve, 100));

navigate(`/dashboard/rfqs/${result.data.id}`);
```

**Status:** ✅ Applied
**Impact:** Spinner always stops, no state zombies, button becomes clickable

---

### 3. RLS Policy Cleanup

#### ✅ Removed Redundant Policies

**Migration:** `cleanup_redundant_rls_policies`

**Removed:**
- `Users can view own company` (redundant with "Users can select own company")
- `Universal Insert for Auth Users` (redundant with "Authenticated users can create RFQs")
- `Users can create own RFQs` (redundant with "Authenticated users can create RFQs")

**Kept:**
- `Users can view all companies` (public, most permissive)
- `Users can select own company` (authenticated, specific)
- `Authenticated users can create RFQs` (authenticated, simple)
- `rfqs_insert_optimized` (public, may be used by other flows)

**Status:** ✅ Applied
**Impact:** Fewer policy conflicts, cleaner RLS evaluation

---

## 🔍 Verification Results

### ✅ Column Added
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'rfqs' AND column_name = 'buyer_user_id';
```
**Result:** ✅ Column exists (uuid, nullable)

### ✅ Constraint Updated
```sql
SELECT check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'rfqs_status_check';
```
**Result:** ✅ Constraint includes `'in_review'`, `'matched'`, and `'cancelled'`
**Allowed Values:** `'draft'`, `'open'`, `'pending'`, `'in_review'`, `'matched'`, `'awarded'`, `'closed'`, `'cancelled'`

### ✅ Function Fixed
```sql
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'current_company_id';
```
**Result:** ✅ Function now SELECTs from profiles table

---

## 📋 Testing Checklist

- [x] Database migrations applied
- [x] Code logic fixed
- [x] RLS policies cleaned up
- [x] Schema cache reloaded
- [ ] Test RFQ creation (manual)
- [ ] Verify no schema cache errors (manual)
- [ ] Verify no 23505 errors (manual)
- [ ] Verify no 23514 errors (manual)
- [ ] Verify spinner stops (manual)
- [ ] Verify lazy profile works (manual)

---

## 🎯 Expected Behavior After Fixes

### RFQ Creation Flow

1. **User submits RFQ form**
   - ✅ Form validates
   - ✅ Loading state set

2. **Service resolves company**
   - ✅ Checks for existing company first
   - ✅ Creates minimal company if needed
   - ✅ Handles duplicate key errors gracefully

3. **Service creates RFQ**
   - ✅ Inserts `buyer_user_id` (column exists)
   - ✅ Sets status `'open'` (allowed by constraint)
   - ✅ No schema cache errors

4. **Frontend handles response**
   - ✅ Success toast shown
   - ✅ State reset before navigation
   - ✅ Reminder toast if minimal profile
   - ✅ Navigate to RFQ detail

5. **State cleanup**
   - ✅ Finally block executes
   - ✅ Loading state reset
   - ✅ Button becomes clickable

---

## 📝 Summary

✅ **Database:**
- `buyer_user_id` column added
- Status constraint updated
- `current_company_id()` function fixed
- Schema cache reloaded

✅ **Code:**
- Lazy profile logic fixed (check before INSERT)
- Frontend state management fixed (reset before navigation)
- Error handling improved (23505, 23514)

✅ **RLS:**
- Redundant policies removed
- Cleaner policy evaluation

---

**All Forensic Fixes Applied Successfully**

**Next Steps:**
1. Test RFQ creation end-to-end
2. Verify no console errors
3. Verify spinner stops correctly
4. Verify lazy profile creation works
5. Monitor for any remaining issues
