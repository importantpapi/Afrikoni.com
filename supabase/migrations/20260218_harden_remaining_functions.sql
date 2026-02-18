-- SECURE SEARCH PATH FOR REMAINING FUNCTIONS
-- Addresses: 0011_function_search_path_mutable (Vulnerability Fix)

-- 1. get_institutional_handshake (No arguments version)
CREATE OR REPLACE FUNCTION public.get_institutional_handshake()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_profile jsonb;
  v_company jsonb;
  v_capabilities jsonb;
  v_counts jsonb;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Get Profile
  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE id = v_user_id;
  
  -- 2. Get Company (if exists)
  IF v_profile->>'company_id' IS NOT NULL THEN
    SELECT to_jsonb(c) INTO v_company FROM public.companies c WHERE id = (v_profile->>'company_id')::uuid;
    
    -- 3. Get Capabilities
    -- Return normalized capabilities if missing
    SELECT to_jsonb(cap) INTO v_capabilities FROM public.company_capabilities cap WHERE company_id = (v_profile->>'company_id')::uuid;
    
    -- 4. Get Dashboard Counts (Aggregated)
    SELECT jsonb_build_object(
      'active_trades', (SELECT count(*) FROM public.trades WHERE (buyer_id = (v_profile->>'company_id')::uuid OR seller_id = (v_profile->>'company_id')::uuid) AND status != 'closed'),
      'pending_quotes', (SELECT count(*) FROM public.quotes WHERE supplier_company_id = (v_profile->>'company_id')::uuid AND status = 'pending'),
      'unread_notifications', (SELECT count(*) FROM public.notifications WHERE user_id = v_user_id AND read = false)
    ) INTO v_counts;
  END IF;

  -- 5. Build Handshake Packet
  v_result := jsonb_build_object(
    'profile', v_profile,
    'company', v_company,
    'capabilities', COALESCE(v_capabilities, jsonb_build_object('ready', true, 'can_buy', true, 'can_sell', false)),
    'counts', COALESCE(v_counts, jsonb_build_object('active_trades', 0, 'pending_quotes', 0, 'unread_notifications', 0)),
    'server_time', now()
  );

  RETURN v_result;
END;
$$;

-- 2. handle_new_user (Auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $$
DECLARE
  intended_role TEXT;
  full_name TEXT;
  meta_full_name TEXT;
  meta_intended_role TEXT;
BEGIN
  -- Extract metadata safely (Postgres JSON operator)
  meta_full_name := new.raw_user_meta_data->>'full_name';
  meta_intended_role := new.raw_user_meta_data->>'intended_role';

  IF meta_full_name IS NULL OR meta_full_name = '' THEN
    full_name := split_part(new.email, '@', 1);
  ELSE
    full_name := meta_full_name;
  END IF;

  intended_role := meta_intended_role;
  -- STRICT ROLE VALIDATION: Only allow 'buyer' or 'seller'. Default to 'buyer'.
  -- This prevents a user from forcing 'admin' role via client-side hacks.
  IF intended_role IS NULL OR intended_role NOT IN ('buyer', 'seller') THEN
    intended_role := 'buyer';
  END IF;

  -- Create the profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    full_name,
    intended_role,
    now(),
    now()
  );

  RETURN new;
END;
$$;
