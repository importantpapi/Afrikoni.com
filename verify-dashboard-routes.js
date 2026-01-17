#!/usr/bin/env node
/**
 * Dashboard Routes Verification Script
 * Tests all 64 dashboard routes for:
 * 1. File existence
 * 2. No double DashboardLayout wrapping
 * 3. Proper error handling
 * 4. UI consistency
 */

const fs = require('fs');
const path = require('path');

const ROUTES = [
  // 0. SYSTEM HOME
  { path: 'dashboard/DashboardHome.jsx', route: '/dashboard', name: 'DashboardHome' },
  
  // 1. SELLER ENGINE
  { path: 'dashboard/products.jsx', route: '/dashboard/products', name: 'ProductsPage' },
  { path: 'dashboard/products/new.jsx', route: '/dashboard/products/new', name: 'ProductsNewPage' },
  { path: 'dashboard/sales.jsx', route: '/dashboard/sales', name: 'SalesPage' },
  { path: 'dashboard/supplier-rfqs.jsx', route: '/dashboard/supplier-rfqs', name: 'SupplierRFQsPage' },
  { path: 'dashboard/supplier-analytics.jsx', route: '/dashboard/supplier-analytics', name: 'SupplierAnalyticsPage' },
  
  // 2. BUYER ENGINE
  { path: 'dashboard/orders.jsx', route: '/dashboard/orders', name: 'OrdersPage' },
  { path: 'dashboard/orders/[id].jsx', route: '/dashboard/orders/:id', name: 'OrderDetailPage' },
  { path: 'dashboard/rfqs.jsx', route: '/dashboard/rfqs', name: 'RFQsPage' },
  { path: 'dashboard/rfqs/new.jsx', route: '/dashboard/rfqs/new', name: 'RFQsNewPage' },
  { path: 'dashboard/rfqs/[id].jsx', route: '/dashboard/rfqs/:id', name: 'RFQDetailPage' },
  { path: 'dashboard/saved.jsx', route: '/dashboard/saved', name: 'SavedItemsPage' },
  
  // 3. LOGISTICS ENGINE
  { path: 'dashboard/shipments.jsx', route: '/dashboard/shipments', name: 'ShipmentsPage' },
  { path: 'dashboard/shipments/[id].jsx', route: '/dashboard/shipments/:id', name: 'ShipmentDetailPage' },
  { path: 'dashboard/shipments/new.jsx', route: '/dashboard/shipments/new', name: 'ShipmentNewPage' },
  { path: 'dashboard/fulfillment.jsx', route: '/dashboard/fulfillment', name: 'FulfillmentPage' },
  { path: 'dashboard/logistics-dashboard.jsx', route: '/dashboard/logistics-dashboard', name: 'LogisticsDashboardPage' },
  { path: 'dashboard/logistics-quote.jsx', route: '/dashboard/logistics-quote', name: 'LogisticsQuotePage' },
  
  // 4. FINANCIAL ENGINE
  { path: 'dashboard/payments.jsx', route: '/dashboard/payments', name: 'PaymentsPage' },
  { path: 'dashboard/invoices.jsx', route: '/dashboard/invoices', name: 'InvoicesPage' },
  { path: 'dashboard/invoices/[id].jsx', route: '/dashboard/invoices/:id', name: 'InvoiceDetailPage' },
  { path: 'dashboard/returns.jsx', route: '/dashboard/returns', name: 'ReturnsPage' },
  { path: 'dashboard/returns/[id].jsx', route: '/dashboard/returns/:id', name: 'ReturnDetailPage' },
  { path: 'dashboard/escrow/[orderId].jsx', route: '/dashboard/escrow/:orderId', name: 'EscrowPage' },
  
  // 5. GOVERNANCE & SECURITY
  { path: 'dashboard/compliance.jsx', route: '/dashboard/compliance', name: 'CompliancePage' },
  { path: 'dashboard/risk.jsx', route: '/dashboard/risk', name: 'RiskPage' },
  { path: 'dashboard/kyc.jsx', route: '/dashboard/kyc', name: 'KYCPage' },
  { path: 'dashboard/verification-status.jsx', route: '/dashboard/verification-status', name: 'VerificationStatusPage' },
  { path: 'dashboard/verification-marketplace.jsx', route: '/dashboard/verification-marketplace', name: 'VerificationMarketplacePage' },
  { path: 'dashboard/anticorruption.jsx', route: '/dashboard/anticorruption', name: 'AnticorruptionPage' },
  { path: 'dashboard/audit.jsx', route: '/dashboard/audit', name: 'AuditPage' },
  { path: 'dashboard/protection.jsx', route: '/dashboard/protection', name: 'ProtectionPage' },
  
  // 6. COMMUNITY & ENGAGEMENT
  { path: 'dashboard/reviews.jsx', route: '/dashboard/reviews', name: 'ReviewsPage' },
  { path: 'dashboard/disputes.jsx', route: '/dashboard/disputes', name: 'DisputesPage' },
  { path: 'dashboard/notifications.jsx', route: '/dashboard/notifications', name: 'NotificationsPage' },
  { path: 'dashboard/support-chat.jsx', route: '/dashboard/support-chat', name: 'SupportChatPage' },
  { path: 'dashboard/help.jsx', route: '/dashboard/help', name: 'HelpPage' },
  
  // 7. ANALYTICS & INTELLIGENCE
  { path: 'dashboard/analytics.jsx', route: '/dashboard/analytics', name: 'AnalyticsPage' },
  { path: 'dashboard/performance.jsx', route: '/dashboard/performance', name: 'PerformancePage' },
  { path: 'dashboard/koniai.jsx', route: '/dashboard/koniai', name: 'KoniAIPage' },
  
  // 8. SYSTEM SETTINGS & UTILITIES
  { path: 'dashboard/settings.jsx', route: '/dashboard/settings', name: 'SettingsPage' },
  { path: 'dashboard/company-info.jsx', route: '/dashboard/company-info', name: 'CompanyInfoPage' },
  { path: 'dashboard/team-members.jsx', route: '/dashboard/team-members', name: 'TeamMembersPage' },
  { path: 'dashboard/subscriptions.jsx', route: '/dashboard/subscriptions', name: 'SubscriptionsPage' },
  { path: 'dashboard/crisis.jsx', route: '/dashboard/crisis', name: 'CrisisPage' },
  
  // 9. DEV TOOLS
  { path: 'dashboard/test-emails.jsx', route: '/dashboard/test-emails', name: 'TestEmailsPage' },
  { path: 'dashboard/architecture-viewer.jsx', route: '/dashboard/architecture-viewer', name: 'ArchitectureViewerPage' },
  
  // ADMIN ROUTES
  { path: 'dashboard/admin/users.jsx', route: '/dashboard/admin/users', name: 'AdminUsersPage' },
  { path: 'dashboard/admin/analytics.jsx', route: '/dashboard/admin/analytics', name: 'AdminAnalyticsPage' },
  { path: 'dashboard/admin/review.jsx', route: '/dashboard/admin/review', name: 'AdminReviewPage' },
  { path: 'dashboard/admin/disputes.jsx', route: '/dashboard/admin/disputes', name: 'AdminDisputesPage' },
  { path: 'dashboard/admin/support-tickets.jsx', route: '/dashboard/admin/support-tickets', name: 'AdminSupportTicketsPage' },
  { path: 'dashboard/admin/marketplace.jsx', route: '/dashboard/admin/marketplace', name: 'AdminMarketplacePage' },
  { path: 'dashboard/admin/onboarding-tracker.jsx', route: '/dashboard/admin/onboarding-tracker', name: 'AdminOnboardingTrackerPage' },
  { path: 'dashboard/admin/revenue.jsx', route: '/dashboard/admin/revenue', name: 'AdminRevenuePage' },
  { path: 'dashboard/admin/rfq-matching.jsx', route: '/dashboard/admin/rfq-matching', name: 'AdminRFQMatchingPage' },
  { path: 'dashboard/admin/rfq-analytics.jsx', route: '/dashboard/admin/rfq-analytics', name: 'AdminRFQAnalyticsPage' },
  { path: 'dashboard/admin/supplier-management.jsx', route: '/dashboard/admin/supplier-management', name: 'AdminSupplierManagementPage' },
  { path: 'dashboard/admin/growth-metrics.jsx', route: '/dashboard/admin/growth-metrics', name: 'AdminGrowthMetricsPage' },
  { path: 'dashboard/admin/trade-intelligence.jsx', route: '/dashboard/admin/trade-intelligence', name: 'AdminTradeIntelligencePage' },
  { path: 'dashboard/admin/kyb.jsx', route: '/dashboard/admin/kyb', name: 'AdminKYBPage' },
  { path: 'dashboard/admin/verification-review.jsx', route: '/dashboard/admin/verification-review', name: 'AdminVerificationReviewPage' },
  { path: 'dashboard/admin/reviews.jsx', route: '/dashboard/admin/reviews', name: 'AdminReviewsPage' },
  { path: 'dashboard/admin/reviews-moderation.jsx', route: '/dashboard/admin/reviews-moderation', name: 'AdminReviewsModerationPage' },
  { path: 'dashboard/admin/trust-engine.jsx', route: '/dashboard/admin/trust-engine', name: 'AdminTrustEnginePage' },
  { path: 'dashboard/admin/rfq-review.jsx', route: '/dashboard/admin/rfq-review', name: 'AdminRFQReviewPage' },
  { path: 'dashboard/admin/leads.jsx', route: '/dashboard/admin/leads', name: 'AdminLeadsPage' },
  { path: 'dashboard/admin/founder-control-panel.jsx', route: '/dashboard/admin/founder-control', name: 'AdminFounderControlPage' },
];

const srcDir = path.join(__dirname, 'src', 'pages');

function checkFile(filePath) {
  const fullPath = path.join(srcDir, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    return { exists: false, error: 'File not found' };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const issues = [];
  
  // Check 1: No DashboardLayout import (should be commented out)
  const dashboardLayoutImport = /import\s+.*DashboardLayout.*from/i;
  if (dashboardLayoutImport.test(content) && !content.includes('// NOTE: DashboardLayout')) {
    issues.push('Has DashboardLayout import (should be commented)');
  }
  
  // Check 2: No <DashboardLayout> tags
  const dashboardLayoutTags = /<DashboardLayout[^>]*>/g;
  const matches = content.match(dashboardLayoutTags);
  if (matches && matches.length > 0) {
    issues.push(`Found ${matches.length} <DashboardLayout> tag(s) - should use fragments`);
  }
  
  // Check 3: No </DashboardLayout> tags
  const closingTags = content.match(/<\/DashboardLayout>/g);
  if (closingTags && closingTags.length > 0) {
    issues.push(`Found ${closingTags.length} </DashboardLayout> tag(s) - should use </>`);
  }
  
  // Check 4: Has error handling (try/catch or error boundaries)
  const hasTryCatch = /try\s*\{/.test(content);
  const hasErrorBoundary = /ErrorBoundary|componentDidCatch|getDerivedStateFromError/.test(content);
  const hasErrorHandling = hasTryCatch || hasErrorBoundary;
  
  // Check 5: Uses proper loading states
  const hasLoadingState = /loading|isLoading|SpinnerWithTimeout|PageLoader|CardSkeleton/.test(content);
  
  // Check 6: Uses React Fragment or proper wrapper
  const hasFragment = /<>|React\.Fragment|<Fragment/.test(content);
  const hasReturn = /return\s*\(/.test(content);
  
  return {
    exists: true,
    hasErrorHandling,
    hasLoadingState,
    hasFragment,
    hasReturn,
    issues,
    lineCount: content.split('\n').length
  };
}

console.log('🔍 Dashboard Routes Verification\n');
console.log('='.repeat(80));

const results = {
  total: ROUTES.length,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

ROUTES.forEach((route, index) => {
  const result = checkFile(route.path);
  const status = result.exists && result.issues.length === 0 ? '✅' : 
                 result.exists && result.issues.length > 0 ? '⚠️' : '❌';
  
  if (status === '✅') {
    results.passed++;
  } else if (status === '⚠️') {
    results.warnings++;
  } else {
    results.failed++;
  }
  
  results.details.push({
    ...route,
    ...result,
    status
  });
  
  console.log(`${String(index + 1).padStart(3)}. ${status} ${route.name.padEnd(35)} ${route.route}`);
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      console.log(`     ⚠️  ${issue}`);
    });
  }
  
  if (!result.exists) {
    console.log(`     ❌ File not found: ${route.path}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 Summary:');
console.log(`   Total Routes: ${results.total}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ⚠️  Warnings: ${results.warnings}`);
console.log(`   ❌ Failed: ${results.failed}`);

// Generate detailed report
const reportPath = path.join(__dirname, 'DASHBOARD_ROUTES_VERIFICATION_REPORT.md');
const report = `# Dashboard Routes Verification Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Routes**: ${results.total}
- **✅ Passed**: ${results.passed}
- **⚠️ Warnings**: ${results.warnings}
- **❌ Failed**: ${results.failed}

## Detailed Results

${results.details.map((r, i) => `
### ${i + 1}. ${r.name}
- **Route**: \`${r.route}\`
- **File**: \`${r.path}\`
- **Status**: ${r.status}
- **Line Count**: ${r.lineCount || 'N/A'}
- **Error Handling**: ${r.hasErrorHandling ? '✅' : '⚠️'}
- **Loading State**: ${r.hasLoadingState ? '✅' : '⚠️'}
- **Fragment Usage**: ${r.hasFragment ? '✅' : '⚠️'}
${r.issues.length > 0 ? `- **Issues**:\n${r.issues.map(issue => `  - ${issue}`).join('\n')}` : ''}
`).join('\n')}

## Recommendations

${results.details.filter(r => r.issues.length > 0).map(r => `
### ${r.name}
${r.issues.map(issue => `- [ ] Fix: ${issue}`).join('\n')}
`).join('\n')}
`;

fs.writeFileSync(reportPath, report);
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

process.exit(results.failed > 0 ? 1 : 0);
