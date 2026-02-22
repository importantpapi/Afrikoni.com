-- ============================================================================
-- AfCFTA HS Catalog + Rulebook Foundation
-- Date: 2026-02-26
-- Purpose: Move AfCFTA logic away from tiny hardcoded sets into canonical tables.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.hs_code_catalog (
  hs_code TEXT PRIMARY KEY,
  hs_level INTEGER NOT NULL DEFAULT 4,
  description TEXT NOT NULL,
  sector TEXT,
  default_rule_type TEXT CHECK (default_rule_type IN ('WO', 'CTH', 'VA')),
  requires_origin_certificate BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.afcfta_rulebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code TEXT NOT NULL REFERENCES public.hs_code_catalog(hs_code) ON DELETE CASCADE,
  origin_corridor TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('WO', 'CTH', 'VA')),
  min_value_added_percent NUMERIC(5,2),
  preferential_tariff_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  standard_tariff_percent NUMERIC(5,2) NOT NULL DEFAULT 12.5,
  legal_basis TEXT,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'staging', 'deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_afcfta_rulebook_hs_code ON public.afcfta_rulebook(hs_code);
CREATE INDEX IF NOT EXISTS idx_afcfta_rulebook_corridor ON public.afcfta_rulebook(origin_corridor);
CREATE INDEX IF NOT EXISTS idx_afcfta_rulebook_status ON public.afcfta_rulebook(status);

INSERT INTO public.hs_code_catalog (hs_code, hs_level, description, sector, default_rule_type, requires_origin_certificate) VALUES
  ('0701', 4, 'Potatoes, fresh or chilled', 'Agriculture', 'WO', true),
  ('0801', 4, 'Coconuts, Brazil nuts and cashew nuts', 'Agriculture', 'WO', true),
  ('0901', 4, 'Coffee, whether or not roasted', 'Agriculture', 'WO', true),
  ('1006', 4, 'Rice', 'Agriculture', 'WO', true),
  ('1207', 4, 'Other oil seeds and oleaginous fruits', 'Agriculture', 'WO', true),
  ('1511', 4, 'Palm oil and fractions', 'Agri Processing', 'VA', true),
  ('1701', 4, 'Cane or beet sugar and chemically pure sucrose', 'Agri Processing', 'VA', true),
  ('1801', 4, 'Cocoa beans, whole or broken', 'Agriculture', 'WO', true),
  ('2008', 4, 'Prepared/preserved fruit and nuts', 'Food Processing', 'VA', true),
  ('5201', 4, 'Cotton, not carded or combed', 'Textiles', 'WO', true),
  ('6101', 4, 'Mens or boys overcoats, knitted or crocheted', 'Textiles', 'CTH', true),
  ('6203', 4, 'Mens or boys suits and ensembles', 'Textiles', 'CTH', true),
  ('6403', 4, 'Footwear with outer soles of rubber/plastics/leather', 'Manufacturing', 'CTH', true),
  ('7201', 4, 'Pig iron and spiegeleisen', 'Metals', 'VA', true),
  ('7214', 4, 'Other bars and rods of iron or non-alloy steel', 'Metals', 'VA', true),
  ('7308', 4, 'Structures and parts of structures, of iron or steel', 'Metals', 'VA', true),
  ('7403', 4, 'Refined copper and copper alloys, unwrought', 'Metals', 'VA', true),
  ('7601', 4, 'Aluminium, unwrought', 'Metals', 'VA', true),
  ('8471', 4, 'Automatic data processing machines and units', 'Electronics', 'CTH', true)
ON CONFLICT (hs_code) DO NOTHING;

INSERT INTO public.afcfta_rulebook (
  hs_code,
  origin_corridor,
  rule_type,
  min_value_added_percent,
  preferential_tariff_percent,
  standard_tariff_percent,
  legal_basis,
  required_documents,
  status
) VALUES
  ('0901', 'NG-GH', 'WO', NULL, 0, 12.5, 'AfCFTA Annex 2 - Agricultural Origin', '["Certificate of Origin","Customs Declaration A1"]'::jsonb, 'active'),
  ('1801', 'GH-CI', 'WO', NULL, 0, 12.5, 'AfCFTA Annex 2 - Agricultural Origin', '["Certificate of Origin","Export Permit"]'::jsonb, 'active'),
  ('6101', 'KE-RW', 'CTH', NULL, 0, 12.5, 'AfCFTA Annex 2 - Textiles CTH', '["Certificate of Origin","Manufacturing Declaration"]'::jsonb, 'active'),
  ('6203', 'MA-SN', 'CTH', NULL, 0, 12.5, 'AfCFTA Annex 2 - Textiles CTH', '["Certificate of Origin","Manufacturing Declaration"]'::jsonb, 'staging'),
  ('7201', 'ZA-EG', 'VA', 35, 0, 12.5, 'AfCFTA Annex 2 - Value Added Rule', '["Certificate of Origin","Value Breakdown Report"]'::jsonb, 'active'),
  ('7214', 'TZ-ZM', 'VA', 35, 0, 12.5, 'AfCFTA Annex 2 - Value Added Rule', '["Certificate of Origin","Value Breakdown Report"]'::jsonb, 'active'),
  ('8471', 'NG-KE', 'CTH', NULL, 0, 12.5, 'AfCFTA Annex 2 - Substantial Transformation', '["Certificate of Origin","Assembly Declaration","Commercial Invoice"]'::jsonb, 'staging')
ON CONFLICT DO NOTHING;

COMMIT;
