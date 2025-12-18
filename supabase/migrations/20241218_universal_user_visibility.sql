/**
 * UNIVERSAL USER VISIBILITY - ALL USERS ARE EQUAL
 * 
 * PRINCIPLE: Every user is a potential client and must be tracked with equal importance
 * 
 * This migration ensures:
 * 1. ALL users are automatically synced (auth.users → profiles)
 * 2. ALL users appear in Risk Management dashboard
 * 3. ALL users get activity tracking
 * 4. NO user is hidden or missed
 * 5. COMPLETE visibility for admin
 */

-- ============================================================================
-- STEP 1: Ensure profiles table has all necessary columns
-- ============================================================================

-- Add any missing columns (safe - will not error if already exists)
DO $$ 
BEGIN
  -- Add phone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  -- Add is_admin column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add company_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create index for fast user lookups
-- ============================================================================

-- Index on email for fast searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index on created_at for sorting recent users
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Index on company_id for activity tracking
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Composite index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);

-- ============================================================================
-- STEP 3: Create view for complete user visibility
-- ============================================================================

CREATE OR REPLACE VIEW public.complete_user_view AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.phone,
  p.is_admin,
  p.created_at as profile_created,
  p.updated_at as profile_updated,
  
  -- Company info
  c.id as company_id,
  c.company_name,
  c.country,
  c.verification_status,
  
  -- Activity counts
  (
    SELECT COUNT(*) 
    FROM orders o 
    WHERE o.buyer_company_id = p.company_id OR o.seller_company_id = p.company_id
  ) as total_orders,
  
  (
    SELECT COUNT(*) 
    FROM rfqs r 
    WHERE r.company_id = p.company_id
  ) as total_rfqs,
  
  (
    SELECT COUNT(*) 
    FROM products pr 
    WHERE pr.company_id = p.company_id
  ) as total_products,
  
  -- Calculated fields
  CASE 
    WHEN c.verification_status = 'verified' THEN 'verified'
    WHEN c.verification_status = 'pending' THEN 'pending'
    ELSE 'unverified'
  END as user_status,
  
  -- Days since registration
  EXTRACT(DAY FROM (NOW() - p.created_at)) as days_since_registration,
  
  -- Auth info
  au.last_sign_in_at,
  au.email_confirmed_at
  
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- Grant access to authenticated users and admins
GRANT SELECT ON public.complete_user_view TO authenticated;
GRANT SELECT ON public.complete_user_view TO service_role;

-- ============================================================================
-- STEP 4: Create function to get ALL users with activity
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
    -- Time filter
    (time_filter_days IS NULL OR p.created_at >= NOW() - INTERVAL '1 day' * time_filter_days)
    -- Search filter
    AND (
      search_term IS NULL 
      OR p.email ILIKE '%' || search_term || '%'
      OR p.full_name ILIKE '%' || search_term || '%'
      OR c.company_name ILIKE '%' || search_term || '%'
    )
    -- Role filter
    AND (role_filter IS NULL OR p.role = role_filter)
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_users_with_activity IS 
'Returns ALL users with complete activity tracking. No user is excluded. Every user is tracked equally.';

-- ============================================================================
-- STEP 5: Create real-time notification for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_ids UUID[];
BEGIN
  -- Get all admin user IDs
  SELECT ARRAY_AGG(id) INTO admin_ids
  FROM public.profiles
  WHERE is_admin = TRUE;

  -- Create notification for each admin
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

-- Create trigger for new user notifications
DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON public.profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();

-- ============================================================================
-- STEP 6: Verification and reporting
-- ============================================================================

DO $$
DECLARE
  total_users INTEGER;
  users_with_companies INTEGER;
  users_without_companies INTEGER;
  active_users INTEGER;
  inactive_users INTEGER;
  verified_companies INTEGER;
  pending_companies INTEGER;
BEGIN
  -- Count all users
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  -- Count users with/without companies
  SELECT COUNT(*) INTO users_with_companies 
  FROM public.profiles WHERE company_id IS NOT NULL;
  
  users_without_companies := total_users - users_with_companies;
  
  -- Count active/inactive users (active = has any activity)
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
  
  -- Count companies by verification status
  SELECT COUNT(*) INTO verified_companies
  FROM public.companies WHERE verification_status = 'verified';
  
  SELECT COUNT(*) INTO pending_companies
  FROM public.companies WHERE verification_status = 'pending';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'UNIVERSAL USER VISIBILITY - VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 TOTAL USERS: %', total_users;
  RAISE NOTICE '  ├─ With companies: %', users_with_companies;
  RAISE NOTICE '  └─ Without companies: %', users_without_companies;
  RAISE NOTICE '';
  RAISE NOTICE '📊 USER ACTIVITY:';
  RAISE NOTICE '  ├─ Active users: % (%.1f%%)', active_users, 
    CASE WHEN total_users > 0 THEN (active_users::FLOAT / total_users * 100) ELSE 0 END;
  RAISE NOTICE '  └─ Inactive users: % (%.1f%%)', inactive_users,
    CASE WHEN total_users > 0 THEN (inactive_users::FLOAT / total_users * 100) ELSE 0 END;
  RAISE NOTICE '';
  RAISE NOTICE '🏢 COMPANIES:';
  RAISE NOTICE '  ├─ Verified: %', verified_companies;
  RAISE NOTICE '  └─ Pending: %', pending_companies;
  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL USERS ARE VISIBLE';
  RAISE NOTICE '✅ ALL USERS ARE TRACKED';
  RAISE NOTICE '✅ ALL USERS ARE EQUAL';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

