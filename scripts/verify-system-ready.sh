#!/bin/bash

###############################################################################
# SYSTEM VERIFICATION SCRIPT
# Checks if everything is ready for universal user tracking
###############################################################################

echo "============================================"
echo "🔍 AFRIKONI SYSTEM VERIFICATION"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
passed=0
failed=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((passed++))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - File not found: $1"
        ((failed++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((passed++))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - Directory not found: $1"
        ((failed++))
        return 1
    fi
}

echo "📁 Checking Migration Files..."
echo "────────────────────────────────────────"
check_file "QUICK_COPY_MIGRATION_1.sql" "Migration 1: Profile Sync Trigger"
check_file "QUICK_COPY_MIGRATION_2.sql" "Migration 2: Universal User Visibility"
check_file "supabase/migrations/20241218_create_profile_sync_trigger.sql" "Main Profile Sync Migration"
check_file "supabase/migrations/20241218_universal_user_visibility.sql" "Main Universal Visibility Migration"
echo ""

echo "📚 Checking Documentation Files..."
echo "────────────────────────────────────────"
check_file "RUN_MIGRATIONS_NOW.md" "Quick Start Guide"
check_file "PROFILE_SYNC_FIX.md" "Profile Sync Documentation"
check_file "UNIVERSAL_USER_TRACKING.md" "Universal Tracking Documentation"
check_file "USER_REGISTRATION_TRACKING_FIX.md" "Registration Tracking Fix"
check_file "RISK_MANAGEMENT_SYSTEM.md" "Risk Management Documentation"
echo ""

echo "⚛️  Checking React Components..."
echo "────────────────────────────────────────"
check_file "src/pages/dashboard/risk.jsx" "Risk Management Dashboard"
check_file "src/hooks/useRealTimeData.js" "Real-time Data Hook"
check_file "src/services/riskMonitoring.js" "Risk Monitoring Service"
check_file "src/components/notificationbell.jsx" "Notification Bell Component"
echo ""

echo "🗂️  Checking Directory Structure..."
echo "────────────────────────────────────────"
check_dir "supabase" "Supabase directory"
check_dir "supabase/migrations" "Migrations directory"
check_dir "supabase/manual_fixes" "Manual fixes directory"
check_dir "src/pages/dashboard" "Dashboard pages"
check_dir "src/hooks" "React hooks"
check_dir "src/services" "Services"
echo ""

echo "🔧 Checking Node Modules..."
echo "────────────────────────────────────────"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules directory exists"
    ((passed++))
    
    # Check key dependencies
    if [ -f "node_modules/react/package.json" ]; then
        echo -e "${GREEN}✅${NC} React installed"
        ((passed++))
    else
        echo -e "${RED}❌${NC} React not found"
        ((failed++))
    fi
    
    if [ -f "node_modules/i18next/package.json" ]; then
        echo -e "${GREEN}✅${NC} i18next installed"
        ((passed++))
    else
        echo -e "${YELLOW}⚠️${NC}  i18next not found (optional)"
    fi
else
    echo -e "${RED}❌${NC} node_modules not found - run npm install"
    ((failed++))
fi
echo ""

echo "📦 Checking Package Configuration..."
echo "────────────────────────────────────────"
check_file "package.json" "package.json"
check_file "vite.config.js" "Vite configuration"
check_file "tailwind.config.js" "Tailwind configuration"
echo ""

echo "🔐 Checking Git Status..."
echo "────────────────────────────────────────"
if command -v git &> /dev/null; then
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Git repository initialized"
        ((passed++))
        
        # Check if there are uncommitted changes
        if git diff-index --quiet HEAD --; then
            echo -e "${GREEN}✅${NC} No uncommitted changes"
            ((passed++))
        else
            echo -e "${YELLOW}⚠️${NC}  Uncommitted changes present"
        fi
        
        # Show last commit
        echo -e "${GREEN}ℹ️${NC}  Last commit: $(git log -1 --pretty=format:'%h - %s')"
    else
        echo -e "${RED}❌${NC} Not a git repository"
        ((failed++))
    fi
else
    echo -e "${RED}❌${NC} Git not installed"
    ((failed++))
fi
echo ""

echo "🌐 Checking Development Server..."
echo "────────────────────────────────────────"
if lsof -Pi :5175 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Development server running on port 5175"
    ((passed++))
else
    echo -e "${YELLOW}⚠️${NC}  Development server not running (start with: npm run dev)"
fi
echo ""

echo "============================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================"
echo -e "${GREEN}Passed:${NC} $passed checks"
echo -e "${RED}Failed:${NC} $failed checks"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ SYSTEM READY!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Open Supabase Dashboard"
    echo "  2. Run QUICK_COPY_MIGRATION_1.sql"
    echo "  3. Run QUICK_COPY_MIGRATION_2.sql"
    echo "  4. Refresh dashboard"
    echo "  5. All users will be visible!"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  ISSUES FOUND${NC}"
    echo ""
    echo "Please fix the failed checks above before proceeding."
    echo ""
    exit 1
fi

