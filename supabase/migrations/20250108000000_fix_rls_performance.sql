-- Fix RLS Performance Issues
-- This migration optimizes RLS policies by:
-- 1. Replacing auth.uid() with (select auth.uid()) to avoid re-evaluation per row
-- 2. Consolidating multiple permissive policies where possible

-- ============================================================================
-- 1. Fix company_team table policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Company owners can manage team members" ON public.company_team;
DROP POLICY IF EXISTS "Team members can view their own record" ON public.company_team;
DROP POLICY IF EXISTS "Users can view team members for their company" ON public.company_team;
DROP POLICY IF EXISTS "Users can view team members of their company" ON public.company_team;
DROP POLICY IF EXISTS "Users can insert team members for their company" ON public.company_team;
DROP POLICY IF EXISTS "Users can update team members for their company" ON public.company_team;
DROP POLICY IF EXISTS "Users can delete team members for their company" ON public.company_team;

-- Create optimized consolidated policies
-- SELECT: Combined policy for all select scenarios
CREATE POLICY "company_team_select" ON public.company_team
  FOR SELECT
  USING (
    -- Team members can view their own record
    (user_id = (select auth.uid()) OR member_email = (select email from auth.users where id = (select auth.uid())))
    OR
    -- Users can view team members of their company
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.company_id = company_team.company_id
    )
    OR
    -- Company owners can view all team members
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_team.company_id
      AND companies.owner_email = (select email from auth.users where id = (select auth.uid()))
    )
  );

-- INSERT: Combined policy
CREATE POLICY "company_team_insert" ON public.company_team
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_team.company_id
      AND companies.owner_email = (select email from auth.users where id = (select auth.uid()))
    )
  );

-- UPDATE: Combined policy
CREATE POLICY "company_team_update" ON public.company_team
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_team.company_id
      AND companies.owner_email = (select email from auth.users where id = (select auth.uid()))
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_team.company_id
      AND companies.owner_email = (select email from auth.users where id = (select auth.uid()))
    )
  );

-- DELETE: Combined policy
CREATE POLICY "company_team_delete" ON public.company_team
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_team.company_id
      AND companies.owner_email = (select email from auth.users where id = (select auth.uid()))
    )
  );

-- ============================================================================
-- 2. Fix testimonials table policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "testimonials_admin_all" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select_published" ON public.testimonials;

-- Create optimized policies
-- SELECT: Combined policy (published OR admin)
CREATE POLICY "testimonials_select" ON public.testimonials
  FOR SELECT
  USING (
    published = true
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "testimonials_admin_write" ON public.testimonials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 3. Fix partner_logos table policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "partner_logos_admin_all" ON public.partner_logos;
DROP POLICY IF EXISTS "partner_logos_select_published" ON public.partner_logos;

-- Create optimized policies
-- SELECT: Combined policy (published OR admin)
CREATE POLICY "partner_logos_select" ON public.partner_logos
  FOR SELECT
  USING (
    published = true
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "partner_logos_admin_write" ON public.partner_logos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 4. Fix acquisition_events table policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view all acquisition events" ON public.acquisition_events;

-- Create optimized policy
CREATE POLICY "acquisition_events_admin_select" ON public.acquisition_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- ============================================================================
-- 5. Fix referral_codes table policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referral_codes;

-- Create optimized policy
CREATE POLICY "referral_codes_select" ON public.referral_codes
  FOR SELECT
  USING (
    referrer_user_id = (select auth.uid())
  );

-- ============================================================================
-- 6. Fix marketing_campaigns table policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.marketing_campaigns;

-- Create optimized policy
CREATE POLICY "marketing_campaigns_admin_all" ON public.marketing_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data->>'role') = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- ============================================================================
-- 7. Fix audit_log table policies (consolidate multiple permissive)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create optimized consolidated policies
-- SELECT: Combined policy (own logs OR admin)
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT
  USING (
    -- Users can view their own logs
    (actor_user_id = (select auth.uid()) 
     OR actor_company_id IN (
       SELECT company_id FROM profiles
       WHERE profiles.id = (select auth.uid())
     ))
    OR
    -- Admins can view all logs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- INSERT: System can insert (no auth check needed for system operations)
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT
  WITH CHECK (true);

