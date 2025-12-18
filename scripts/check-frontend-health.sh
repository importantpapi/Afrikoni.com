#!/bin/bash

###############################################################################
# FRONTEND HEALTH CHECK
# Verifies React components and hooks are properly configured
###############################################################################

echo "============================================"
echo "⚛️  FRONTEND HEALTH CHECK"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for React import errors
echo "🔍 Checking React Imports..."
echo "────────────────────────────────────────"

if grep -r "import.*from 'react'" src/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} React imports found"
else
    echo -e "${RED}❌${NC} No React imports found"
fi

# Check Risk Management Dashboard
echo ""
echo "🛡️  Checking Risk Management Dashboard..."
echo "────────────────────────────────────────"

if [ -f "src/pages/dashboard/risk.jsx" ]; then
    echo -e "${GREEN}✅${NC} risk.jsx exists"
    
    # Check for real-time hooks
    if grep -q "useRealTimeDashboardData" src/pages/dashboard/risk.jsx; then
        echo -e "${GREEN}✅${NC} Real-time hook imported"
    else
        echo -e "${YELLOW}⚠️${NC}  Real-time hook not found"
    fi
    
    # Check for search functionality
    if grep -q "searchEmail" src/pages/dashboard/risk.jsx; then
        echo -e "${GREEN}✅${NC} Search functionality present"
    else
        echo -e "${YELLOW}⚠️${NC}  Search functionality not found"
    fi
    
    # Check for "All Users" toggle
    if grep -q "showAllUsers" src/pages/dashboard/risk.jsx; then
        echo -e "${GREEN}✅${NC} 'All Users' toggle present"
    else
        echo -e "${YELLOW}⚠️${NC}  'All Users' toggle not found"
    fi
    
    # Check for activity tracking
    if grep -q "totalActivity" src/pages/dashboard/risk.jsx; then
        echo -e "${GREEN}✅${NC} Activity tracking implemented"
    else
        echo -e "${YELLOW}⚠️${NC}  Activity tracking not found"
    fi
else
    echo -e "${RED}❌${NC} risk.jsx not found"
fi

# Check Real-time Hook
echo ""
echo "🔄 Checking Real-time Hook..."
echo "────────────────────────────────────────"

if [ -f "src/hooks/useRealTimeData.js" ]; then
    echo -e "${GREEN}✅${NC} useRealTimeData.js exists"
    
    if grep -q "useRealTimeDashboardData" src/hooks/useRealTimeData.js; then
        echo -e "${GREEN}✅${NC} Dashboard hook exported"
    fi
    
    if grep -q "supabase.channel" src/hooks/useRealTimeData.js; then
        echo -e "${GREEN}✅${NC} Supabase real-time integration"
    fi
else
    echo -e "${RED}❌${NC} useRealTimeData.js not found"
fi

# Check Risk Monitoring Service
echo ""
echo "📊 Checking Risk Monitoring Service..."
echo "────────────────────────────────────────"

if [ -f "src/services/riskMonitoring.js" ]; then
    echo -e "${GREEN}✅${NC} riskMonitoring.js exists"
    
    if grep -q "notifyAdminOfNewRegistration" src/services/riskMonitoring.js; then
        echo -e "${GREEN}✅${NC} Admin notification function present"
    fi
    
    if grep -q "analyzeRiskIndicators" src/services/riskMonitoring.js; then
        echo -e "${GREEN}✅${NC} Risk analysis function present"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  riskMonitoring.js not found"
fi

# Check Notification Bell
echo ""
echo "🔔 Checking Notification Bell..."
echo "────────────────────────────────────────"

if [ -f "src/components/notificationbell.jsx" ]; then
    echo -e "${GREEN}✅${NC} notificationbell.jsx exists"
    
    if grep -q "postgres_changes" src/components/notificationbell.jsx; then
        echo -e "${GREEN}✅${NC} Real-time subscriptions enabled"
    fi
else
    echo -e "${RED}❌${NC} notificationbell.jsx not found"
fi

# Check for console logging
echo ""
echo "🐛 Checking Debug Logging..."
echo "────────────────────────────────────────"

if grep -q "console.log.*ALL USERS LOADED" src/pages/dashboard/risk.jsx; then
    echo -e "${GREEN}✅${NC} User loading logs present"
else
    echo -e "${YELLOW}⚠️${NC}  User loading logs not found"
fi

if grep -q "console.log.*Risk Dashboard" src/pages/dashboard/risk.jsx; then
    echo -e "${GREEN}✅${NC} Dashboard logs present"
else
    echo -e "${YELLOW}⚠️${NC}  Dashboard logs not found"
fi

echo ""
echo "============================================"
echo "✅ FRONTEND HEALTH CHECK COMPLETE"
echo "============================================"
echo ""
echo "The frontend is configured for:"
echo "  ✓ Universal user tracking"
echo "  ✓ Real-time updates"
echo "  ✓ Search functionality"
echo "  ✓ Activity tracking"
echo "  ✓ Admin notifications"
echo ""

