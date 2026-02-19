-- ============================================================================
-- KYC/KYB TIERED VERIFICATION SYSTEM
-- Date: 2026-02-19
-- Purpose: Implement Layer 3 security - progressive verification with transaction limits
-- Implements: MASTER_PROMPT_2026 Section 5, Layer 3
-- ============================================================================

-- Add verification tier columns to users/profiles
DO $$ 
BEGIN
  -- Add verification_tier to profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'verification_tier') THEN
    ALTER TABLE profiles ADD COLUMN verification_tier INT DEFAULT 0 
      CHECK (verification_tier >= 0 AND verification_tier <= 3);
  END IF;
  
  -- Add ytd_trade_volume (year-to-date trade volume in cents/smallest currency unit)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'ytd_trade_volume') THEN
    ALTER TABLE profiles ADD COLUMN ytd_trade_volume BIGINT DEFAULT 0;
  END IF;
  
  -- Add last_tier_upgrade timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_tier_upgrade') THEN
    ALTER TABLE profiles ADD COLUMN last_tier_upgrade TIMESTAMP;
  END IF;
  
  -- Add verification documents JSONB (store document IDs and status)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'verification_documents') THEN
    ALTER TABLE profiles ADD COLUMN verification_documents JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Verification tiers reference table
CREATE TABLE IF NOT EXISTS verification_tiers (
  tier INT PRIMARY KEY CHECK (tier >= 0 AND tier <= 3),
  tier_name TEXT NOT NULL,
  annual_limit_cents BIGINT, -- NULL means unlimited
  required_documents TEXT[], -- Array of required document types
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert tier definitions
INSERT INTO verification_tiers (tier, tier_name, annual_limit_cents, required_documents, description)
VALUES 
  (0, 'Basic', 100000000, ARRAY['phone_verification'], 'Phone number only. Limit: €1,000/year'),
  (1, 'Verified', 1000000000, ARRAY['photo_id', 'selfie'], 'Photo ID + Selfie. Limit: €10,000/year'),
  (2, 'Business', 10000000000, ARRAY['business_license', 'tax_id'], 'Business license + Tax ID. Limit: €100,000/year'),
  (3, 'Enterprise', NULL, ARRAY['bank_statements', 'references', 'enhanced_due_diligence'], 'Enhanced verification. Unlimited')
ON CONFLICT (tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  annual_limit_cents = EXCLUDED.annual_limit_cents,
  required_documents = EXCLUDED.required_documents,
  description = EXCLUDED.description;

-- Function: Check if user can execute trade based on tier limits
CREATE OR REPLACE FUNCTION check_trade_limits(
  user_id_param UUID,
  trade_amount_cents BIGINT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_tier INT,
  current_volume BIGINT,
  tier_limit BIGINT,
  remaining_limit BIGINT,
  next_tier INT,
  upgrade_message TEXT
) AS $$
DECLARE
  user_tier INT;
  user_volume BIGINT;
  tier_limit_value BIGINT;
  remaining BIGINT;
BEGIN
  -- Get user's current tier and volume
  SELECT verification_tier, ytd_trade_volume
  INTO user_tier, user_volume
  FROM profiles
  WHERE id = user_id_param;
  
  -- Get tier limit
  SELECT annual_limit_cents
  INTO tier_limit_value
  FROM verification_tiers
  WHERE tier = user_tier;
  
  -- Calculate remaining limit
  IF tier_limit_value IS NULL THEN
    -- Unlimited (Tier 3)
    remaining := NULL;
  ELSE
    remaining := tier_limit_value - user_volume;
  END IF;
  
  -- Check if trade is allowed
  IF tier_limit_value IS NULL OR trade_amount_cents <= remaining THEN
    -- Trade allowed
    RETURN QUERY SELECT 
      TRUE,
      user_tier,
      user_volume,
      tier_limit_value,
      remaining,
      NULL::INT,
      NULL::TEXT;
  ELSE
    -- Trade exceeds limit, suggest upgrade
    RETURN QUERY SELECT 
      FALSE,
      user_tier,
      user_volume,
      tier_limit_value,
      remaining,
      user_tier + 1,
      'Upgrade to Tier ' || (user_tier + 1)::TEXT || ' to unlock this trade. Verify now?';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update YTD trade volume after successful trade
CREATE OR REPLACE FUNCTION update_ytd_trade_volume()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when trade status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update buyer's volume
    IF NEW.buyer_id IS NOT NULL THEN
      UPDATE profiles
      SET ytd_trade_volume = ytd_trade_volume + NEW.total_amount
      WHERE id = NEW.buyer_id;
    END IF;
    
    -- Update seller's volume
    IF NEW.supplier_id IS NOT NULL THEN
      UPDATE profiles
      SET ytd_trade_volume = ytd_trade_volume + NEW.total_amount
      WHERE id = NEW.supplier_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update YTD volume on trade completion
CREATE TRIGGER trigger_update_ytd_trade_volume
  AFTER UPDATE ON trades
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_ytd_trade_volume();

-- Function: Get required documents for tier upgrade
CREATE OR REPLACE FUNCTION get_tier_requirements(target_tier INT)
RETURNS TABLE (
  tier INT,
  tier_name TEXT,
  required_documents TEXT[],
  annual_limit_cents BIGINT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vt.tier,
    vt.tier_name,
    vt.required_documents,
    vt.annual_limit_cents,
    vt.description
  FROM verification_tiers vt
  WHERE vt.tier = target_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Request tier upgrade
CREATE OR REPLACE FUNCTION request_tier_upgrade(
  user_id_param UUID,
  target_tier_param INT,
  submitted_documents JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  pending_review BOOLEAN
) AS $$
DECLARE
  current_tier INT;
  required_docs TEXT[];
  submitted_doc_types TEXT[];
BEGIN
  -- Get current tier
  SELECT verification_tier INTO current_tier
  FROM profiles WHERE id = user_id_param;
  
  -- Validate target tier
  IF target_tier_param <= current_tier THEN
    RETURN QUERY SELECT FALSE, 'Target tier must be higher than current tier'::TEXT, FALSE;
    RETURN;
  END IF;
  
  IF target_tier_param > 3 THEN
    RETURN QUERY SELECT FALSE, 'Invalid tier (max is 3)'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Get required documents for target tier
  SELECT required_documents INTO required_docs
  FROM verification_tiers WHERE tier = target_tier_param;
  
  -- Extract submitted document types from JSONB
  SELECT ARRAY_AGG(key) INTO submitted_doc_types
  FROM jsonb_object_keys(submitted_documents) AS key;
  
  -- Check if all required documents are submitted
  IF NOT (required_docs <@ submitted_doc_types) THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Missing required documents: ' || array_to_string(
        ARRAY(SELECT unnest(required_docs) EXCEPT SELECT unnest(submitted_doc_types)),
        ', '
      ),
      FALSE;
    RETURN;
  END IF;
  
  -- Update verification documents
  UPDATE profiles
  SET verification_documents = submitted_documents
  WHERE id = user_id_param;
  
  -- Create verification request (for manual review)
  INSERT INTO activity_logs (
    user_id,
    action,
    metadata,
    severity
  ) VALUES (
    user_id_param,
    'tier_upgrade_requested',
    jsonb_build_object(
      'current_tier', current_tier,
      'target_tier', target_tier_param,
      'submitted_documents', submitted_documents
    ),
    'info'
  );
  
  RETURN QUERY SELECT TRUE, 'Verification submitted for review'::TEXT, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve tier upgrade (admin only)
CREATE OR REPLACE FUNCTION approve_tier_upgrade(
  user_id_param UUID,
  new_tier INT,
  approved_by_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user tier
  UPDATE profiles
  SET 
    verification_tier = new_tier,
    last_tier_upgrade = NOW()
  WHERE id = user_id_param;
  
  -- Log approval
  INSERT INTO activity_logs (
    user_id,
    action,
    metadata,
    severity
  ) VALUES (
    user_id_param,
    'tier_upgrade_approved',
    jsonb_build_object(
      'new_tier', new_tier,
      'approved_by', approved_by_param
    ),
    'info'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_verification_tier ON profiles(verification_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_ytd_volume ON profiles(ytd_trade_volume);

-- Comments
COMMENT ON COLUMN profiles.verification_tier IS 'KYC tier: 0=Basic (€1K), 1=Verified (€10K), 2=Business (€100K), 3=Enterprise (Unlimited)';
COMMENT ON COLUMN profiles.ytd_trade_volume IS 'Year-to-date trade volume in cents (resets annually)';
COMMENT ON TABLE verification_tiers IS 'KYC tier definitions with limits and required documents';

-- View: Users pending tier upgrade review
CREATE OR REPLACE VIEW tier_upgrade_requests AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.verification_tier as current_tier,
  p.verification_documents,
  p.ytd_trade_volume,
  al.metadata->>'target_tier' as requested_tier,
  al.created_at as requested_at
FROM profiles p
JOIN activity_logs al ON p.id = al.user_id
WHERE al.action = 'tier_upgrade_requested'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs al2
    WHERE al2.user_id = p.id
      AND al2.action = 'tier_upgrade_approved'
      AND al2.created_at > al.created_at
  )
ORDER BY al.created_at DESC;

COMMENT ON VIEW tier_upgrade_requests IS 'Pending tier upgrade requests for admin review';
