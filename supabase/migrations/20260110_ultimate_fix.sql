-- =====================================================
-- ULTIMATE FIX: All Database & RLS Issues
-- Date: 2026-01-10
-- =====================================================

-- ============================================================
-- PART 1: FIX COMPANIES TABLE RLS POLICIES
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to create companies" ON companies;
DROP POLICY IF EXISTS "Users can view companies they are members of" ON companies;
DROP POLICY IF EXISTS "Company owners can update their companies" ON companies;
DROP POLICY IF EXISTS "Anyone authenticated can create companies" ON companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Owners can update companies" ON companies;

-- Permissive policies for companies
CREATE POLICY "authenticated_users_can_insert_companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_view_companies"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_users_can_update_own_companies"
ON companies FOR UPDATE
TO authenticated
USING (
  owner_email = auth.jwt() ->> 'email'
  OR id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- ============================================================
-- PART 2: FIX PRODUCTS TABLE RLS POLICIES
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Company owners can manage their products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
DROP POLICY IF EXISTS "Users can update their company products" ON products;

-- Make company_id nullable so products can exist without company
ALTER TABLE products ALTER COLUMN company_id DROP NOT NULL;

-- Permissive policies for products
CREATE POLICY "anyone_can_view_products"
ON products FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "authenticated_users_can_insert_products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_products"
ON products FOR UPDATE
TO authenticated
USING (true);

-- ============================================================
-- PART 3: FIX CATEGORIES TABLE
-- ============================================================

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "anyone_can_view_categories"
ON categories FOR SELECT
TO authenticated, anon
USING (true);

-- Insert default categories if none exist
INSERT INTO categories (name, slug, description)
SELECT * FROM (VALUES
    ('Electronics', 'electronics', 'Electronic devices and accessories'),
    ('Agriculture', 'agriculture', 'Agricultural products and equipment'),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories'),
    ('Food & Beverage', 'food-beverage', 'Food products and beverages'),
    ('Construction', 'construction', 'Construction materials and tools'),
    ('Machinery', 'machinery', 'Industrial machinery and equipment'),
    ('Textiles', 'textiles', 'Fabrics and textile products'),
    ('Healthcare', 'healthcare', 'Medical supplies and healthcare products'),
    ('Automotive', 'automotive', 'Automotive parts and accessories'),
    ('Beauty & Cosmetics', 'beauty-cosmetics', 'Beauty and cosmetic products'),
    ('Home & Garden', 'home-garden', 'Home and garden products'),
    ('Office Supplies', 'office-supplies', 'Office equipment and supplies'),
    ('Sports & Recreation', 'sports-recreation', 'Sports and recreational products'),
    ('Other', 'other', 'Other products')
) AS new_categories (name, slug, description)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- ============================================================
-- PART 4: FIX PRODUCT_IMAGES TABLE
-- ============================================================

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product images" ON product_images;

CREATE POLICY "anyone_can_view_product_images"
ON product_images FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "authenticated_users_can_insert_product_images"
ON product_images FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================
-- PART 5: FIX PROFILES TABLE
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "users_can_view_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_can_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "users_can_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================
-- PART 6: FIX NOTIFICATIONS TABLE
-- ============================================================

-- Already created, just ensure policies exist
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON notifications;

CREATE POLICY "users_can_view_own_notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON companies TO authenticated;
GRANT ALL ON products TO authenticated, anon;
GRANT ALL ON categories TO authenticated, anon;
GRANT ALL ON product_images TO authenticated, anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- ============================================================
-- PART 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_email ON companies(owner_email);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Ultimate fix completed successfully!';
END $$;
