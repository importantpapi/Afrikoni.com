#!/bin/bash

# Apply Migration via Supabase CLI
# This script attempts to apply the migration using Supabase CLI

set -e

echo "🚀 Applying Migration via Supabase CLI"
echo "========================================"
echo ""

PROJECT_REF="qkeeufeiaphqylsnfhza"
MIGRATION_FILE="supabase/migrations/20250116000000_extend_quotes_table.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "✅ Migration file found"
echo "📋 Project reference: $PROJECT_REF"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Try to link project
echo "📋 Linking to project..."
if supabase link --project-ref "$PROJECT_REF" 2>&1 | grep -q "Linked\|already linked"; then
    echo "✅ Project linked"
else
    echo "⚠️  Link may require authentication"
    echo "   Run manually: supabase link --project-ref $PROJECT_REF"
fi

echo ""
echo "📋 Applying migration..."
echo ""

# Try to push migration
if supabase db push 2>&1; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Verifying..."
    npm run check-all
else
    echo ""
    echo "⚠️  CLI push failed or requires authentication"
    echo ""
    echo "📋 MANUAL APPLICATION REQUIRED:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF"
    echo "2. Navigate to: SQL Editor"
    echo "3. Click: New query"
    echo "4. Copy contents of: $MIGRATION_FILE"
    echo "5. Paste and click: Run"
    echo ""
    echo "Expected: 'Success. No rows returned.'"
    echo ""
    echo "After applying, run: npm run check-all"
fi

