-- Create testimonials table for customer reviews
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT,
  company TEXT,
  location TEXT,
  review TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_logos table for client/partner logos
CREATE TABLE IF NOT EXISTS partner_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published, display_order);
CREATE INDEX IF NOT EXISTS idx_partner_logos_published ON partner_logos(published, display_order);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_logos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials (public read, admin write)
CREATE POLICY "testimonials_select_published" ON testimonials
  FOR SELECT
  USING (published = true);

CREATE POLICY "testimonials_admin_all" ON testimonials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for partner_logos (public read, admin write)
CREATE POLICY "partner_logos_select_published" ON partner_logos
  FOR SELECT
  USING (published = true);

CREATE POLICY "partner_logos_admin_all" ON partner_logos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_logos_updated_at
  BEFORE UPDATE ON partner_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

