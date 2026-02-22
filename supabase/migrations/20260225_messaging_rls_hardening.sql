-- ============================================================================
-- MESSAGING RLS HARDENING
-- Date: 2026-02-25
-- Purpose: Remove permissive write policies and enforce company-scoped messaging
-- ============================================================================

BEGIN;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive policies
DROP POLICY IF EXISTS "System can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "System can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "System can insert messages" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_unified" ON public.messages;

-- Conversations write policies: user must be one of the owning companies or owner user
DROP POLICY IF EXISTS "conversations_insert_participants" ON public.conversations;
CREATE POLICY "conversations_insert_participants" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "conversations_update_participants" ON public.conversations;
CREATE POLICY "conversations_update_participants" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Messages insert policy: sender must belong to conversation participant company
DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;
CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.user_id = auth.uid()
          OR c.buyer_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
          OR c.seller_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.conversation_participants cp
            WHERE cp.conversation_id = c.id
              AND (
                cp.user_id = auth.uid()
                OR cp.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
              )
          )
        )
    )
    AND (
      sender_company_id IS NULL
      OR sender_company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Participants table write policies for canonical flows
DROP POLICY IF EXISTS "participants_insert_own" ON public.conversation_participants;
CREATE POLICY "participants_insert_own" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "participants_update_own" ON public.conversation_participants;
CREATE POLICY "participants_update_own" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

COMMIT;
