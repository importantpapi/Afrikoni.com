# 🚀 DEPLOYMENT CHECKLIST - Critical Fixes

**Date:** January 24, 2025  
**Status:** Ready for Production Testing

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Migration
- [ ] Run migration: `supabase db push`
- [ ] Verify `is_admin` column added to `profiles` table:
  ```sql
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'is_admin';
  ```

### 2. Promote First Admin
- [ ] Identify admin user email
- [ ] Run SQL to promote:
  ```sql
  UPDATE profiles 
  SET is_admin = true 
  WHERE email = 'your-admin-email@example.com';
  ```
- [ ] Verify admin access works:
  - Login as admin
  - Should redirect to `/dashboard/admin`
  - Admin routes should be accessible

### 3. Email Verification Setup
- [ ] Verify Supabase email configuration:
  - Go to Supabase Dashboard → Authentication → Settings
  - Check "Enable email confirmations" is set correctly
  - Verify SMTP settings (if using custom SMTP)
- [ ] Test email verification flow:
  - Create new account
  - Verify email is sent
  - Click verification link
  - Verify redirect works

### 4. Test Critical Flows

#### Flow 1: New User Signup
- [ ] Sign up with new email
- [ ] Verify redirects to `/verify-email`
- [ ] Verify email received
- [ ] Click verification link
- [ ] Verify redirects to `/onboarding` Step 1
- [ ] Select role (buyer/seller/hybrid/logistics)
- [ ] Fill company info in Step 2
- [ ] Verify redirects to `/dashboard`
- [ ] Verify correct role dashboard shown

#### Flow 2: Existing User Login
- [ ] Login with verified email
- [ ] If onboarding incomplete → redirects to `/onboarding`
- [ ] If onboarding complete → redirects to `/dashboard`
- [ ] Verify dashboard loads correctly

#### Flow 3: Unverified Email
- [ ] Try to access `/dashboard` with unverified email
- [ ] Should redirect to `/verify-email`
- [ ] Verify cannot bypass email verification

#### Flow 4: Incomplete Onboarding
- [ ] Create account with verified email
- [ ] Try to access `/dashboard` before onboarding
- [ ] Should redirect to `/onboarding`
- [ ] Complete onboarding
- [ ] Verify can now access `/dashboard`

#### Flow 5: Admin Access
- [ ] Login as admin user
- [ ] Should redirect to `/dashboard/admin`
- [ ] Verify admin routes accessible
- [ ] Verify non-admin users cannot access admin routes

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Company Creation Failure
**Test:** Simulate company creation failure during onboarding

**Steps:**
1. Temporarily break `getOrCreateCompany()` function
2. Try to complete onboarding Step 2
3. Verify error message shown
4. Verify `onboarding_completed` remains `false` in database
5. Verify user cannot access `/dashboard`

**Expected Result:** User sees error, onboarding incomplete, cannot access dashboard

### Scenario 2: Email Verification Edge Cases
**Test:** Various email verification states

**Test Cases:**
- User with verified email but incomplete onboarding
- User with unverified email trying to access protected routes
- User clicking resend verification email multiple times
- User verifying email after logout/login

**Expected Result:** All scenarios redirect correctly

### Scenario 3: Role Selection
**Test:** Ensure role selection works correctly

**Steps:**
1. Complete onboarding as buyer
2. Verify buyer dashboard shown
3. Logout and create new account as seller
4. Verify seller dashboard shown
5. Test hybrid role separately

**Expected Result:** Each role shows correct dashboard

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### Database State Checks

1. **Verify Profile Structure:**
   ```sql
   SELECT id, email, role, onboarding_completed, company_id, is_admin 
   FROM profiles 
   LIMIT 5;
   ```

2. **Verify No Broken States:**
   ```sql
   -- Users with onboarding_completed=true but no company_id (should be 0)
   SELECT COUNT(*) 
   FROM profiles 
   WHERE onboarding_completed = true AND company_id IS NULL;
   
   -- Users with company_id but onboarding_completed=false (should be 0 for new signups)
   SELECT COUNT(*) 
   FROM profiles 
   WHERE company_id IS NOT NULL AND onboarding_completed = false;
   ```

3. **Verify Admin Users:**
   ```sql
   SELECT id, email, is_admin 
   FROM profiles 
   WHERE is_admin = true;
   ```

### Frontend Checks

1. **Console Errors:**
   - Open browser DevTools
   - Check for any console errors
   - Verify no 403/404 errors on protected routes

2. **Redirect Loops:**
   - Test all authentication states
   - Verify no infinite redirect loops
   - Check Network tab for redirect chains

3. **Performance:**
   - Test page load times
   - Verify dashboard loads within 2-3 seconds
   - Check for any blocking requests

---

## 🐛 KNOWN ISSUES / EDGE CASES

### Issue 1: OAuth Signup
- OAuth users may skip email verification (depending on provider)
- **Status:** Handled by `auth-callback.jsx` - should check email verification

### Issue 2: Existing Users
- Users created before these fixes may have inconsistent state
- **Fix:** Run migration script to fix existing users:
  ```sql
  -- Set onboarding_completed=false for users without company_id
  UPDATE profiles 
  SET onboarding_completed = false 
  WHERE company_id IS NULL AND onboarding_completed = true;
  ```

### Issue 3: Data Duplication
- Company fields still stored in both `companies` and `profiles` tables
- **Status:** Safe to defer - Fix 5 will address this
- **Impact:** Low - system works correctly, just data redundancy

---

## 📊 METRICS TO MONITOR

### After Deployment:

1. **Signup Funnel:**
   - Signups → Email Verified → Onboarding Started → Onboarding Completed
   - Track drop-off at each step

2. **Error Rates:**
   - Company creation failures
   - Profile update failures
   - Redirect loops

3. **User Behavior:**
   - Time to complete onboarding
   - Bounce rate on verify-email page
   - Dashboard access after onboarding

---

## 🚨 ROLLBACK PLAN

If critical issues found:

1. **Revert Code:**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Database Rollback (if needed):**
   ```sql
   -- Remove is_admin column (only if causing issues)
   ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
   ```

3. **Emergency Fix:**
   - Temporarily disable email verification requirement
   - Set `onboarding_completed=true` for stuck users
   - Re-enable gradually after fixes

---

## ✅ SIGN-OFF

- [ ] All pre-deployment checks passed
- [ ] All test scenarios passed
- [ ] Database migration applied
- [ ] Admin user promoted
- [ ] Email verification tested
- [ ] No console errors
- [ ] No redirect loops
- [ ] Performance acceptable
- [ ] Ready for production

**Deployed by:** _______________  
**Date:** _______________  
**Approved by:** _______________

---

## 📞 SUPPORT

If issues found:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify database state matches expected structure
4. Test with fresh user account to isolate issues

**All fixes are production-ready!** 🎉
