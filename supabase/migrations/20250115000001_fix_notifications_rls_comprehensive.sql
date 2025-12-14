-- Comprehensive fix for notifications RLS policy
-- This fixes the 403 errors by ensuring the policy correctly matches company_id, user_id, and user_email

-- Drop all existing notifications policies
DROP POLICY IF EXISTS "Users can view notifications by company" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create comprehensive SELECT policy that handles all cases
CREATE POLICY "Users can view notifications by company" ON public.notifications
  FOR SELECT
  USING (
    -- User ID matches directly (most reliable)
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    -- Company ID matches user's company from profiles OR company owner
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )) OR
    -- User email matches authenticated user's email
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- Create UPDATE policy
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- Create INSERT policy (for system/authenticated users)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create DELETE policy (users can delete their own notifications)
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (company_id IS NOT NULL AND (
      company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
      ) OR
      company_id IN (
        SELECT id FROM public.companies WHERE owner_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )) OR
    (user_email IS NOT NULL AND user_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ))
  );

-- Add index on company_id for better RLS performance
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications(user_email);

COMMENT ON POLICY "Users can view notifications by company" ON public.notifications IS 
'Allows users to view notifications where user_id, company_id, or user_email matches their authenticated identity';

