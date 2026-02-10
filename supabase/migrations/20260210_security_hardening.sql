-- SECURITY HARDENING MIGRATION: 20260210
-- FOCUS: Notification Leakage & Message Privacy

-- 1. NOTIFICATIONS: Remove Hybrid/Broad Policy
-- Previously, some notifications might have been visible to too many users via OR clauses.
-- New Policy: Strict ownership (user_id) OR company ownership (company_id) OR Admin.

DROP POLICY IF EXISTS "notifications_select_optimized" ON public.notifications;
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;

CREATE POLICY "strict_notification_access"
ON public.notifications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 2. MESSAGES: Enforce Conversation Membership
-- Prevents accessing messages by just guessing a conversation ID.
-- New Policy: Must be a participant in the conversation.

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;

CREATE POLICY "messages_select_participants"
ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
  OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 3. RFQS: Strict Buyer Ownership & Matched Suppliers
-- Prevents cross-tenant RFQ leakage.

DROP POLICY IF EXISTS "rfqs_select_policy" ON public.rfqs;

CREATE POLICY "rfqs_select_strict"
ON public.rfqs
FOR SELECT TO authenticated
USING (
  -- Buyer (Owner)
  buyer_company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  
  -- OR Matched Supplier (if match table exists, otherwise open/public logic might apply depending on business rules)
  -- For this hardening, we assume strict matching or public marketplace logic is handled by a separate "public_rfqs" view if needed.
  -- Here we allow if the user is a supplier matched to this RFQ.
  OR EXISTS (
    SELECT 1 FROM public.rfq_supplier_matches rsm
    WHERE rsm.rfq_id = rfqs.id
      AND rsm.supplier_company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  
  -- OR Admin
  OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
