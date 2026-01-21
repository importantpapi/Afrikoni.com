# MIGRATION APPLICATION GUIDE

**Date:** January 2025  
**Migrations to Apply:** 2 Kernel Backend Alignment Migrations

---

## 🚨 ISSUE: Local Database Connection Failed

The error you're seeing:
```
failed to connect to postgres: failed to connect to `host=127.0.0.1 user=postgres database=postgres`: dial error (dial tcp 127.0.0.1:54322: connect: connection refused)
```

**Cause:** Supabase CLI is trying to connect to a local database that isn't running.

**Solution:** Apply migrations to **remote production database** instead.

---

## ✅ SOLUTION: Apply to Remote Database

### Option 1: Link to Remote Project (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref qkeeufeiaphqylsnfhza

# Push migrations to remote
supabase db push
```

**Note:** This requires Supabase CLI authentication. You'll be prompted to login.

---

### Option 2: Manual Application via Dashboard (Easiest)

**🔗 Direct Link:**
https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new

**Migration 1: Optimize Subscriptions RLS**
1. Open SQL Editor (link above)
2. Copy contents of: `supabase/migrations/20260121_optimize_subscriptions_rls.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for: `Success. No rows returned.`

**Migration 2: Kernel Backend Final Alignment**
1. In same SQL Editor, click **New query**
2. Copy contents of: `supabase/migrations/20260121_kernel_backend_final_alignment.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for: `Success. No rows returned.`

---

### Option 3: Use Helper Script

```bash
# Run the helper script
./scripts/apply-kernel-migrations.sh
```

This script will:
- Check if migrations exist
- Try to link and push automatically
- Provide manual instructions if automated method fails

---

## 📋 MIGRATIONS TO APPLY

### Migration 1: `20260121_optimize_subscriptions_rls.sql`
**Purpose:** Optimize subscriptions RLS policies to use `current_company_id()`
**Size:** 2.2 KB
**Impact:** Performance improvement for subscriptions queries

### Migration 2: `20260121_kernel_backend_final_alignment.sql`
**Purpose:** Ensure 100% Kernel compliance across all RLS policies
**Size:** 16.4 KB
**Impact:** Fixes 8 tables to use Kernel patterns

**Tables Fixed:**
- `company_team`
- `customs_clearance`
- `shipment_tracking_events`
- `escrow_payments`
- `testimonials`
- `partners`
- `platform_revenue`
- `contact_submissions`

---

## ✅ VERIFICATION

After applying migrations, verify compliance:

```bash
# Run verification script
node scripts/verify-backend-kernel-compliance.js
```

**Expected Output:**
- ✅ Compliance Score: 100%
- ✅ Status: FULLY COMPLIANT
- ✅ All patterns verified

---

## 🔍 TROUBLESHOOTING

### If `supabase link` fails:

1. **Check Supabase CLI is installed:**
   ```bash
   supabase --version
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link project:**
   ```bash
   supabase link --project-ref qkeeufeiaphqylsnfhza
   ```

### If manual application fails:

1. **Check SQL syntax** - Copy entire file, ensure no truncation
2. **Run statements one at a time** - Split by `;` if needed
3. **Check for existing policies** - Migration uses `DROP POLICY IF EXISTS`
4. **Verify functions exist** - Migration creates `current_company_id()` and `is_admin()`

---

## 📊 POST-APPLICATION CHECKLIST

- [ ] Migration 1 applied successfully
- [ ] Migration 2 applied successfully
- [ ] Verification script shows 100% compliance
- [ ] No errors in Supabase Dashboard logs
- [ ] Test queries work correctly
- [ ] RLS policies enforce correctly

---

## 🎯 QUICK START

**Fastest Method (Manual):**

1. Open: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new
2. Copy/paste Migration 1 → Run
3. New query → Copy/paste Migration 2 → Run
4. Done! ✅

**Time:** ~2 minutes

---

**Document Status:** ✅ READY  
**Migrations:** ✅ CREATED  
**Next Step:** Apply migrations to production
