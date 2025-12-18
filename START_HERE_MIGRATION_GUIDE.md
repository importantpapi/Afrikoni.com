# 🚀 START HERE - MIGRATION GUIDE

## ⚠️ **YOU GOT A SCHEMA ERROR - THAT'S WHY YOU'RE HERE**

---

## ✅ **CORRECT ORDER (RUN EXACTLY LIKE THIS):**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Fix Schema (MUST RUN FIRST!)                      │
│  File: QUICK_COPY_MIGRATION_0_SCHEMA_FIX.sql                │
│  Purpose: Add missing columns to profiles table             │
│  Time: 30 seconds                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Profile Sync Trigger                              │
│  File: QUICK_COPY_MIGRATION_1.sql                           │
│  Purpose: Auto-sync auth.users → profiles                   │
│  Time: 30 seconds                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Universal User Visibility                         │
│  File: QUICK_COPY_MIGRATION_2.sql                           │
│  Purpose: Track all users equally                           │
│  Time: 30 seconds                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Refresh Dashboard                                 │
│  URL: http://localhost:5175/dashboard/risk                  │
│  Action: Press Ctrl/Cmd + R                                 │
│  Time: 5 seconds                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **DETAILED STEPS:**

### **STEP 1: FIX SCHEMA** 🔧

**DO THIS FIRST OR NOTHING ELSE WILL WORK!**

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open file: **`QUICK_COPY_MIGRATION_0_SCHEMA_FIX.sql`**
4. Select ALL (Ctrl/Cmd + A)
5. Copy (Ctrl/Cmd + C)
6. Paste into SQL Editor
7. Click **"Run"**

**✅ Success looks like:**
```
✅ Added email column
✅ Added full_name column
✅ Added role column
✅ Added phone column
✅ Added is_admin column
✅ Added company_id column
✅ Added created_at column
✅ Added updated_at column

Profiles table columns:
id, email, full_name, role, phone, is_admin, company_id, created_at, updated_at

✅ Schema is now ready for main migrations
```

**❌ If you see an error:**
- Double-check you're in the correct Supabase project
- Make sure you copied the ENTIRE file
- Try refreshing Supabase Dashboard

---

### **STEP 2: PROFILE SYNC TRIGGER** 🔄

**Only run after Step 1 succeeds!**

1. Stay in SQL Editor (same window)
2. Click **"New Query"**
3. Open file: **`QUICK_COPY_MIGRATION_1.sql`**
4. Select ALL (Ctrl/Cmd + A)
5. Copy (Ctrl/Cmd + C)
6. Paste into SQL Editor
7. Click **"Run"**

**✅ Success looks like:**
```
✅ SUCCESS: All users synced!

Total auth.users: 2
Total profiles: 2
Missing profiles: 0
```

---

### **STEP 3: UNIVERSAL VISIBILITY** 👁️

**Only run after Step 2 succeeds!**

1. Stay in SQL Editor (same window)
2. Click **"New Query"**
3. Open file: **`QUICK_COPY_MIGRATION_2.sql`**
4. Select ALL (Ctrl/Cmd + A)
5. Copy (Ctrl/Cmd + C)
6. Paste into SQL Editor
7. Click **"Run"**

**✅ Success looks like:**
```
============================================
MIGRATION 2: UNIVERSAL VISIBILITY - COMPLETE
============================================

👥 TOTAL USERS: 2
  ├─ Active: 1
  └─ Inactive: 1

✅ ALL USERS VISIBLE
✅ ALL USERS TRACKED
✅ ALL USERS EQUAL
```

---

### **STEP 4: VERIFY IT WORKS** ✅

1. Open your browser
2. Go to: **http://localhost:5175/dashboard/risk**
3. Press **Ctrl/Cmd + R** (refresh)
4. Open Console: **F12**

**✅ You should see:**
```
[Risk Dashboard] Loading...
[Risk Dashboard] User role: admin
[Risk Dashboard] Company ID: [your-company-id]
[Risk Dashboard] ALL USERS LOADED: 2
[Risk Dashboard] User 1: youba@example.com
[Risk Dashboard] User 2: binoscientific@gmail.com
```

**Dashboard should show:**
```
User Registrations (Last 30 Days)
2 total users

┌─────────────────────────────────────┐
│ Youba Simao Thiam                   │
│ youba@example.com                    │
│ [Activity summary]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Binoscientific User                 │
│ binoscientific@gmail.com             │
│ [Activity summary]                  │
└─────────────────────────────────────┘
```

---

## ❓ **TROUBLESHOOTING:**

### **"Column already exists" error in Step 1:**
✅ **This is OK!** The script is smart - it skips existing columns. Just continue to Step 2.

### **"Function already exists" error in Step 2:**
Run this first to clean up:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```
Then re-run Step 2.

### **"View already exists" error in Step 3:**
Run this first to clean up:
```sql
DROP VIEW IF EXISTS public.complete_user_view CASCADE;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_admin_on_new_profile();
```
Then re-run Step 3.

### **Still not seeing users in dashboard:**
1. Check console logs (F12)
2. Verify migrations completed without errors
3. Check that you're logged in as admin
4. Try hard refresh: Ctrl/Cmd + Shift + R

---

## 📊 **VERIFICATION QUERIES:**

**After all 3 migrations, run these in SQL Editor to verify:**

```sql
-- Check all users are synced
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM auth.users au 
   LEFT JOIN profiles p ON au.id = p.id 
   WHERE p.id IS NULL) as missing;

-- Should show: missing = 0
```

```sql
-- List all users
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Should show all registered users
```

---

## 🎉 **SUCCESS CHECKLIST:**

- [ ] Step 1 completed (Schema fixed)
- [ ] Step 2 completed (Trigger created)
- [ ] Step 3 completed (Visibility enabled)
- [ ] Dashboard shows 2+ users
- [ ] binoscientific@gmail.com visible
- [ ] Search works for any user
- [ ] Console logs show all users
- [ ] No errors in console

---

## 🚀 **AFTER SUCCESS:**

Everything will work automatically from now on:
- ✅ New users auto-sync to profiles
- ✅ All users visible in dashboard
- ✅ Search works instantly
- ✅ Activity tracked for everyone
- ✅ Admin gets notifications
- ✅ No manual work needed

---

**🔥 Follow this guide exactly and you'll be done in 2 minutes!** ⚡

