-- ============================================================================
-- CORRIDOR INTELLIGENCE - Database Schema
-- ============================================================================
-- 
-- Tables for storing corridor data, user reports, and health scores
--

-- Trade corridors table
CREATE TABLE IF NOT EXISTS trade_corridors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  product TEXT NOT NULL,
  
  -- Geographic coordinates
  origin_lat DECIMAL(10, 8),
  origin_lon DECIMAL(11, 8),
  dest_lat DECIMAL(10, 8),
  dest_lon DECIMAL(11, 8),
  
  -- Current metrics (JSON for flexibility)
  pricing_data JSONB,
  transit_time_data JSONB,
  congestion_data JSONB,
  customs_delay_data JSONB,
  fx_volatility_data JSONB,
  weather_risk_data JSONB,
  
  -- Health scores
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_breakdown JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Historical performance
  avg_transit_time DECIMAL(5, 2),
  on_time_delivery INTEGER CHECK (on_time_delivery >= 0 AND on_time_delivery <= 100),
  active_traders INTEGER DEFAULT 0,
  monthly_volume DECIMAL(12, 2),
  
  -- Compliance
  compliance TEXT[],
  required_documents TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_corridor UNIQUE (origin, destination, product)
);

-- User-submitted corridor reports (crowdsourced data)
CREATE TABLE IF NOT EXISTS corridor_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corridor_id TEXT NOT NULL REFERENCES trade_corridors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Report details
  report_type TEXT NOT NULL CHECK (report_type IN ('delay', 'congestion', 'customs', 'weather', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  location TEXT,
  
  -- Optional media
  photo_url TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corridor alerts for Control Plane
CREATE TABLE IF NOT EXISTS corridor_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corridor_id TEXT NOT NULL REFERENCES trade_corridors(id) ON DELETE CASCADE,
  
  -- Alert details
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  type TEXT NOT NULL CHECK (type IN ('congestion', 'delay', 'weather', 'customs', 'fx')),
  message TEXT NOT NULL,
  description TEXT,
  action_required BOOLEAN DEFAULT FALSE,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company-specific corridor tracking
CREATE TABLE IF NOT EXISTS company_corridors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  corridor_id TEXT NOT NULL REFERENCES trade_corridors(id) ON DELETE CASCADE,
  
  -- Company-specific metrics
  total_trades INTEGER DEFAULT 0,
  avg_price DECIMAL(12, 2),
  last_trade_date TIMESTAMPTZ,
  
  -- Preferences
  is_favorite BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_corridor UNIQUE (company_id, corridor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_corridors_origin ON trade_corridors(origin);
CREATE INDEX IF NOT EXISTS idx_corridors_destination ON trade_corridors(destination);
CREATE INDEX IF NOT EXISTS idx_corridors_product ON trade_corridors(product);
CREATE INDEX IF NOT EXISTS idx_corridors_health_score ON trade_corridors(health_score);
CREATE INDEX IF NOT EXISTS idx_corridors_risk_level ON trade_corridors(risk_level);

CREATE INDEX IF NOT EXISTS idx_corridor_reports_corridor_id ON corridor_reports(corridor_id);
CREATE INDEX IF NOT EXISTS idx_corridor_reports_user_id ON corridor_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_corridor_reports_company_id ON corridor_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_corridor_reports_verified ON corridor_reports(verified);
CREATE INDEX IF NOT EXISTS idx_corridor_reports_created_at ON corridor_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_corridor_alerts_corridor_id ON corridor_alerts(corridor_id);
CREATE INDEX IF NOT EXISTS idx_corridor_alerts_severity ON corridor_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_corridor_alerts_resolved_at ON corridor_alerts(resolved_at);

CREATE INDEX IF NOT EXISTS idx_company_corridors_company_id ON company_corridors(company_id);
CREATE INDEX IF NOT EXISTS idx_company_corridors_corridor_id ON company_corridors(corridor_id);
CREATE INDEX IF NOT EXISTS idx_company_corridors_is_favorite ON company_corridors(is_favorite);

-- Row Level Security (RLS) Policies

-- trade_corridors: Public read, admin write
ALTER TABLE trade_corridors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view corridors"
  ON trade_corridors FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert corridors"
  ON trade_corridors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update corridors"
  ON trade_corridors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- corridor_reports: Users can create, admins can verify
ALTER TABLE corridor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reports"
  ON corridor_reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON corridor_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reports"
  ON corridor_reports FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can verify reports"
  ON corridor_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- corridor_alerts: Public read, system/admin write
ALTER TABLE corridor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view alerts"
  ON corridor_alerts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage alerts"
  ON corridor_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- company_corridors: Company members can view/edit their own
ALTER TABLE company_corridors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company corridors"
  ON company_corridors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = company_corridors.company_id
    )
  );

CREATE POLICY "Users can manage their company corridors"
  ON company_corridors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = company_corridors.company_id
    )
  );

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_corridor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trade_corridors_updated_at
  BEFORE UPDATE ON trade_corridors
  FOR EACH ROW
  EXECUTE FUNCTION update_corridor_updated_at();

CREATE TRIGGER update_corridor_reports_updated_at
  BEFORE UPDATE ON corridor_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_corridor_updated_at();

CREATE TRIGGER update_corridor_alerts_updated_at
  BEFORE UPDATE ON corridor_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_corridor_updated_at();

CREATE TRIGGER update_company_corridors_updated_at
  BEFORE UPDATE ON company_corridors
  FOR EACH ROW
  EXECUTE FUNCTION update_corridor_updated_at();

-- Seed data: Cocoa corridor (Côte d'Ivoire → France)
INSERT INTO trade_corridors (
  id,
  name,
  origin,
  destination,
  product,
  origin_lat,
  origin_lon,
  dest_lat,
  dest_lon,
  health_score,
  risk_level,
  avg_transit_time,
  on_time_delivery,
  active_traders,
  monthly_volume,
  compliance
) VALUES (
  'CI-FR-COCOA',
  'Cocoa: Côte d''Ivoire → France',
  'Abidjan',
  'Le Havre',
  'Cocoa',
  5.3600,
  -4.0083,
  49.4944,
  0.1079,
  75,
  'medium',
  18,
  75,
  47,
  12500,
  ARRAY['AfCFTA', 'EU Organic', 'Fair Trade']
) ON CONFLICT (origin, destination, product) DO NOTHING;
