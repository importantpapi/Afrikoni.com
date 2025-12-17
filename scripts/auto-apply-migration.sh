#!/bin/bash

# Automated Migration Application Script
# Attempts to apply migration using available methods

set -e

echo "🚀 Afrikoni RFQ Migration - Automated Application"
echo "=================================================="
echo ""

MIGRATION_FILE="supabase/migrations/20250116000000_extend_quotes_table.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "✅ Migration file found: $MIGRATION_FILE"
echo ""

# Method 1: Try Supabase CLI (if linked)
echo "📋 Method 1: Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "   ✅ Supabase CLI found"
    
    # Check if linked
    if supabase status &> /dev/null; then
        echo "   ✅ Project linked"
        echo ""
        echo "   Attempting to apply migration via CLI..."
        echo "   (This will push all migrations in supabase/migrations/)"
        echo ""
        read -p "   Continue? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            supabase db push
            echo ""
            echo "✅ Migration applied via CLI!"
            echo ""
            echo "📊 Verifying..."
            npm run verify-migration 2>/dev/null || echo "   Run 'npm run verify-migration' manually to verify"
            exit 0
        fi
    else
        echo "   ⚠️  Project not linked"
        echo "   To link: supabase link --project-ref YOUR_PROJECT_REF"
    fi
else
    echo "   ❌ Supabase CLI not found"
fi

echo ""
echo "📋 Method 2: Supabase Dashboard (Manual)"
echo "=========================================="
echo ""
echo "Since automated methods are not available, apply migration manually:"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your Afrikoni project"
echo "3. Navigate to: SQL Editor"
echo "4. Click: New query"
echo "5. Copy and paste the contents of:"
echo "   $MIGRATION_FILE"
echo "6. Click: Run"
echo ""
echo "Expected result: 'Success. No rows returned.'"
echo ""
echo "After applying, run verification:"
echo "   npm run verify-migration"
echo ""
echo "Or run SQL queries from: scripts/quick-verify.sql"
echo ""

