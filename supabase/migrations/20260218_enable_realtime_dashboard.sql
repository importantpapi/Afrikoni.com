-- ============================================================================
-- REALTIME REPLICA IDENTITY & PUBLICATION FIX
-- Date: 2026-02-18
-- Purpose: Enable Realtime for all Dashboard tables to fix "Hard Refresh" bug.
-- ============================================================================

-- 1. Ensure Replica Identity is FULL (best practice for realtime to receive old record) or DEFAULT
-- We use DEFAULT usually, but let's just make sure they are in the publication.

-- 2. Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS rfqs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS products;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS trades;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS escrows;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS payments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS companies;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS company_capabilities;

-- 3. Verify replication is enabled (implicitly done by adding to publication)
