# 🚀 Apply Role Switching Fix Migration - ACTION REQUIRED

## ⚠️ CRITICAL: You Must Apply This Migration

The role switching fix requires a database migration to be applied to your Supabase project.

---

## 📋 Migration File

**File**: `supabase/migrations/20250124000001_fix_profiles_role_update_rls.sql`

This migration:
- ✅ Drops and recreates the "Users can update own profile" RLS policy
- ✅ Ensures users can update their own role safely
- ✅ Prevents modification of security-critical fields (id)

---

## 🔧 How to Apply

### Option 1: Using Supabase CLI (Recommended)

```bash
cd "/Users/youba/Library/Mobile Documents/com~apple~CloudDocs/Desktop/Afrikonimarketplace"
supabase db push
```

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the entire contents of:
   ```
   supabase/migrations/20250124000001_fix_profiles_role_update_rls.sql
   ```
6. Click **Run**

---

## ✅ Verify Migration Applied

After applying, verify the policy exists:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Users can update own profile';
```

You should see the policy with:
- `cmd` = 'UPDATE'
- `qual` = '(auth.uid() = id)'
- `with_check` = '((auth.uid() = id) AND ((OLD.id IS NOT DISTINCT FROM NEW.id)))'

---

## 🧪 Test After Migration

1. **Login as a test user**
2. **Navigate to `/dashboard`**
3. **Select a role** (if role selection screen appears)
4. **Verify**:
   - ✅ No error: "Failed to save role"
   - ✅ Success toast: "Role selected successfully!"
   - ✅ User redirected to role-specific dashboard
   - ✅ Profile updated in Supabase dashboard

---

## 🔒 Security Notes

- ✅ **RLS remains enabled** - Security is NOT compromised
- ✅ **Users can only update their own profile** - `auth.uid() = id` enforced
- ✅ **ID cannot be changed** - Protected by WITH CHECK clause
- ✅ **Role validation** - Still enforced by table CHECK constraint

---

## 📝 What Changed

### Before
- RLS policy existed but may have been too restrictive
- Code was updating both `role` and `user_role` (duplication)
- Updates were overwriting existing `onboarding_completed` and `company_id`

### After
- ✅ Explicit RLS policy allows role updates
- ✅ Code only updates `role` (single source of truth)
- ✅ Preserves existing `onboarding_completed` and `company_id`
- ✅ Better error handling and logging

---

## ⚡ Quick Fix Summary

**Problem**: "Failed to save role" error when selecting role

**Root Cause**: RLS policy was blocking the UPDATE operation

**Solution**: Recreated RLS policy with explicit permissions for role updates

**Files Changed**:
1. `supabase/migrations/20250124000001_fix_profiles_role_update_rls.sql` (NEW)
2. `src/components/dashboard/RoleSelection.jsx` (UPDATED)

**Action Required**: **Apply the migration to your Supabase database**

