-- ============================================================================
-- RLS Performance Optimization Migration
-- ============================================================================
-- This migration optimizes Row Level Security policies by wrapping auth.uid()
-- calls in subqueries to prevent re-evaluation for each row.
--
-- Pattern: Replace auth.uid() with (select auth.uid())
-- Benefit: Auth function is evaluated once per query instead of per row
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTIONS TABLE (3 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their company subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their company subscription" ON public.subscriptions;

-- Create optimized SELECT policy
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
  FOR SELECT
  USING (
    company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    )
  );

-- Create optimized INSERT policy
CREATE POLICY "Users can insert their company subscription" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    )
  );

-- Create optimized UPDATE policy
CREATE POLICY "Users can update their company subscription" ON public.subscriptions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- KYC_VERIFICATIONS TABLE (3 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own KYC verifications" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can insert their own KYC verifications" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can update their own KYC verifications" ON public.kyc_verifications;

-- Create optimized SELECT policy
CREATE POLICY "Users can view their own KYC verifications" ON public.kyc_verifications
  FOR SELECT
  USING (
    (user_id = (select auth.uid())) OR
    (company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    ))
  );

-- Create optimized INSERT policy
CREATE POLICY "Users can insert their own KYC verifications" ON public.kyc_verifications
  FOR INSERT
  WITH CHECK (
    (user_id = (select auth.uid())) OR
    (company_id IN (
      SELECT companies.id
      FROM companies
      WHERE companies.id IN (
        SELECT profiles.company_id
        FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
    ))
  );

-- Create optimized UPDATE policy
CREATE POLICY "Users can update their own KYC verifications" ON public.kyc_verifications
  FOR UPDATE
  USING (
    ((user_id = (select auth.uid())) OR
     (company_id IN (
       SELECT companies.id
       FROM companies
       WHERE companies.id IN (
         SELECT profiles.company_id
         FROM profiles
         WHERE profiles.id = (select auth.uid())
       )
     ))) AND
    (status <> ALL (ARRAY['approved'::text, 'rejected'::text]))
  )
  WITH CHECK (
    ((user_id = (select auth.uid())) OR
     (company_id IN (
       SELECT companies.id
       FROM companies
       WHERE companies.id IN (
         SELECT profiles.company_id
         FROM profiles
         WHERE profiles.id = (select auth.uid())
       )
     ))) AND
    (status <> ALL (ARRAY['approved'::text, 'rejected'::text]))
  );

-- ============================================================================
-- ORDERS TABLE (3 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create optimized SELECT policy
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  USING (
    (buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (seller_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    ))
  );

-- Create optimized INSERT policy
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL) AND
    ((buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (seller_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )))
  );

-- Create optimized UPDATE policy
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE
  USING (
    (buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (seller_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    ))
  )
  WITH CHECK (
    (buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (seller_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    ))
  );

-- ============================================================================
-- MESSAGES TABLE (4 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own sent messages" ON public.messages;

-- Create optimized SELECT policy
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT
  USING (
    (sender_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (receiver_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    ))
  );

-- Create optimized INSERT policy
CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL) AND
    (sender_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    ))
  );

-- Create optimized UPDATE policy
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE
  USING (
    sender_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  )
  WITH CHECK (
    sender_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

-- Create optimized DELETE policy
CREATE POLICY "Users can delete their own sent messages" ON public.messages
  FOR DELETE
  USING (
    sender_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

-- ============================================================================
-- RFQS TABLE (3 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can create RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Buyers can delete their own RFQs" ON public.rfqs;
-- Note: "Anyone can view RFQs" policy doesn't use auth.uid(), so we keep it as is

-- Create optimized UPDATE policy
CREATE POLICY "Users can update own RFQs" ON public.rfqs
  FOR UPDATE
  USING (
    buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  )
  WITH CHECK (
    buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

-- Create optimized INSERT policy
CREATE POLICY "Users can create RFQs" ON public.rfqs
  FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL) AND
    ((buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )) OR
    (buyer_company_id IS NULL))
  );

-- Create optimized DELETE policy
CREATE POLICY "Buyers can delete their own RFQs" ON public.rfqs
  FOR DELETE
  USING (
    buyer_company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE (3 policies - also needs optimization)
-- ============================================================================

-- Drop existing policies (keep the logic, just optimize performance)
DROP POLICY IF EXISTS "Users can view notifications by company" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
-- Note: "System can create notifications" policy doesn't need optimization

-- Create optimized SELECT policy
CREATE POLICY "Users can view notifications by company" ON public.notifications
  FOR SELECT
  USING (
    -- User ID matches directly (most reliable)
    (user_id IS NOT NULL AND user_id = (select auth.uid())) OR
    -- Company ID matches user's company from profiles OR company owner
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = (select auth.uid()) AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies 
        WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )) OR
    -- User email matches authenticated user's email
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = (select auth.uid())
    ))
  );

-- Create optimized UPDATE policy
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = (select auth.uid())) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = (select auth.uid()) AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies 
        WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = (select auth.uid())
    ))
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = (select auth.uid())) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = (select auth.uid()) AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies 
        WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = (select auth.uid())
    ))
  );

-- Create optimized DELETE policy
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = (select auth.uid())) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = (select auth.uid()) AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies 
        WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = (select auth.uid())
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = (select auth.uid())
    ))
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Optimized 5 tables: subscriptions, kyc_verifications, orders, messages, rfqs
-- - Also optimized notifications table (bonus)
-- - Total: 20 policies optimized
-- - All auth.uid() calls now wrapped in (select auth.uid()) subqueries
-- - Security logic preserved, performance improved
-- ============================================================================

