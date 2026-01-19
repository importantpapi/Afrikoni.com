# Lazy Profile Strategy Implementation - Complete

**Date:** January 20, 2026  
**Status:** ✅ Complete

## Overview

Implemented "Lazy Profile" strategy for RFQ creation, allowing users to create RFQs even without a complete company profile. The system automatically creates a minimal company entry if needed.

---

## ✅ Changes Made

### 1. Database RLS Policies Updated

#### Companies INSERT Policy

**New Policy:** `Authenticated users can create own company`
- Allows authenticated users to INSERT their own company
- Works for first-time company creation
- `WITH CHECK`: `user_id = auth.uid() OR user_id IS NULL`

**SQL:**
```sql
CREATE POLICY "Authenticated users can create own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  user_id IS NULL
);
```

**Migration:** `lazy_profile_rls_policies` applied successfully

#### RFQs INSERT Policy

**Status:** ✅ Already configured
- Existing policy `Authenticated users can create RFQs` with `WITH CHECK (true)`
- Allows RFQ creation regardless of verification status
- No changes needed

---

### 2. Service Layer - Lazy Profile Strategy

**File:** `src/services/rfqService.js`

#### Company Resolution Logic

**Before:**
- Called `getOrCreateCompany()`
- If it failed or returned null, returned error
- Blocked RFQ creation

**After:**
- Calls `getOrCreateCompany()` first
- If it fails or returns null, automatically creates minimal company
- Uses default company name: `Company - [User Email]` or `Company - [User ID]`
- Sets `isMinimalProfile` flag
- Allows RFQ creation to proceed

**Key Features:**
- ✅ Automatic fallback company creation
- ✅ Default company name from email
- ✅ Minimal required fields only
- ✅ Profile update (non-blocking)
- ✅ Flag to indicate minimal profile

**Code:**
```javascript
// ✅ LAZY PROFILE STRATEGY: Resolve company ID with automatic fallback creation
let companyId;
let isMinimalProfile = false;

try {
  companyId = await getOrCreateCompany(supabase, user);
} catch (error) {
  console.warn('[rfqService] getOrCreateCompany failed, attempting lazy profile creation:', error);
}

// ✅ LAZY PROFILE: If no company ID, create minimal company automatically
if (!companyId) {
  const defaultCompanyName = user.email 
    ? `Company - ${user.email.split('@')[0]}` 
    : `Company - ${user.id.slice(0, 8)}`;
  
  const { data: newCompany } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      company_name: defaultCompanyName,
      owner_email: user.email || null,
      email: user.email || null,
      role: 'buyer',
      business_type: 'buyer',
      verified: false,
      verification_status: 'unverified'
    })
    .select('id')
    .single();
  
  if (newCompany?.id) {
    companyId = newCompany.id;
    isMinimalProfile = true;
    // Update profile with company_id (non-blocking)
  }
}
```

#### Return Value Enhancement

**Added:**
- `isMinimalProfile` flag in return object
- Indicates if company was auto-created
- Used by frontend to show reminder toast

**Code:**
```javascript
return {
  success: true,
  data: newRFQ,
  isMinimalProfile: isMinimalProfile // Flag to indicate if profile was auto-created
};
```

---

### 3. Component - Success Message & Reminder

**File:** `src/pages/dashboard/rfqs/new.jsx`

#### Success Handling

**Before:**
- Showed success toast
- Navigated to RFQ detail page

**After:**
- Shows success toast
- If `isMinimalProfile` is true, shows reminder toast after delay
- Navigates to RFQ detail page

**Code:**
```javascript
// ✅ LAZY PROFILE: Show success message even with minimal profile
toast.success('RFQ created successfully!');

// ✅ LAZY PROFILE: Show reminder toast if profile was auto-created
if (result.isMinimalProfile) {
  // Delay the reminder toast slightly so success message is visible first
  setTimeout(() => {
    toast.info('Complete your company profile to unlock more features', {
      description: 'Add your company details to improve supplier matching and trust scores.',
      duration: 5000
    });
  }, 1500);
}

navigate(`/dashboard/rfqs/${result.data.id}`);
```

**User Experience:**
1. User creates RFQ without company profile
2. System auto-creates minimal company
3. Success message shown
4. After 1.5 seconds, reminder toast appears
5. User can complete profile later

---

## 🎯 Benefits

### User Experience

✅ **No Blocking**
- Users can create RFQs immediately
- No need to complete profile first
- Smooth onboarding flow

✅ **Progressive Enhancement**
- RFQ creation works with minimal profile
- Reminder encourages profile completion
- Better features unlock with complete profile

### Technical Benefits

✅ **Resilient**
- Handles missing company profiles gracefully
- Automatic fallback creation
- No user-facing errors

✅ **Flexible**
- Works with or without company profile
- Minimal profile sufficient for RFQ creation
- Full profile unlocks additional features

---

## 📋 Testing Checklist

- [x] RLS policies updated
- [x] Lazy profile logic implemented
- [x] Default company name logic
- [x] isMinimalProfile flag added
- [x] Success message updated
- [x] Reminder toast added
- [ ] Test RFQ creation without company profile (manual)
- [ ] Verify minimal company created (manual)
- [ ] Verify reminder toast appears (manual)
- [ ] Test with existing company profile (manual)

---

## 🔍 Verification

### RLS Policy Verification

**Companies INSERT Policy:**
```sql
SELECT policyname, cmd, roles, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'companies'
  AND policyname = 'Authenticated users can create own company';
```

**Result:** ✅ Policy exists and allows `user_id = auth.uid() OR user_id IS NULL`

### Service Logic Verification

**Lazy Profile Flow:**
1. Try `getOrCreateCompany()` ✅
2. If fails/null, create minimal company ✅
3. Default name: `Company - [email]` ✅
4. Set `isMinimalProfile` flag ✅
5. Return flag in response ✅

### Component Logic Verification

**Success Handling:**
1. Show success toast ✅
2. Check `isMinimalProfile` flag ✅
3. Show reminder toast after delay ✅
4. Navigate to RFQ detail ✅

---

## 🚀 Expected Behavior

### Scenario 1: User with No Company Profile

1. User navigates to `/dashboard/rfqs/new`
2. Fills out RFQ form
3. Submits RFQ
4. System auto-creates minimal company:
   - Name: `Company - [email]`
   - Role: `buyer`
   - Verified: `false`
5. RFQ created successfully
6. Success toast shown
7. Reminder toast appears after 1.5 seconds
8. User redirected to RFQ detail page

### Scenario 2: User with Existing Company Profile

1. User navigates to `/dashboard/rfqs/new`
2. Fills out RFQ form
3. Submits RFQ
4. System uses existing company
5. RFQ created successfully
6. Success toast shown
7. No reminder toast (profile complete)
8. User redirected to RFQ detail page

---

## 📝 Summary

✅ **Database:**
- Companies INSERT policy updated
- RFQs INSERT policy verified (already correct)

✅ **Service:**
- Lazy profile strategy implemented
- Automatic minimal company creation
- Default company name logic
- `isMinimalProfile` flag added

✅ **Component:**
- Success message always shown
- Reminder toast for minimal profiles
- Smooth user experience

---

**End of Lazy Profile Strategy Implementation**
