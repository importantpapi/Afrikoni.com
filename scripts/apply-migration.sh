#!/bin/bash

# Migration Application Script
# Applies the quotes table extension migration

echo "🚀 Afrikoni RFQ System - Migration Runner"
echo "=========================================="
echo ""

MIGRATION_FILE="supabase/migrations/20250116000000_extend_quotes_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file found: $MIGRATION_FILE"
echo ""
echo "📝 To apply this migration, choose one of the following methods:"
echo ""
echo "METHOD 1: Supabase Dashboard (Recommended)"
echo "------------------------------------------"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Navigate to SQL Editor"
echo "4. Copy and paste the contents of: $MIGRATION_FILE"
echo "5. Click 'Run' to execute"
echo ""
echo "METHOD 2: Supabase CLI (If linked)"
echo "-----------------------------------"
echo "1. Ensure you're linked: supabase link --project-ref YOUR_PROJECT_REF"
echo "2. Run: supabase db push"
echo ""
echo "METHOD 3: Direct SQL Execution"
echo "-------------------------------"
echo "The migration SQL is ready in: $MIGRATION_FILE"
echo ""
echo "✅ Migration file is ready to apply!"
echo ""
echo "After applying, verify:"
echo "  - quotes table has 'incoterms' column (text)"
echo "  - quotes table has 'moq' column (integer)"
echo "  - quotes.status supports 'quote_submitted'"
echo "  - Trigger prevents editing submitted quotes"
echo ""

