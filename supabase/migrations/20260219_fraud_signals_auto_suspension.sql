-- ============================================================================
-- FRAUD SIGNALS & AUTO-SUSPENSION SYSTEM
-- Date: 2026-02-19
-- Purpose: Implement Layer 2 security - reputation system with auto-suspension
-- Implements: MASTER_PROMPT_2026 Section 5, Layer 2
-- ============================================================================

-- Fraud Signals table: Append-only log of fraud indicators
CREATE TABLE IF NOT EXISTS fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL, -- 'velocity_anomaly', 'fake_proof', 'chargeback', 'collusion', 'stolen_card', 'suspicious_pattern'
  severity DECIMAL(3,2) NOT NULL CHECK (severity >= 0 AND severity <= 1), -- 0.0 to 1.0
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context (trade_id, IP address, etc.)
  detected_at TIMESTAMP DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_company ON fraud_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON fraud_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_detected ON fraud_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_reviewed ON fraud_signals(reviewed) WHERE NOT reviewed;

-- User Fraud Scores view: Aggregate fraud score with exponential decay
-- Recent signals matter more than old ones (30-day decay)
CREATE OR REPLACE VIEW user_fraud_scores AS
SELECT 
  user_id,
  company_id,
  SUM(
    severity * EXP(-EXTRACT(EPOCH FROM (NOW() - detected_at)) / 2592000)
  ) as fraud_score, -- Exponential decay over 30 days
  COUNT(*) as signal_count,
  MAX(detected_at) as last_signal_at
FROM fraud_signals
WHERE NOT reviewed OR reviewed IS NULL -- Only count unreviewed signals
GROUP BY user_id, company_id;

COMMENT ON VIEW user_fraud_scores IS 'Aggregated fraud scores with exponential decay (30-day half-life)';

-- Function: Calculate fraud score for a user/company
CREATE OR REPLACE FUNCTION calculate_fraud_score(
  target_user_id UUID DEFAULT NULL,
  target_company_id UUID DEFAULT NULL
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2);
BEGIN
  SELECT COALESCE(fraud_score, 0)
  INTO score
  FROM user_fraud_scores
  WHERE (target_user_id IS NULL OR user_id = target_user_id)
    AND (target_company_id IS NULL OR company_id = target_company_id);
  
  RETURN COALESCE(score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-suspend high-risk users
CREATE OR REPLACE FUNCTION auto_suspend_fraudsters()
RETURNS TRIGGER AS $$
DECLARE
  current_fraud_score DECIMAL(5,2);
  affected_user_id UUID;
  affected_company_id UUID;
BEGIN
  -- Get user/company from the new fraud signal
  affected_user_id := NEW.user_id;
  affected_company_id := NEW.company_id;
  
  -- Calculate current fraud score
  SELECT COALESCE(fraud_score, 0)
  INTO current_fraud_score
  FROM user_fraud_scores
  WHERE (affected_user_id IS NULL OR user_id = affected_user_id)
    AND (affected_company_id IS NULL OR company_id = affected_company_id);
  
  -- Auto-suspend if score exceeds threshold (0.7)
  IF current_fraud_score > 0.7 THEN
    -- Suspend user account
    IF affected_user_id IS NOT NULL THEN
      UPDATE auth.users
      SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{suspended}',
        'true'::jsonb
      )
      WHERE id = affected_user_id;
    END IF;
    
    -- Suspend company
    IF affected_company_id IS NOT NULL THEN
      UPDATE companies
      SET 
        status = 'suspended',
        suspension_reason = 'Automated fraud detection: fraud score ' || current_fraud_score::TEXT,
        suspended_at = NOW()
      WHERE id = affected_company_id;
    END IF;
    
    -- Log suspension event
    INSERT INTO activity_logs (
      user_id,
      company_id,
      action,
      metadata,
      severity
    ) VALUES (
      affected_user_id,
      affected_company_id,
      'auto_suspension_fraud_score',
      jsonb_build_object(
        'fraud_score', current_fraud_score,
        'signal_type', NEW.signal_type,
        'signal_id', NEW.id
      ),
      'critical'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-suspend on fraud signal insertion
CREATE TRIGGER trigger_auto_suspend_fraudsters
  AFTER INSERT ON fraud_signals
  FOR EACH ROW
  EXECUTE FUNCTION auto_suspend_fraudsters();

-- Function: Log fraud signal (callable from application)
CREATE OR REPLACE FUNCTION log_fraud_signal(
  target_user_id UUID,
  target_company_id UUID,
  signal_type_param VARCHAR(50),
  severity_param DECIMAL(3,2),
  description_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  signal_id UUID;
BEGIN
  INSERT INTO fraud_signals (
    user_id,
    company_id,
    signal_type,
    severity,
    description,
    metadata
  ) VALUES (
    target_user_id,
    target_company_id,
    signal_type_param,
    severity_param,
    description_param,
    metadata_param
  )
  RETURNING id INTO signal_id;
  
  RETURN signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins and fraud reviewers can view fraud signals
CREATE POLICY "Admins can view all fraud signals"
  ON fraud_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'compliance_officer')
    )
  );

-- RLS Policy: System can insert fraud signals
CREATE POLICY "System can insert fraud signals"
  ON fraud_signals FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Compliance officers can update fraud signals (review)
CREATE POLICY "Compliance officers can review fraud signals"
  ON fraud_signals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'compliance_officer')
    )
  );

-- Add status and suspension columns to companies if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'status') THEN
    ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active' 
      CHECK (status IN ('active', 'suspended', 'banned', 'pending_review'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'suspension_reason') THEN
    ALTER TABLE companies ADD COLUMN suspension_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'companies' AND column_name = 'suspended_at') THEN
    ALTER TABLE companies ADD COLUMN suspended_at TIMESTAMP;
  END IF;
END $$;

-- Sample fraud signal types for reference
COMMENT ON COLUMN fraud_signals.signal_type IS 'Types: velocity_anomaly, fake_proof, chargeback, collusion, stolen_card, suspicious_pattern, kyc_mismatch, gps_fraud';

-- Create fraud review dashboard view
CREATE OR REPLACE VIEW fraud_review_queue AS
SELECT 
  fs.id,
  fs.user_id,
  fs.company_id,
  fs.signal_type,
  fs.severity,
  fs.description,
  fs.detected_at,
  fs.reviewed,
  c.company_name,
  p.full_name as user_name,
  ufs.fraud_score,
  ufs.signal_count,
  CASE
    WHEN ufs.fraud_score > 0.7 THEN 'critical'
    WHEN ufs.fraud_score > 0.5 THEN 'high'
    WHEN ufs.fraud_score > 0.3 THEN 'medium'
    ELSE 'low'
  END as risk_level
FROM fraud_signals fs
LEFT JOIN companies c ON fs.company_id = c.id
LEFT JOIN profiles p ON fs.user_id = p.id
LEFT JOIN user_fraud_scores ufs ON fs.user_id = ufs.user_id OR fs.company_id = ufs.company_id
WHERE NOT fs.reviewed
ORDER BY fs.severity DESC, fs.detected_at DESC;

COMMENT ON VIEW fraud_review_queue IS 'Unreviewed fraud signals prioritized by severity for compliance team';
