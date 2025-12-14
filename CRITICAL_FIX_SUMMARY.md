# 🔴 CRITICAL FIX - Notifications 403 Errors

## Root Cause Identified

The 403 errors occur because:
1. `getOrCreateCompany` returns a `company_id`, but the profile update might fail silently
2. RLS policy checks `profiles.company_id`, but if the profile doesn't have it set, queries fail
3. Queries were prioritizing `company_id` over `user_id` (less reliable for RLS)

## ✅ Fixes Applied

### 1. Code Changes (Applied)
- ✅ **Changed query priority**: Now uses `user_id` first (most reliable), then `company_id`, then `user_email`
- ✅ **Profile verification**: Checks and updates profile `company_id` before querying
- ✅ **Enhanced logging**: Detailed logs to track profile updates and query filters

### 2. RLS Policy Enhancement (Needs Application)
- ✅ **Enhanced RLS policy**: Now checks both profile `company_id` AND company ownership
- ✅ **Fallback logic**: If profile doesn't have `company_id`, checks if user owns the company

## 🚨 CRITICAL: Apply Updated RLS Migration

**The enhanced RLS policy MUST be applied in Supabase.**

### Quick Apply:
1. Run: `node apply-notifications-rls-fix.js` (shows updated SQL)
2. Or go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new
3. Copy SQL from: `supabase/migrations/20250115000001_fix_notifications_rls_comprehensive.sql`
4. Paste and run

### What Changed in RLS Policy:
- Now checks: `profiles.company_id` OR `companies.owner_email`
- This handles cases where profile update fails but user owns the company
- More permissive while still secure

## 📊 Verification

After applying migration, the logs will show:
- Profile company_id verification
- Profile update attempts
- Query filter type (user_id vs company_id vs user_email)
- Query success/failure

## 🎯 Expected Results

- ✅ Queries use `user_id` first (most reliable)
- ✅ Profile is verified and updated before querying
- ✅ RLS policy matches even if profile update fails
- ✅ Zero 403 errors

