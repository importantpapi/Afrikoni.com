-- ============================================================================
-- CANONICAL MESSAGING SCHEMA ALIGNMENT
-- Date: 2026-02-25
-- Purpose: Implement participants table for flexible, context-aware messaging
-- ============================================================================

BEGIN;

-- 1. Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('buyer', 'supplier', 'admin', 'system')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate participation
  UNIQUE(conversation_id, company_id, user_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_company ON public.conversation_participants(company_id);

-- 2. Migrate existing data (Legacy Linkage)
-- Existing conversations have buyer_company_id and seller_company_id columns.
-- We seed the participants table from these columns.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='buyer_company_id') THEN
    INSERT INTO public.conversation_participants (conversation_id, company_id, role)
    SELECT id, buyer_company_id, 'buyer'
    FROM public.conversations
    WHERE buyer_company_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='seller_company_id') THEN
    INSERT INTO public.conversation_participants (conversation_id, company_id, role)
    SELECT id, seller_company_id, 'supplier'
    FROM public.conversations
    WHERE seller_company_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. Enhance RLS for strict B2B privacy
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;
CREATE POLICY "participants_select_own" ON public.conversation_participants
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Update Conversations RLS to use participants table
DROP POLICY IF EXISTS "conversations_access_unified" ON public.conversations;
CREATE POLICY "conversations_access_participants" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND (
        cp.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        cp.user_id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Update Messages RLS to use participants table
DROP POLICY IF EXISTS "messages_access_unified" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_access_participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND (
        cp.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        cp.user_id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

COMMIT;
