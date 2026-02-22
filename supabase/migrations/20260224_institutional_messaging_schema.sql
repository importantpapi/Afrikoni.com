-- ============================================================================
-- INSTITUTIONAL MESSAGING SCHEMA ALIGNMENT
-- Date: 2026-02-24
-- Purpose: Harmonize conversations and messages tables for web and WhatsApp flows
-- ============================================================================

BEGIN;

-- 1. Enhance CONVERSATIONS table
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS buyer_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS related_to UUID,
  ADD COLUMN IF NOT EXISTS related_type TEXT,
  ADD COLUMN IF NOT EXISTS last_message TEXT;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_company ON conversations(buyer_company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_company ON conversations(seller_company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_related ON conversations(related_to, related_type);

-- 2. Enhance MESSAGES table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS sender_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receiver_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_user_email TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_company ON messages(sender_company_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_company ON messages(receiver_company_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;

-- 3. Update RLS for canonical messaging
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "conversations_access_unified" ON conversations
  FOR SELECT USING (
    buyer_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    seller_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "messages_access_unified" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.buyer_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
        c.seller_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
        c.user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "messages_insert_unified" ON messages
  FOR INSERT WITH CHECK (
    sender_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    auth.role() = 'authenticated' -- Allow authenticated users to send
  );

COMMIT;
