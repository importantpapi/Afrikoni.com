# 🚀 Quick Start: Apply Foundation Fixes

## Step-by-Step Guide to Fix Dashboard Foundation

---

## ⚡ Quick Summary

**Problem:** Dashboard has 404/403 errors, missing tables, broken capabilities
**Solution:** Apply SQL migration + Frontend fixes (already done)
**Time:** ~5 minutes

---

## 📋 Step 1: Apply SQL Migration (CRITICAL)

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Open Migration File**
   - File: `supabase/migrations/20260117_foundation_fix.sql`
   - Copy entire contents

3. **Run SQL**
   - Paste into SQL Editor
   - Click **Run**
   - Wait for success message

4. **Verify Success**
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('company_capabilities', 'kyc_verifications');
   ```

### Option B: Via Supabase CLI

```bash
cd supabase
supabase migration up
```

---

## 📋 Step 2: Verify Tables Created

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check company_capabilities exists
SELECT COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'company_capabilities';

-- 2. Check kyc_verifications exists
SELECT COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'kyc_verifications';

-- 3. Check all companies have capabilities rows
SELECT 
  c.id,
  c.company_name,
  CASE 
    WHEN cc.company_id IS NULL THEN '❌ MISSING'
    ELSE '✅ OK'
  END as capabilities_status
FROM companies c
LEFT JOIN company_capabilities cc ON c.id = cc.company_id
ORDER BY c.created_at DESC;

-- 4. Test RLS: Try to read your own company's capabilities
SELECT * FROM company_capabilities 
WHERE company_id = (
  SELECT company_id FROM profiles WHERE id = auth.uid()
);
```

**Expected Results:**
- ✅ Both tables exist
- ✅ All companies have capabilities rows
- ✅ You can read your own company's capabilities

---

## 📋 Step 3: Test Dashboard

1. **Start Dev Server** (if not running)
   ```bash
   npm run dev
   ```

2. **Login to Dashboard**
   - Navigate to `/dashboard`
   - Login with your account

3. **Check Console**
   - ✅ No 404 errors for `company_capabilities`
   - ✅ No 404 errors for `kyc_verifications`
   - ✅ No 403 errors for `notifications`
   - ✅ Capabilities load successfully

4. **Verify Functionality**
   - ✅ Dashboard loads
   - ✅ Sidebar shows correct menu items
   - ✅ No white screens
   - ✅ No error messages (unless intentional)

---

## 🔧 Troubleshooting

### Issue: "Table does not exist" error

**Solution:**
- Verify migration ran successfully
- Check Supabase migration history
- Re-run migration if needed

### Issue: Still seeing 404 errors

**Solution:**
- Clear browser cache
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for specific error

### Issue: Still seeing 403 errors

**Solution:**
- Verify RLS policies were created
- Check user has company_id in profile
- Test RLS policies manually

### Issue: Dashboard shows "Database Sync Error"

**Solution:**
- Migration didn't run or failed
- Check Supabase logs
- Re-run migration
- Verify tables exist

---

## ✅ Success Indicators

After applying fixes, you should see:

1. **Console:**
   - ✅ `[CapabilityContext] ✅ Loaded capabilities for company: ...`
   - ✅ No 404 errors
   - ✅ No 403 errors

2. **Dashboard:**
   - ✅ Loads without white screen
   - ✅ Sidebar shows menu items
   - ✅ No error messages

3. **Database:**
   - ✅ `company_capabilities` table exists
   - ✅ `kyc_verifications` table exists
   - ✅ All companies have capabilities rows

---

## 📝 Files Changed

### Already Fixed (Frontend):
- ✅ `src/App.jsx` - RequireCapability import fixed
- ✅ `src/context/CapabilityContext.tsx` - Fail-safe error handling
- ✅ `src/components/auth/RequireCapability.jsx` - Database sync error display

### Needs Application (Database):
- ⏳ `supabase/migrations/20260117_foundation_fix.sql` - **RUN THIS**

---

## 🎯 Next Steps After Fixes

1. **Test All Features**
   - Create RFQ
   - View orders
   - Check notifications
   - Test KYC verification

2. **Monitor Console**
   - Watch for any new errors
   - Verify all queries succeed

3. **Optional: Clean Up**
   - Remove deprecated `roleHelpers` usage
   - Update KYC components to use new table
   - Remove unused code

---

**Status:** ✅ **READY TO APPLY**

Run the SQL migration and your foundation will be solid!
