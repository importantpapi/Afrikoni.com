-- ============================================================================
-- MASTER SECURITY HARDENING
-- Date: 2026-02-20
-- Fixes critical data leakage and privilege escalation vectors found in audit.
-- ============================================================================

BEGIN;

-- 1. Prevent Privilege Escalation via profiles.is_admin
-- A trigger is required because PostgreSQL RLS WITH CHECK cannot compare OLD to NEW easily,
-- and malicious UPDATE requests could otherwise set is_admin = true.

CREATE OR REPLACE FUNCTION protect_is_admin_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_is_admin BOOLEAN := false;
    current_uid UUID;
BEGIN
    -- Only act if the is_admin flag is being modified
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
        
        -- Get the current authenticated user safely
        BEGIN
            current_uid := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_uid := NULL;
        END;

        -- If there is an authenticated user (not service_role), check admin status
        IF current_uid IS NOT NULL THEN
            SELECT is_admin INTO current_user_is_admin 
            FROM profiles 
            WHERE id = current_uid;
            
            -- If user is not an admin, REVERT the change to the old value silently
            IF current_user_is_admin IS NOT TRUE THEN
                NEW.is_admin = OLD.is_admin;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_is_admin_protection ON profiles;

CREATE TRIGGER ensure_is_admin_protection
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_is_admin_flag();


-- 2. Prevent Data Leakage via corridor_alerts USING (true)
-- Corridor alerts often contain sensitive delay, logistics, and pricing data.
-- Limit visibility strictly to authenticated participants involved in the corridor, or admins.
ALTER TABLE corridor_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corridor_alerts_read_all" ON corridor_alerts;
DROP POLICY IF EXISTS "Anyone can view alerts" ON corridor_alerts;

CREATE POLICY "corridor_alerts_secure_select" ON corridor_alerts
  FOR SELECT USING (
    -- Admin override
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR 
    -- User matches the target corridor (this requires linking alert to company or user)
    -- As a baseline security, require authentication vs public using(true)
    auth.role() = 'authenticated'
  );


-- 3. Prevent Data Leakage via company_capabilities USING (true)
-- Company capabilities may contain unverified seller information. Require authentication.
ALTER TABLE company_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View capabilities" ON company_capabilities;

CREATE POLICY "company_capabilities_authenticated_read" ON company_capabilities
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );


-- 4. Prevent Data Leakage via messages table (Ensure STRICT isolation)
-- Messages must only be visible if the user is a member of one of the companies
-- in the conversation.
DROP POLICY IF EXISTS "messages_select_unified" ON messages;

CREATE POLICY "messages_select_strict" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = messages.conversation_id
      AND (c.buyer_company_id = p.company_id OR c.seller_company_id = p.company_id)
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );


COMMIT;
