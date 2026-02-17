-- AFRIKONI TRADE OS - RLS SECURITY FIXES
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Allow authenticated users to insert product images
-- This fixes the 403 Forbidden error during product creation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_images' 
        AND policyname = 'Authenticated users can insert product images'
    ) THEN
        CREATE POLICY "Authenticated users can insert product images" 
        ON product_images FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_images' 
        AND policyname = 'Authenticated users can select product images'
    ) THEN
        CREATE POLICY "Authenticated users can select product images" 
        ON product_images FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
END $$;

-- 2. Verify products table image visibility
-- This ensures that the marketplace (public) can see images stored in the JSONB column
-- Products are already visible via public policies, but ensure JSONB access is not restricted.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. Category Visibility
-- Ensure categories are readable by all for the marketplace
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Categories are viewable by everyone'
    ) THEN
        CREATE POLICY "Categories are viewable by everyone"
        ON categories FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;
