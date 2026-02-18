-- AFRIKONI TRADE OS - RLS SECURITY FIXES
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Fix overly permissive product_images INSERT policy
-- Users should only insert images for products belonging to their own company
DO $$
BEGIN
    -- Drop the overly permissive policy if it exists
    DROP POLICY IF EXISTS "Authenticated users can insert product images" ON product_images;

    -- Create a scoped policy: only allow inserts for products owned by user's company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_images'
        AND policyname = 'Users can insert images for their own products'
    ) THEN
        CREATE POLICY "Users can insert images for their own products"
        ON product_images FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM products p
                JOIN companies c ON p.company_id = c.id
                WHERE p.id = product_images.product_id
                AND c.owner_id = auth.uid()
            )
        );
    END IF;

    -- SELECT: product images are public (marketplace needs to display them)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_images'
        AND policyname = 'Product images are viewable by everyone'
    ) THEN
        CREATE POLICY "Product images are viewable by everyone"
        ON product_images FOR SELECT
        TO public
        USING (true);
    END IF;

    -- DELETE: only product owner can delete images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_images'
        AND policyname = 'Users can delete their own product images'
    ) THEN
        CREATE POLICY "Users can delete their own product images"
        ON product_images FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM products p
                JOIN companies c ON p.company_id = c.id
                WHERE p.id = product_images.product_id
                AND c.owner_id = auth.uid()
            )
        );
    END IF;

    ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
END $$;

-- 2. Ensure products RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. Category Visibility - categories are public (marketplace filter)
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

-- 4. Ensure login_attempts table exists for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by email and time window
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
ON login_attempts (email, attempted_at DESC);

-- RLS: anyone can insert (login attempts happen before auth), only admins can read
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'login_attempts'
        AND policyname = 'Anyone can insert login attempts'
    ) THEN
        CREATE POLICY "Anyone can insert login attempts"
        ON login_attempts FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'login_attempts'
        AND policyname = 'Service role can read login attempts'
    ) THEN
        CREATE POLICY "Service role can read login attempts"
        ON login_attempts FOR SELECT
        TO authenticated
        USING (email = current_setting('request.jwt.claims', true)::json->>'email');
    END IF;
END $$;
