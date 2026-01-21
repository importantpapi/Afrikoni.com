#!/bin/bash

# Apply Kernel Backend Alignment Migrations
# This script applies the new Kernel-compliant migrations to remote Supabase

set -e

PROJECT_REF="qkeeufeiaphqylsnfhza"
MIGRATION1="supabase/migrations/20260121_optimize_subscriptions_rls.sql"
MIGRATION2="supabase/migrations/20260121_kernel_backend_final_alignment.sql"

echo "🚀 Applying Kernel Backend Alignment Migrations"
echo "=================================================="
echo ""

# Check if migration files exist
if [ ! -f "$MIGRATION1" ]; then
    echo "❌ Migration file not found: $MIGRATION1"
    exit 1
fi

if [ ! -f "$MIGRATION2" ]; then
    echo "❌ Migration file not found: $MIGRATION2"
    exit 1
fi

echo "✅ Migration files found"
echo "📋 Project reference: $PROJECT_REF"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install: npm install -g supabase"
    echo ""
    echo "📋 MANUAL APPLICATION REQUIRED:"
    echo "   See instructions below"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
    echo "✅ Project is linked"
    echo ""
    echo "📋 Attempting to push migrations..."
    echo ""
    
    # Try to push migrations
    if supabase db push --linked 2>&1; then
        echo ""
        echo "✅ Migrations applied successfully!"
        echo ""
        echo "📊 Verifying..."
        node scripts/verify-backend-kernel-compliance.js
        exit 0
    else
        echo ""
        echo "⚠️  CLI push failed"
        echo ""
    fi
else
    echo "⚠️  Project not linked"
    echo ""
    echo "📋 Linking to project..."
    echo "   Run: supabase link --project-ref $PROJECT_REF"
    echo ""
fi

# Manual application instructions
echo "📋 MANUAL APPLICATION REQUIRED"
echo "=========================================="
echo ""
echo "Since automated methods require authentication,"
echo "apply migrations manually via Supabase Dashboard:"
echo ""
echo "🔗 Direct Link to SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "📋 Supabase URL:"
echo "   $SUPABASE_URL"
echo ""
echo "📝 Migration 1: Optimize Subscriptions RLS"
echo "   File: $MIGRATION1"
echo "   Steps:"
echo "   1. Open SQL Editor (link above)"
echo "   2. Copy contents of: $MIGRATION1"
echo "   3. Paste into SQL Editor"
echo "   4. Click 'Run'"
echo "   5. Wait for: 'Success. No rows returned.'"
echo ""
echo "📝 Migration 2: Kernel Backend Final Alignment"
echo "   File: $MIGRATION2"
echo "   Steps:"
echo "   1. In same SQL Editor, click 'New query'"
echo "   2. Copy contents of: $MIGRATION2"
echo "   3. Paste into SQL Editor"
echo "   4. Click 'Run'"
echo "   5. Wait for: 'Success. No rows returned.'"
echo ""
echo "✅ After applying both migrations:"
echo "   Run: node scripts/verify-backend-kernel-compliance.js"
echo ""

exit 1
