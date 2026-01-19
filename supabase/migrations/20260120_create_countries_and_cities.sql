-- =====================================================
-- Create Countries and Cities Tables
-- Date: 2026-01-20
-- Purpose: Enable country → city selection in forms
-- =====================================================

-- Create countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE, -- ISO country code (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    state_code TEXT, -- Optional state/province code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, name) -- Prevent duplicate city names within same country
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON public.cities(country_id);
CREATE INDEX IF NOT EXISTS idx_countries_name ON public.countries(name);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to countries
CREATE POLICY "Allow public read access to countries" 
ON public.countries FOR SELECT 
USING (true);

-- Allow public read access to cities
CREATE POLICY "Allow public read access to cities" 
ON public.cities FOR SELECT 
USING (true);

-- Insert African countries (based on AFRICAN_COUNTRIES constant)
INSERT INTO public.countries (name) VALUES
    ('Algeria'), ('Angola'), ('Benin'), ('Botswana'), ('Burkina Faso'), ('Burundi'),
    ('Cameroon'), ('Cape Verde'), ('Central African Republic'), ('Chad'), ('Comoros'),
    ('Congo'), ('DR Congo'), ('Côte d''Ivoire'), ('Djibouti'), ('Egypt'),
    ('Equatorial Guinea'), ('Eritrea'), ('Eswatini'), ('Ethiopia'), ('Gabon'),
    ('Gambia'), ('Ghana'), ('Guinea'), ('Guinea-Bissau'), ('Kenya'),
    ('Lesotho'), ('Liberia'), ('Libya'), ('Madagascar'), ('Malawi'),
    ('Mali'), ('Mauritania'), ('Mauritius'), ('Morocco'), ('Mozambique'),
    ('Namibia'), ('Niger'), ('Nigeria'), ('Rwanda'), ('São Tomé and Príncipe'),
    ('Senegal'), ('Seychelles'), ('Sierra Leone'), ('Somalia'), ('South Africa'),
    ('South Sudan'), ('Sudan'), ('Tanzania'), ('Togo'), ('Tunisia'),
    ('Uganda'), ('Zambia'), ('Zimbabwe')
ON CONFLICT (name) DO NOTHING;

-- Add unit_type columns to products and rfqs if they don't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_type TEXT;
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS unit_type TEXT;

-- Add comment for documentation
COMMENT ON TABLE public.countries IS 'List of African countries for location selection';
COMMENT ON TABLE public.cities IS 'Cities linked to countries for location selection in forms';
COMMENT ON COLUMN public.products.unit_type IS 'Unit type for products (e.g., kg, grams, tons, pieces)';
COMMENT ON COLUMN public.rfqs.unit_type IS 'Unit type for RFQs (e.g., kg, grams, tons, pieces)';
