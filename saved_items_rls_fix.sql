-- AFRIKONI TRADE OS - SAVED ITEMS RLS FIX
-- This fixes the "saved is not working" issue
-- RUN THIS IN SUPABASE SQL EDITOR

-- Enable RLS on saved_items table
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own saved items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'saved_items'
        AND policyname = 'Users can view their own saved items'
    ) THEN
        CREATE POLICY "Users can view their own saved items"
        ON saved_items FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Allow authenticated users to insert their own saved items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'saved_items'
        AND policyname = 'Users can insert their own saved items'
    ) THEN
        CREATE POLICY "Users can insert their own saved items"
        ON saved_items FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Allow authenticated users to delete their own saved items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'saved_items'
        AND policyname = 'Users can delete their own saved items'
    ) THEN
        CREATE POLICY "Users can delete their own saved items"
        ON saved_items FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'saved_items'
ORDER BY policyname;
