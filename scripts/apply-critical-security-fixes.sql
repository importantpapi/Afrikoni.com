-- CRITICAL SECURITY FIXES - Apply Manually via Supabase Dashboard SQL Editor
-- ================================================================
-- DO NOT RUN ALL AT ONCE - Apply section by section
-- ================================================================

-- ================================================================
-- STEP 1: DROP DANGEROUS VIEWS (Run First)
-- ================================================================

DROP VIEW IF EXISTS fraud_review_queue CASCADE;
DROP VIEW IF EXISTS tier_upgrade_queue CASCADE;
DROP VIEW IF EXISTS user_fraud_scores CASCADE;


-- ================================================================
-- STEP 2: ENABLE RLS ON verification_tiers
-- ================================================================

ALTER TABLE verification_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_tiers_read ON verification_tiers;
CREATE POLICY verification_tiers_read ON verification_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS verification_tiers_admin_write ON verification_tiers;
CREATE POLICY verification_tiers_admin_write ON verification_tiers
    FOR ALL USING (
        (SELECT (auth.jwt()->>'is_admin')::boolean = true)
        OR (SELECT auth.role() = 'service_role')
    );


-- ================================================================
-- STEP 3: FIX PERMISSIVE POLICIES
-- ================================================================

-- Fix fraud_signals
DROP POLICY IF EXISTS "System can insert fraud signals" ON fraud_signals;
DROP POLICY IF EXISTS fraud_signals_secure_insert ON fraud_signals;

CREATE POLICY fraud_signals_secure_insert ON fraud_signals
    FOR INSERT WITH CHECK (
        (SELECT auth.role() = 'service_role')
        OR (
            user_id = (SELECT auth.uid()) 
            AND company_id = (SELECT company_id FROM profiles WHERE id = (SELECT auth.uid()))
        )
    );

-- Fix search_events
DROP POLICY IF EXISTS "Allow public to insert search events" ON search_events;
DROP POLICY IF EXISTS search_events_secure_insert ON search_events;

CREATE POLICY search_events_secure_insert ON search_events
    FOR INSERT WITH CHECK (
        (SELECT auth.role() = 'authenticated')
        OR (SELECT auth.role() = 'service_role')
    );


-- ================================================================
-- STEP 4: ADD SELLER TRADE UPDATE POLICY
-- ================================================================

DROP POLICY IF EXISTS trades_seller_update ON trades;

CREATE POLICY trades_seller_update ON trades
    FOR UPDATE USING (
        seller_company_id = (
            SELECT company_id FROM profiles WHERE id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        status IN ('production', 'pickup_scheduled', 'in_transit', 'delivered')
    );


-- ================================================================
-- STEP 5: CREATE CRITICAL INDEXES (Run these in batches)
-- ================================================================

-- Trades (HIGHEST PRIORITY)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_buyer_company ON trades(buyer_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_seller_company ON trades(seller_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_created_by ON trades(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- RFQs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_buyer_company ON rfqs(buyer_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_buyer_user ON rfqs(buyer_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at DESC);

-- Escrows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escrows_trade_id ON escrows(trade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escrows_buyer_company ON escrows(buyer_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escrows_seller_company ON escrows(seller_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escrows_status ON escrows(status);

-- Payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_trade_id ON payments(trade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_escrow_id ON payments(escrow_id);

-- Disputes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_trade_id ON disputes(trade_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Shipments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Notifications (high volume)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Activity Logs (high volume)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);

-- Products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Quotes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_rfq_id ON quotes(rfq_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_supplier_company_id ON quotes(supplier_company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Company & Profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_verification_tier ON profiles(verification_tier);

-- Fraud Signals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_signals_user_id ON fraud_signals(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_signals_company_id ON fraud_signals(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_signals_created_at ON fraud_signals(created_at DESC);

-- ================================================================
-- VERIFICATION QUERIES - Run after applying each step
-- ================================================================

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'verification_tiers';

-- Check indexes were created:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename;

-- Check policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
