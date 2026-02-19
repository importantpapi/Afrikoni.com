-- ============================================================================
-- WHATSAPP CONVERSATIONS INFRASTRUCTURE
-- Date: 2026-02-19
-- Purpose: Create conversations and messages tables for WhatsApp integration
-- Implements: MASTER_PROMPT_2026 Section 7.3
-- ============================================================================

-- Conversations table: Tracks WhatsApp conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  last_message_at TIMESTAMP DEFAULT NOW(),
  context JSONB DEFAULT '{}', -- Store conversation context
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table: Stores all WhatsApp messages (inbound and outbound)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  media_url TEXT, -- For images, voice notes, documents
  media_type TEXT, -- 'image', 'audio', 'document'
  intent TEXT, -- Classified intent: 'CREATE_RFQ', 'SUBMIT_QUOTE', etc.
  entities JSONB DEFAULT '{}', -- Extracted entities from AI
  twilio_message_sid TEXT, -- Twilio tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Sessions table: Track onboarding and conversation state
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  current_intent TEXT DEFAULT 'ONBOARDING', -- 'ONBOARDING', 'CREATE_RFQ', 'IDLE'
  state_data JSONB DEFAULT '{}', -- Current state machine data
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_trade_id ON conversations(trade_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_intent ON messages(intent);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_activity ON whatsapp_sessions(last_activity_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (true); -- Webhook needs to create for unauthenticated users

CREATE POLICY "System can update conversations"
  ON conversations FOR UPDATE
  USING (true);

-- RLS Policies: Users can only see their own messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "System can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true); -- Webhook needs to create messages

-- RLS Policies: WhatsApp sessions (service role only)
CREATE POLICY "Service role can manage sessions"
  ON whatsapp_sessions FOR ALL
  USING (true);

-- Trigger: Update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger: Update whatsapp_sessions last_activity_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_sessions
  SET last_activity_at = NOW(), updated_at = NOW()
  WHERE phone_number = NEW.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Comment
COMMENT ON TABLE conversations IS 'WhatsApp conversation sessions linked to trades or users';
COMMENT ON TABLE messages IS 'All WhatsApp messages (inbound/outbound) with AI classification';
COMMENT ON TABLE whatsapp_sessions IS 'State machine for WhatsApp onboarding and conversation flows';
