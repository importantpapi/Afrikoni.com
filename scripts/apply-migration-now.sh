#!/bin/bash

# Direct Migration Application Script
# Attempts all possible methods to apply migration

set -e

PROJECT_REF="qkeeufeiaphqylsnfhza"
MIGRATION_FILE="supabase/migrations/20250116000000_extend_quotes_table.sql"

echo "🚀 Applying Migration - All Methods"
echo "===================================="
echo ""

# Method 1: Try Supabase CLI db push
echo "📋 Method 1: Supabase CLI db push"
if supabase db push 2>&1 | grep -q "Applied\|Success\|migration"; then
    echo "✅ Migration applied via CLI!"
    exit 0
else
    echo "⚠️  CLI push not successful"
fi

echo ""

# Method 2: Try direct SQL execution via psql if available
echo "📋 Method 2: Direct SQL execution"
if command -v psql &> /dev/null; then
    echo "   psql found, but connection string needed"
    echo "   Skipping (requires database password)"
else
    echo "   psql not available"
fi

echo ""

# Method 3: Provide manual instructions with direct link
echo "📋 Method 3: Manual Application (Required)"
echo "=========================================="
echo ""
echo "Since automated methods require additional authentication,"
echo "apply migration manually via Supabase Dashboard:"
echo ""
echo "🔗 Direct Link:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "📝 Steps:"
echo "   1. Click the link above (opens SQL Editor)"
echo "   2. Copy contents of: $MIGRATION_FILE"
echo "   3. Paste into SQL Editor"
echo "   4. Click 'Run'"
echo ""
echo "Expected: 'Success. No rows returned.'"
echo ""
echo "After applying, run: npm run check-all"
echo ""

exit 1

