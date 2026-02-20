-- ============================================================================
-- CANONICAL IDENTITY "ONE FLOW" - Afrikoni 2026
-- Date: 2026-02-20
-- Purpose: Unify User and Company identity into a single "Handshake" at signup.
--          Implements the "Everyone is a Company" mandate.
-- ============================================================================

-- 1. Ensure columns exist
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Define the Sovereign Identity Handler
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_full_name TEXT;
  v_intended_role TEXT;
  v_display_name TEXT;
BEGIN
  -- A. Extract Metadata
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_intended_role := new.raw_user_meta_data->>'intended_role';

  -- B. Defaulting
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := split_part(new.email, '@', 1);
  END IF;

  IF v_intended_role IS NULL OR v_intended_role NOT IN ('buyer', 'seller', 'logistics') THEN
    v_intended_role := 'buyer';
  END IF;

  -- C. THE ONE FLOW: Create the Company first
  -- Solo traders are treated as companies from second zero.
  v_display_name := v_full_name;
  
  INSERT INTO public.companies (
    company_name,
    verified,
    created_at
  )
  VALUES (
    v_display_name,
    false,
    now()
  )
  RETURNING id INTO v_company_id;

  -- D. Initialize Capabilities (The state machine's initial state)
  INSERT INTO public.company_capabilities (
    company_id,
    can_buy,
    can_sell,
    sell_status
  )
  VALUES (
    v_company_id,
    true, -- Everyone can buy
    (v_intended_role = 'seller'),
    CASE WHEN v_intended_role = 'seller' THEN 'pending_onboarding' ELSE 'not_applicable' END
  );

  -- E. Create the Profile (The human accessor)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    company_id,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_intended_role,
    v_company_id,
    false,
    now(),
    now()
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Infrastructure Protection (RLS check for companies)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Companies are viewable by participants" ON public.companies;
CREATE POLICY "Companies are viewable by participants" ON public.companies
  FOR SELECT TO authenticated
  USING (true); -- Public directory of business actors is essential for B2B

DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- 5. RELATIONSHIP CANONICALIZATION (Fixes PostgREST Ambiguity)
-- Removes ambiguity between company_id and supplier_id in products table
DO $$ 
BEGIN
    -- Check if products_supplier_id_fkey exists and drop it to favor products_company_id_fkey
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_id_fkey') THEN
        ALTER TABLE public.products DROP CONSTRAINT products_supplier_id_fkey;
    END IF;
    
    -- Ensure company_id has the correct fkey if not present
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_company_id_fkey') THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id);
    END IF;
END $$;
