-- Fix mutable search_path security warnings for all vulnerable functions
-- This addresses Supabase security advisor warnings by setting explicit search_path
-- Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================================
-- 1. handle_updated_at (trigger function for push_subscriptions)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. update_corridor_updated_at (trigger function for corridors)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_corridor_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. update_trust_updated_at (trigger function for trust scores/signals)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_trust_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. update_logistics_providers_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_logistics_providers_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. update_updated_at_column (generic trigger function used in many tables)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. update_provider_stats (logistics provider statistics)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_provider_stats(
  p_provider_id UUID,
  p_accepted BOOLEAN,
  p_completed BOOLEAN DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE public.logistics_providers
  SET
    total_deliveries = CASE WHEN p_completed = true THEN total_deliveries + 1 ELSE total_deliveries END,
    total_rejections = CASE WHEN p_accepted = false THEN total_rejections + 1 ELSE total_rejections END,
    acceptance_rate = (
      CASE WHEN p_accepted THEN total_deliveries + 1 ELSE total_deliveries END::FLOAT /
      NULLIF(total_deliveries + total_rejections + 1, 0) * 100
    ),
    completion_rate = (
      CASE WHEN p_completed = true THEN (total_deliveries + 1)::FLOAT ELSE total_deliveries::FLOAT END /
      NULLIF(total_deliveries + 1, 0) * 100
    ),
    response_score = (
      -- Simple scoring: 70% completion rate + 30% acceptance rate
      (COALESCE(completion_rate, 0) * 0.7) + (COALESCE(acceptance_rate, 0) * 0.3)
    ),
    last_active_at = NOW()
  WHERE id = p_provider_id;
END;
$$;

-- ============================================================================
-- 7. update_company_subscription (subscription management trigger)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_company_subscription()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- When subscription is created/updated, update company plan
  IF NEW.status = 'active' THEN
    UPDATE public.companies
    SET 
      subscription_plan = NEW.plan_type,
      subscription_expires_at = NEW.current_period_end
    WHERE id = NEW.company_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE public.companies
    SET subscription_plan = 'free'
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 8. get_all_users_with_activity (admin user listing with aggregated activity)
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
SET search_path = public, extensions
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
    c.name AS company_name,
    c.country,
    p.verification_status,
    COALESCE(COUNT(DISTINCT o.id), 0)::BIGINT AS total_orders,
    COALESCE(COUNT(DISTINCT r.id), 0)::BIGINT AS total_rfqs,
    COALESCE(COUNT(DISTINCT pr.id), 0)::BIGINT AS total_products,
    (COALESCE(COUNT(DISTINCT o.id), 0) + COALESCE(COUNT(DISTINCT r.id), 0) + COALESCE(COUNT(DISTINCT pr.id), 0))::BIGINT AS total_activity,
    p.created_at,
    p.last_sign_in_at
  FROM public.profiles p
  LEFT JOIN public.companies c ON p.company_id = c.id
  LEFT JOIN public.orders o ON o.buyer_id = p.id
    AND (time_filter_days IS NULL OR o.created_at >= NOW() - (time_filter_days || ' days')::INTERVAL)
  LEFT JOIN public.rfqs r ON r.buyer_id = p.id
    AND (time_filter_days IS NULL OR r.created_at >= NOW() - (time_filter_days || ' days')::INTERVAL)
  LEFT JOIN public.products pr ON pr.supplier_id = p.id
    AND (time_filter_days IS NULL OR pr.created_at >= NOW() - (time_filter_days || ' days')::INTERVAL)
  WHERE
    (search_term IS NULL OR 
     p.email ILIKE '%' || search_term || '%' OR 
     p.full_name ILIKE '%' || search_term || '%' OR
     c.name ILIKE '%' || search_term || '%')
    AND (role_filter IS NULL OR p.role = role_filter)
  GROUP BY p.id, p.email, p.full_name, p.role, p.phone, p.is_admin, 
           c.name, c.country, p.verification_status, p.created_at, p.last_sign_in_at
  ORDER BY total_activity DESC, p.created_at DESC;
END;
$$;

-- ============================================================================
-- 9. notify_admin_new_user (trigger for admin notifications on user creation)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
      read
    )
    SELECT 
      admin_id,
      'New User Registration',
      'New user ' || COALESCE(NEW.full_name, NEW.email) || ' has joined the platform.',
      'system',
      FALSE
    FROM UNNEST(admin_ids) AS admin_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 10. enforce_standardized_description_lock (product governance trigger)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_standardized_description_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  is_user_admin boolean := public.is_admin();
  pg_role text := current_user;
BEGIN
  -- Only apply on UPDATE
  IF tg_op <> 'UPDATE' THEN
    RETURN new;
  END IF;

  -- If not standardized, nothing to enforce here
  IF COALESCE(old.is_standardized, false) = false THEN
    RETURN new;
  END IF;

  -- Allow admins to modify
  IF is_user_admin THEN
    RETURN new;
  END IF;

  -- Allow postgres role (used by migrations and admin operations)
  IF pg_role = 'postgres' THEN
    RETURN new;
  END IF;

  -- Block modification of standardized_description by non-admins
  IF old.standardized_description IS DISTINCT FROM new.standardized_description THEN
    RAISE EXCEPTION 
      'Standardized descriptions can only be modified by admins. Contact support if changes are needed.'
      USING HINT = 'Admin approval required for standardized product descriptions';
  END IF;

  RETURN new;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Note: kernel_settle_trade already has SET search_path = public in 20260210_kernel_settle_trade.sql
-- All 11 vulnerable functions are now protected with explicit search_path
