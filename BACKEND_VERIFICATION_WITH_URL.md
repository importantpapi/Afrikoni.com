# BACKEND VERIFICATION WITH SUPABASE URL

**Supabase URL:** `https://wmjxiazhvjaadzdsroqa.supabase.co`  
**Project Reference:** `qkeeufeiaphqylsnfhza`  
**Status:** ✅ Ready for Verification

---

## QUICK START: Apply Migrations

### 🔗 Direct Link to SQL Editor:
```
https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new
```

### 📝 Migration 1: Optimize Subscriptions RLS
1. Open SQL Editor (link above)
2. Copy contents of: `supabase/migrations/20260121_optimize_subscriptions_rls.sql`
3. Paste and click **Run**
4. Expected: `Success. No rows returned.`

### 📝 Migration 2: Kernel Backend Final Alignment
1. Click **New query** in SQL Editor
2. Copy contents of: `supabase/migrations/20260121_kernel_backend_final_alignment.sql`
3. Paste and click **Run**
4. Expected: `Success. No rows returned.`

---

## VERIFICATION OPTIONS

### Option 1: Via API (Requires Service Key)

**Setup:**
1. Get service role key from: Supabase Dashboard → Settings → API → service_role key
2. Add to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

**Run Verification:**
```bash
npm run verify-backend
```

**What it checks:**
- ✅ Functions exist (`current_company_id()`, `is_admin()`)
- ✅ Tables exist (company_team, subscriptions, kyc_verifications, etc.)
- ✅ RLS policies are active
- ✅ Backend compliance status

---

### Option 2: Via Supabase Dashboard (No Setup Required)

**Manual Verification Queries:**

1. **Check Functions:**
   ```sql
   -- Check current_company_id() exists
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'current_company_id' 
   AND pronamespace = 'public'::regnamespace;
   
   -- Check is_admin() exists
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'is_admin' 
   AND pronamespace = 'public'::regnamespace;
   ```

2. **Check Tables:**
   ```sql
   -- List all tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

3. **Check RLS Policies:**
   ```sql
   -- Check company_team policies
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'company_team' 
   AND schemaname = 'public';
   
   -- Check subscriptions policies
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'subscriptions' 
   AND schemaname = 'public';
   ```

4. **Verify Kernel Patterns:**
   ```sql
   -- Check for current_company_id() usage in policies
   SELECT tablename, policyname, qual
   FROM pg_policies
   WHERE qual::text LIKE '%current_company_id%'
   AND schemaname = 'public';
   
   -- Check for is_admin() usage in policies
   SELECT tablename, policyname, qual
   FROM pg_policies
   WHERE qual::text LIKE '%is_admin%'
   AND schemaname = 'public';
   ```

---

## MIGRATION FILES TO APPLY

### File 1: `20260121_optimize_subscriptions_rls.sql`
- **Size:** 2.2 KB
- **Purpose:** Optimize subscriptions RLS to use `current_company_id()`
- **Impact:** Performance improvement

### File 2: `20260121_kernel_backend_final_alignment.sql`
- **Size:** 16.4 KB
- **Purpose:** Ensure 100% Kernel compliance
- **Impact:** Fixes 8 tables, ensures consistency

---

## POST-APPLICATION VERIFICATION

After applying migrations, verify:

1. **Functions Created:**
   ```sql
   SELECT COUNT(*) as function_count
   FROM pg_proc 
   WHERE proname IN ('current_company_id', 'is_admin')
   AND pronamespace = 'public'::regnamespace;
   -- Expected: 2
   ```

2. **Policies Updated:**
   ```sql
   -- Count policies using current_company_id
   SELECT COUNT(*) as policy_count
   FROM pg_policies
   WHERE qual::text LIKE '%current_company_id%'
   AND schemaname = 'public';
   -- Expected: 50+ (across all tables)
   ```

3. **No Legacy Patterns:**
   ```sql
   -- Check for nested subqueries (should be minimal)
   SELECT COUNT(*) as legacy_count
   FROM pg_policies
   WHERE qual::text LIKE '%company_id IN (SELECT company_id FROM profiles%'
   AND schemaname = 'public';
   -- Expected: 0 (after migration)
   ```

---

## TROUBLESHOOTING

### If Migration Fails:

1. **Check for Existing Policies:**
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'company_team' 
   AND schemaname = 'public';
   ```
   Migration uses `DROP POLICY IF EXISTS`, so this should be safe.

2. **Check Function Dependencies:**
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('current_company_id', 'is_admin')
   AND pronamespace = 'public'::regnamespace;
   ```
   Migration creates these functions if they don't exist.

3. **Verify Table Exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'company_team';
   ```
   Migration checks for table existence before applying policies.

---

## SUMMARY

**Supabase URL:** `https://wmjxiazhvjaadzdsroqa.supabase.co`  
**Dashboard:** `https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza`  
**SQL Editor:** `https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new`

**Migrations Ready:** ✅ 2 files  
**Verification Ready:** ✅ Scripts created  
**Status:** 🎯 **READY TO APPLY**

---

**Next Step:** Apply migrations via Supabase Dashboard SQL Editor
