/**
 * MIGRATION 2: Universal User Visibility
 * COPY THIS ENTIRE FILE → PASTE IN SUPABASE SQL EDITOR → RUN
 */

-- ============================================================================
-- Create indexes for fast lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);

-- ============================================================================
-- Create function to get ALL users with activity
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
-- Create admin notification trigger
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
  RAISE NOTICE 'MIGRATION 2: UNIVERSAL VISIBILITY - COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 TOTAL USERS: %', total_users;
  RAISE NOTICE '  ├─ Active: %', active_users;
  RAISE NOTICE '  └─ Inactive: %', inactive_users;
  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL USERS VISIBLE';
  RAISE NOTICE '✅ ALL USERS TRACKED';
  RAISE NOTICE '✅ ALL USERS EQUAL';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

