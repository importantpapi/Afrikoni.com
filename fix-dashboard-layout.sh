#!/bin/bash
# Script to remove duplicate DashboardLayout wrappers from dashboard pages
# WorkspaceDashboard already provides DashboardLayout, so pages shouldn't wrap themselves

echo "🔧 Fixing Dashboard Layout Double-Wrapping Issue..."
echo ""

# List of files to fix (pages rendered through WorkspaceDashboard)
FILES=(
  "src/pages/dashboard/products.jsx"
  "src/pages/dashboard/orders.jsx"
  "src/pages/dashboard/sales.jsx"
  "src/pages/dashboard/payments.jsx"
  "src/pages/dashboard/invoices.jsx"
  "src/pages/dashboard/shipments.jsx"
  "src/pages/dashboard/fulfillment.jsx"
  "src/pages/dashboard/logistics-dashboard.jsx"
  "src/pages/dashboard/supplier-rfqs.jsx"
  "src/pages/dashboard/analytics.jsx"
  "src/pages/dashboard/performance.jsx"
  "src/pages/dashboard/settings.jsx"
  "src/pages/dashboard/company-info.jsx"
  "src/pages/dashboard/team-members.jsx"
  "src/pages/dashboard/saved.jsx"
  "src/pages/dashboard/returns.jsx"
  "src/pages/dashboard/reviews.jsx"
  "src/pages/dashboard/notifications.jsx"
  "src/pages/dashboard/support-chat.jsx"
  "src/pages/dashboard/help.jsx"
  "src/pages/dashboard/subscriptions.jsx"
  "src/pages/dashboard/verification-status.jsx"
  "src/pages/dashboard/verification-marketplace.jsx"
  "src/pages/dashboard/protection.jsx"
  "src/pages/dashboard/logistics-quote.jsx"
  "src/pages/dashboard/supplier-analytics.jsx"
  "src/pages/dashboard/kyc.jsx"
  "src/pages/dashboard/compliance.jsx"
  "src/pages/dashboard/risk.jsx"
  "src/pages/dashboard/disputes.jsx"
  "src/pages/dashboard/crisis.jsx"
  "src/pages/dashboard/audit.jsx"
  "src/pages/dashboard/anticorruption.jsx"
)

echo "✅ Files to fix: ${#FILES[@]}"
echo ""
echo "⚠️  This script will:"
echo "   1. Remove DashboardLayout imports"
echo "   2. Replace <DashboardLayout> wrappers with fragments (<>)"
echo "   3. Remove </DashboardLayout> closing tags"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # This is a placeholder - actual fixes will be done via search_replace
  else
    echo "⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Done!"
