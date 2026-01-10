# 🚀 RUN MIGRATIONS NOW - 5-MINUTE SETUP

## ⚡ **QUICK START (COPY-PASTE READY)**

---

## 📋 **STEP 1: Open Supabase Dashboard**

1. Go to: **https://supabase.com/dashboard**
2. Select your **Afrikoni project**
3. Click **SQL Editor** in left sidebar
4. Click **"New Query"** button

---

## 📋 **STEP 2: Run Migration 1 - Profile Sync Trigger**

### **Copy this ENTIRE code block:**

```sql
/**
 * CRITICAL FIX: Auto-sync auth.users → profiles
 * 
 * PROBLEM: Users can register in auth.users but not appear in profiles table
 * SOLUTION: Automatic trigger that creates profile on registration
 */

-- ============================================================================
-- STEP 1: Create function to handle new user registration
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Create trigger on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Backfill existing users (sync auth.users → profiles)
-- ============================================================================

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'buyer') as role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROFILE SYNC VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total auth.users: %', auth_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE 'Missing profiles: %', missing_count;
  
  IF missing_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All users synced!';
  ELSE
    RAISE WARNING '⚠️  WARNING: % users still missing profiles', missing_count;
  END IF;
  
  RAISE NOTICE '============================================';
END $$;
```

### **Then:**
1. **Paste** it in Supabase SQL Editor
2. Click **"Run"** (or press Ctrl/Cmd + Enter)
3. **Wait for success message**

### **Expected Output:**
```
============================================
PROFILE SYNC VERIFICATION
============================================
Total auth.users: 2
Total profiles: 2
Missing profiles: 0
✅ SUCCESS: All users synced!
============================================
```

---

## 📋 **STEP 3: Run Migration 2 - Universal User Visibility**

### **Copy this ENTIRE code block:**

```sql
/**
 * UNIVERSAL USER VISIBILITY - ALL USERS ARE EQUAL
 */

-- ============================================================================
-- STEP 1: Create indexes for fast user lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);

-- ============================================================================
-- STEP 2: Create function to get ALL users with activity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_users_with_activity(
  time_filter_days INTEGER DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  phone TEXT,
  is_admin BOOLEAN,
  company_name TEXT,
  country TEXT,
  verification_status TEXT,
  total_orders BIGINT,
  total_rfqs BIGINT,
  total_products BIGINT,
  total_activity BIGINT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.phone,
    p.is_admin,
    c.company_name,
    c.country,
    c.verification_status,
    COALESCE(
      (SELECT COUNT(*) FROM orders o WHERE o.buyer_company_id = p.company_id OR o.seller_company_id = p.company_id),
      0
    )::BIGINT as total_orders,
    COALESCE(
      (SELECT COUNT(*) FROM rfqs r WHERE r.company_id = p.company_id),
      0
    )::BIGINT as total_rfqs,
    COALESCE(
      (SELECT COUNT(*) FROM products pr WHERE pr.company_id = p.company_id),
      0
    )::BIGINT as total_products,
    (
      COALESCE((SELECT COUNT(*) FROM orders o WHERE o.buyer_company_id = p.company_id OR o.seller_company_id = p.company_id), 0) +
      COALESCE((SELECT COUNT(*) FROM rfqs r WHERE r.company_id = p.company_id), 0) +
      COALESCE((SELECT COUNT(*) FROM products pr WHERE pr.company_id = p.company_id), 0)
    )::BIGINT as total_activity,
    p.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  LEFT JOIN public.companies c ON p.company_id = c.id
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE 
    (time_filter_days IS NULL OR p.created_at >= NOW() - INTERVAL '1 day' * time_filter_days)
    AND (
      search_term IS NULL 
      OR p.email ILIKE '%' || search_term || '%'
      OR p.full_name ILIKE '%' || search_term || '%'
      OR c.company_name ILIKE '%' || search_term || '%'
    )
    AND (role_filter IS NULL OR p.role = role_filter)
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================================================
-- STEP 3: Create admin notification trigger for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO admin_ids
  FROM public.profiles
  WHERE is_admin = TRUE;

  IF admin_ids IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      metadata,
      read,
      created_at
    )
    SELECT 
      unnest(admin_ids),
      '🎉 New User Registration',
      NEW.full_name || ' (' || NEW.email || ') just registered on the platform.',
      'system',
      'high',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'role', NEW.role,
        'action_url', '/dashboard/risk'
      ),
      FALSE,
      NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON public.profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_users INTEGER;
  active_users INTEGER;
  inactive_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  SELECT COUNT(*) INTO active_users
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.buyer_company_id = p.company_id OR o.seller_company_id = p.company_id
  ) OR EXISTS (
    SELECT 1 FROM rfqs r WHERE r.company_id = p.company_id
  ) OR EXISTS (
    SELECT 1 FROM products pr WHERE pr.company_id = p.company_id
  );
  
  inactive_users := total_users - active_users;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'UNIVERSAL USER VISIBILITY - VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 TOTAL USERS: %', total_users;
  RAISE NOTICE '  ├─ Active users: %', active_users;
  RAISE NOTICE '  └─ Inactive users: %', inactive_users;
  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL USERS ARE VISIBLE';
  RAISE NOTICE '✅ ALL USERS ARE TRACKED';
  RAISE NOTICE '✅ ALL USERS ARE EQUAL';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
```

### **Then:**
1. **Paste** it in Supabase SQL Editor
2. Click **"Run"** (or press Ctrl/Cmd + Enter)
3. **Wait for success message**

### **Expected Output:**
```
============================================
UNIVERSAL USER VISIBILITY - VERIFICATION
============================================

👥 TOTAL USERS: 2
  ├─ Active users: 1
  └─ Inactive users: 1

✅ ALL USERS ARE VISIBLE
✅ ALL USERS ARE TRACKED
✅ ALL USERS ARE EQUAL

============================================
```

---

## 📋 **STEP 4: Verify Everything Works**

### **Run this verification query:**

```sql
-- Check all users are synced
SELECT 
  au.email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ Missing Profile'
  END as profile_status,
  au.created_at as registered_date
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
```

### **Expected: ALL users show "✅ Has Profile"**

---

## 📋 **STEP 5: Refresh Your Dashboard**

1. Go to: `http://localhost:5175/dashboard/risk`
2. Press **Ctrl/Cmd + R** (or click Refresh button)
3. Open **Browser Console** (Press F12)
4. Look for logs:

```
✅ ALL USERS LOADED: [...]
📊 Total: X users | Active: Y | Inactive: Z
```

---

## ✅ **SUCCESS CHECKLIST:**

After completing all steps:

- [ ] Migration 1 ran successfully
- [ ] Migration 2 ran successfully
- [ ] Verification shows all users synced
- [ ] Dashboard refreshed
- [ ] Console shows all users
- [ ] Search works for any user
- [ ] Activity tracking visible

---

## 🎯 **WHAT YOU SHOULD SEE:**

### **In Dashboard:**
- **Before:** "1 total users"
- **After:** "2+ total users" (or however many you have)

### **In Console:**
```javascript
✅ ALL USERS LOADED: [
  {email: 'youba@...', name: 'Youba Simao Thiam', activity: 2},
  {email: 'binoscientific@gmail.com', name: 'Binoscientific User', activity: 0},
  // ... all users
]
```

### **When You Search:**
- Type ANY email → User appears instantly
- ALL users searchable
- Complete activity shown

---

## ⚠️ **TROUBLESHOOTING:**

### **Error: "permission denied for table auth.users"**
→ Make sure you're using Supabase SQL Editor (has admin privileges)

### **Error: "relation does not exist"**
→ Make sure you're in the correct Supabase project

### **Users still not showing:**
→ Run the verification query above to check sync status

---

## 🚀 **TIME ESTIMATE:**

- Migration 1: **1 minute**
- Migration 2: **1 minute**
- Verification: **1 minute**
- Refresh & Test: **2 minutes**

**Total: 5 minutes** ⚡

---

**🎉 After this, ALL users will be visible, tracked equally, and monitored in real-time. No one will be missed!** ✅

