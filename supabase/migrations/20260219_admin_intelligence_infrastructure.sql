-- ============================================================================
-- ADMIN INTELLIGENCE INFRASTRUCTURE - 2026
-- ============================================================================
-- Purpose: Enable AI-powered operations and admin control systems
-- Created: 2026-02-19
-- Status: Production-ready
--
-- Components:
-- 1. admin_config - Store API keys and system configuration
-- 2. admin_flags - Track suspicious activity and manual reviews
-- 3. Helper functions for operations center
-- ============================================================================

-- 1. ADMIN CONFIGURATION TABLE
-- Store sensitive configuration like OpenAI API keys
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  encrypted_value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(key);
CREATE INDEX IF NOT EXISTS idx_admin_config_category ON admin_config(category);

-- RLS: Only admins can access
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_config_admin_only" ON admin_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default configuration
INSERT INTO admin_config (key, value, description, category, is_sensitive)
VALUES 
  ('openai_api_key', NULL, 'OpenAI API key for AI intelligence features', 'ai', true),
  ('ai_parsing_enabled', 'true', 'Enable AI-powered RFQ parsing', 'ai', false),
  ('fraud_detection_enabled', 'true', 'Enable fraud detection system', 'security', false),
  ('auto_matching_enabled', 'true', 'Enable automatic supplier matching', 'operations', false),
  ('max_rfqs_per_day_unverified', '5', 'Daily RFQ limit for unverified companies', 'limits', false),
  ('max_rfqs_per_day_verified', '50', 'Daily RFQ limit for verified companies', 'limits', false)
ON CONFLICT (key) DO NOTHING;

-- 2. ADMIN FLAGS TABLE
-- Track suspicious activity and items needing review
CREATE TABLE IF NOT EXISTS admin_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'rfq', 'quote', 'company', 'user'
  item_id UUID NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  flagged_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for admin operations center
CREATE INDEX IF NOT EXISTS idx_admin_flags_status ON admin_flags(status);
CREATE INDEX IF NOT EXISTS idx_admin_flags_severity ON admin_flags(severity);
CREATE INDEX IF NOT EXISTS idx_admin_flags_item ON admin_flags(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_admin_flags_created ON admin_flags(created_at DESC);

-- RLS: Only admins can access
ALTER TABLE admin_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_flags_admin_only" ON admin_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. HELPER FUNCTIONS FOR OPERATIONS CENTER

-- Function: Get stuck RFQs (no quotes after 48 hours)
CREATE OR REPLACE FUNCTION get_stuck_rfqs(hours_threshold INT DEFAULT 48)
RETURNS TABLE (
  rfq_id UUID,
  title TEXT,
  buyer_id UUID,
  buyer_name TEXT,
  created_at TIMESTAMPTZ,
  hours_old NUMERIC,
  quote_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as rfq_id,
    t.title,
    t.buyer_id,
    c.company_name as buyer_name,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600 as hours_old,
    COUNT(q.id) as quote_count
  FROM trades t
  LEFT JOIN quotes q ON q.trade_id = t.id
  LEFT JOIN companies c ON c.id = t.buyer_id
  WHERE t.trade_type = 'rfq'
    AND t.status = 'rfq_open'
    AND t.created_at < NOW() - (hours_threshold || ' hours')::INTERVAL
  GROUP BY t.id, t.title, t.buyer_id, c.company_name, t.created_at
  HAVING COUNT(q.id) = 0
  ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get ghost buyer RFQs (many quotes, no response)
CREATE OR REPLACE FUNCTION get_ghost_buyer_rfqs(
  min_quotes INT DEFAULT 3,
  min_days INT DEFAULT 5
)
RETURNS TABLE (
  rfq_id UUID,
  title TEXT,
  buyer_id UUID,
  buyer_name TEXT,
  created_at TIMESTAMPTZ,
  days_old NUMERIC,
  quote_count BIGINT,
  last_buyer_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as rfq_id,
    t.title,
    t.buyer_id,
    c.company_name as buyer_name,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 86400 as days_old,
    COUNT(q.id) as quote_count,
    t.updated_at as last_buyer_activity
  FROM trades t
  LEFT JOIN quotes q ON q.trade_id = t.id
  LEFT JOIN companies c ON c.id = t.buyer_id
  WHERE t.trade_type = 'rfq'
    AND t.status IN ('quoted', 'negotiating')
    AND t.created_at < NOW() - (min_days || ' days')::INTERVAL
  GROUP BY t.id, t.title, t.buyer_id, c.company_name, t.created_at, t.updated_at
  HAVING COUNT(q.id) >= min_quotes
  ORDER BY quote_count DESC, t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get platform health metrics
CREATE OR REPLACE FUNCTION get_platform_health_metrics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH metrics AS (
    SELECT
      -- RFQ metrics
      COUNT(*) FILTER (WHERE trade_type = 'rfq' AND status = 'rfq_open') as open_rfqs,
      COUNT(*) FILTER (WHERE trade_type = 'rfq' AND status = 'quoted') as quoted_rfqs,
      COUNT(*) FILTER (WHERE trade_type = 'rfq' AND created_at > NOW() - INTERVAL '24 hours') as rfqs_24h,
      
      -- Quote metrics
      (SELECT COUNT(*) FROM quotes WHERE status = 'submitted' AND created_at > NOW() - INTERVAL '24 hours') as quotes_24h,
      (SELECT COUNT(*) FROM quotes WHERE status = 'accepted' AND created_at > NOW() - INTERVAL '7 days') as accepted_quotes_7d,
      
      -- Active trades
      COUNT(*) FILTER (WHERE trade_type IN ('order', 'direct') AND status IN ('pending', 'funded', 'in_transit')) as active_trades,
      
      -- User activity
      (SELECT COUNT(*) FROM profiles WHERE last_sign_in_at > NOW() - INTERVAL '24 hours') as active_users_24h,
      (SELECT COUNT(*) FROM companies WHERE verified = true) as verified_companies,
      
      -- Flags
      (SELECT COUNT(*) FROM admin_flags WHERE status = 'open') as open_flags,
      (SELECT COUNT(*) FROM admin_flags WHERE severity = 'critical' AND status = 'open') as critical_flags
    FROM trades
  )
  SELECT jsonb_build_object(
    'rfqs', jsonb_build_object(
      'open', open_rfqs,
      'quoted', quoted_rfqs,
      'created_24h', rfqs_24h
    ),
    'quotes', jsonb_build_object(
      'submitted_24h', quotes_24h,
      'accepted_7d', accepted_quotes_7d
    ),
    'trades', jsonb_build_object(
      'active', active_trades
    ),
    'users', jsonb_build_object(
      'active_24h', active_users_24h,
      'verified_companies', verified_companies
    ),
    'flags', jsonb_build_object(
      'open', open_flags,
      'critical', critical_flags
    ),
    'updated_at', NOW()
  ) INTO result
  FROM metrics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-flag suspicious RFQs
CREATE OR REPLACE FUNCTION auto_flag_suspicious_rfqs()
RETURNS INT AS $$
DECLARE
  flagged_count INT := 0;
BEGIN
  -- Flag 1: High-value RFQs from unverified companies
  INSERT INTO admin_flags (item_type, item_id, reason, severity, status, metadata)
  SELECT 
    'rfq',
    t.id,
    'High-value RFQ from unverified company',
    'high',
    'open',
    jsonb_build_object(
      'buyer_id', t.buyer_id,
      'value_estimate', t.quantity * COALESCE(t.target_price, 0),
      'auto_flagged', true
    )
  FROM trades t
  LEFT JOIN companies c ON c.id = t.buyer_id
  WHERE t.trade_type = 'rfq'
    AND t.created_at > NOW() - INTERVAL '1 hour'
    AND c.verified = false
    AND (t.quantity * COALESCE(t.target_price, 0)) > 50000
    AND NOT EXISTS (
      SELECT 1 FROM admin_flags 
      WHERE item_type = 'rfq' 
      AND item_id = t.id
    );
  
  GET DIAGNOSTICS flagged_count = ROW_COUNT;
  
  -- Flag 2: Excessive RFQ posting (5+ in 24h)
  INSERT INTO admin_flags (item_type, item_id, reason, severity, status, metadata)
  SELECT DISTINCT
    'company',
    t.buyer_id,
    'Excessive RFQ posting (5+ in 24h)',
    'medium',
    'open',
    jsonb_build_object(
      'rfq_count', COUNT(*),
      'auto_flagged', true
    )
  FROM trades t
  WHERE t.trade_type = 'rfq'
    AND t.created_at > NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM admin_flags 
      WHERE item_type = 'company' 
      AND item_id = t.buyer_id
      AND reason LIKE '%Excessive RFQ%'
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  GROUP BY t.buyer_id
  HAVING COUNT(*) >= 5;
  
  GET DIAGNOSTICS flagged_count = flagged_count + ROW_COUNT;
  
  RETURN flagged_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-flag on RFQ creation
CREATE OR REPLACE FUNCTION trigger_auto_flag_rfq()
RETURNS TRIGGER AS $$
BEGIN
  -- Run auto-flagging asynchronously (non-blocking)
  PERFORM auto_flag_suspicious_rfqs();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_flag_on_rfq_create ON trades;
CREATE TRIGGER auto_flag_on_rfq_create
  AFTER INSERT ON trades
  FOR EACH ROW
  WHEN (NEW.trade_type = 'rfq')
  EXECUTE FUNCTION trigger_auto_flag_rfq();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

COMMENT ON TABLE admin_config IS 'Admin configuration including API keys and system settings';
COMMENT ON TABLE admin_flags IS 'Suspicious activity tracking for operations center';
COMMENT ON FUNCTION get_stuck_rfqs IS 'Get RFQs with no quotes after X hours';
COMMENT ON FUNCTION get_ghost_buyer_rfqs IS 'Get RFQs with many quotes but no buyer response';
COMMENT ON FUNCTION get_platform_health_metrics IS 'Real-time platform health dashboard metrics';
COMMENT ON FUNCTION auto_flag_suspicious_rfqs IS 'Automatically flag suspicious RFQs for admin review';

-- Grant execute permissions to authenticated users (RLS still applies)
GRANT EXECUTE ON FUNCTION get_stuck_rfqs TO authenticated;
GRANT EXECUTE ON FUNCTION get_ghost_buyer_rfqs TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION auto_flag_suspicious_rfqs TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Admin Intelligence Infrastructure created successfully';
  RAISE NOTICE '📊 Operations Center ready for production use';
  RAISE NOTICE '🤖 Auto-flagging system activated';
END $$;
