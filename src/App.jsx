// App.jsx - COMPLETE FIXED VERSION
// Replace your entire src/App.jsx with this

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { LanguageProvider } from './i18n/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthProvider';
import { UserProvider } from './contexts/UserContext';
import { RoleProvider } from './context/RoleContext';
import { CapabilityProvider } from './context/CapabilityContext';
import RequireCapability from './components/auth/RequireCapability';
import { useAuth } from './contexts/AuthProvider';
import { useCapability } from './context/CapabilityContext';
import { supabase } from './api/supabaseClient';
import { useIdlePreloading, setupLinkPreloading } from './utils/preloadData';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { useBrowserNavigation } from './hooks/useBrowserNavigation';

/* ===== Public pages (eager) ===== */
import Home from './pages/index';
import Login from './pages/login';
import Signup from './pages/signup';
import SignupSurgery from './pages/SignupSurgery';
import ForgotPassword from './pages/forgot-password';
import AuthCallback from './pages/auth-callback';
import NotFound from './pages/NotFound';
import SitemapXML from './pages/sitemap.xml';
import PrivacyPolicy from './pages/privacy-policy';
import TermsAndConditions from './pages/terms-and-conditions';
import TermsEnforcement from './pages/terms-enforcement';
import CookiePolicy from './pages/cookie-policy';
import Countries from './pages/countries';
import HowItWorks from './pages/how-it-works';

/* ===== Dashboard shell ===== */
import Dashboard from './pages/dashboard/WorkspaceDashboard';
import DashboardHome from './pages/dashboard/DashboardHome';
import PostLoginRouter from './auth/PostLoginRouter';

/* ===== AFRIKONI OS KERNEL - Dashboard Pages ===== */
/* Organized by Engine: Seller, Buyer, Logistics, Governance, System */

// 0. SYSTEM HOME
// (DashboardHome imported eagerly above)

// 1. SELLER ENGINE (Supply Chain)
const ProductsPage = lazy(() => import('./pages/dashboard/products'));
const ProductsNewPage = lazy(() => import('./pages/dashboard/products/new'));
const SalesPage = lazy(() => import('./pages/dashboard/sales'));
const SupplierRFQsPage = lazy(() => import('./pages/dashboard/supplier-rfqs'));
const SupplierAnalyticsPage = lazy(() => import('./pages/dashboard/supplier-analytics'));

// 2. BUYER ENGINE (Sourcing)
const OrdersPage = lazy(() => import('./pages/dashboard/orders'));
const OrderDetailPage = lazy(() => import('./pages/dashboard/orders/[id]'));
const RFQsPage = lazy(() => import('./pages/dashboard/rfqs'));
const RFQsNewPage = lazy(() => import('./pages/dashboard/rfqs/new'));
const RFQDetailPage = lazy(() => import('./pages/dashboard/rfqs/[id]'));
const SavedItemsPage = lazy(() => import('./pages/dashboard/saved'));

// 3. LOGISTICS ENGINE (Fulfillment)
const ShipmentsPage = lazy(() => import('./pages/dashboard/shipments'));
const ShipmentDetailPage = lazy(() => import('./pages/dashboard/shipments/[id]'));
const ShipmentNewPage = lazy(() => import('./pages/dashboard/shipments/new'));
const FulfillmentPage = lazy(() => import('./pages/dashboard/fulfillment'));
const LogisticsDashboardPage = lazy(() => import('./pages/dashboard/logistics-dashboard'));
const LogisticsQuotePage = lazy(() => import('./pages/dashboard/logistics-quote'));

// 4. FINANCIAL ENGINE
const PaymentsPage = lazy(() => import('./pages/dashboard/payments'));
const InvoicesPage = lazy(() => import('./pages/dashboard/invoices'));
const InvoiceDetailPage = lazy(() => import('./pages/dashboard/invoices/[id]'));
const ReturnsPage = lazy(() => import('./pages/dashboard/returns'));
const ReturnDetailPage = lazy(() => import('./pages/dashboard/returns/[id]'));
const EscrowPage = lazy(() => import('./pages/dashboard/escrow/[orderId]'));

// 5. GOVERNANCE & SECURITY (The Firewall)
const CompliancePage = lazy(() => import('./pages/dashboard/compliance'));
const RiskPage = lazy(() => import('./pages/dashboard/risk'));
const KYCPage = lazy(() => import('./pages/dashboard/kyc'));
const VerificationStatusPage = lazy(() => import('./pages/dashboard/verification-status'));
const VerificationMarketplacePage = lazy(() => import('./pages/dashboard/verification-marketplace'));
const AnticorruptionPage = lazy(() => import('./pages/dashboard/anticorruption'));
const AuditPage = lazy(() => import('./pages/dashboard/audit'));
const ProtectionPage = lazy(() => import('./pages/dashboard/protection'));

// 6. COMMUNITY & ENGAGEMENT
const ReviewsPage = lazy(() => import('./pages/dashboard/reviews'));
const DisputesPage = lazy(() => import('./pages/dashboard/disputes'));
const NotificationsPage = lazy(() => import('./pages/dashboard/notifications'));
const SupportChatPage = lazy(() => import('./pages/dashboard/support-chat'));
const HelpPage = lazy(() => import('./pages/dashboard/help'));

// 7. ANALYTICS & INTELLIGENCE
const AnalyticsPage = lazy(() => import('./pages/dashboard/analytics'));
const PerformancePage = lazy(() => import('./pages/dashboard/performance'));
const KoniAIPage = lazy(() => import('./pages/dashboard/koniai'));

// 8. SYSTEM SETTINGS & UTILITIES
const SettingsPage = lazy(() => import('./pages/dashboard/settings'));
const CompanyInfoPage = lazy(() => import('./pages/dashboard/company-info'));
const TeamMembersPage = lazy(() => import('./pages/dashboard/team-members'));
const SubscriptionsPage = lazy(() => import('./pages/dashboard/subscriptions'));
const CrisisPage = lazy(() => import('./pages/dashboard/crisis'));

// 9. DEV TOOLS (Development only)
const TestEmailsPage = lazy(() => import('./pages/dashboard/test-emails'));
const ArchitectureViewerPage = lazy(() => import('./pages/dashboard/architecture-viewer'));

/* ===== Lazy admin pages ===== */
const AdminUsersPage = lazy(() => import('./pages/dashboard/admin/users'));
const AdminAnalyticsPage = lazy(() => import('./pages/dashboard/admin/analytics'));
const AdminReviewPage = lazy(() => import('./pages/dashboard/admin/review'));
const AdminDisputesPage = lazy(() => import('./pages/dashboard/admin/disputes'));
const AdminSupportTicketsPage = lazy(() => import('./pages/dashboard/admin/support-tickets'));
const AdminMarketplacePage = lazy(() => import('./pages/dashboard/admin/marketplace'));
const AdminOnboardingTrackerPage = lazy(() => import('./pages/dashboard/admin/onboarding-tracker'));
const AdminRevenuePage = lazy(() => import('./pages/dashboard/admin/revenue'));
const AdminRFQMatchingPage = lazy(() => import('./pages/dashboard/admin/rfq-matching'));
const AdminRFQAnalyticsPage = lazy(() => import('./pages/dashboard/admin/rfq-analytics'));
const AdminSupplierManagementPage = lazy(() => import('./pages/dashboard/admin/supplier-management'));
const AdminGrowthMetricsPage = lazy(() => import('./pages/dashboard/admin/growth-metrics'));
const AdminTradeIntelligencePage = lazy(() => import('./pages/dashboard/admin/trade-intelligence'));
const AdminKYBPage = lazy(() => import('./pages/dashboard/admin/kyb'));
const AdminVerificationReviewPage = lazy(() => import('./pages/dashboard/admin/verification-review'));
const AdminReviewsPage = lazy(() => import('./pages/dashboard/admin/reviews'));
const AdminReviewsModerationPage = lazy(() => import('./pages/dashboard/admin/reviews-moderation'));
const AdminTrustEnginePage = lazy(() => import('./pages/dashboard/admin/trust-engine'));
const AdminRFQReviewPage = lazy(() => import('./pages/dashboard/admin/rfq-review'));
const AdminLeadsPage = lazy(() => import('./pages/dashboard/admin/leads'));
const AdminFounderControlPage = lazy(() => import('./pages/dashboard/admin/founder-control-panel'));
// Messages: Removed unused MessagesPage import - messages handled separately via inbox-mobile.jsx or will be added as nested route later

/* ===== Lazy routes ===== */
const Products = lazy(() => import('./pages/products'));
const Marketplace = lazy(() => import('./pages/marketplace'));
const ProductDetail = lazy(() => import('./pages/productdetails'));
const CompareProducts = lazy(() => import('./pages/compare'));
const RFQMarketplace = lazy(() => import('./pages/rfq-marketplace'));
const RFQDetail = lazy(() => import('./pages/rfqdetails'));
const Suppliers = lazy(() => import('./pages/suppliers'));
const SupplierProfile = lazy(() => import('./pages/supplierprofile'));
const BusinessProfile = lazy(() => import('./pages/business/[id]'));
const Categories = lazy(() => import('./pages/categories'));
const Contact = lazy(() => import('./pages/contact'));
const Help = lazy(() => import('./pages/help'));
const About = lazy(() => import('./pages/about'));
const AfrikoniCode = lazy(() => import('./pages/afrikoni-code'));
const Pricing = lazy(() => import('./pages/pricing'));
const BuyerHub = lazy(() => import('./pages/buyer-hub'));
const SupplierHub = lazy(() => import('./pages/supplier-hub'));
const Trust = lazy(() => import('./pages/trust'));
const OrderProtection = lazy(() => import('./pages/order-protection'));
const Community = lazy(() => import('./pages/community'));
const VerificationCenter = lazy(() => import('./pages/verification-center'));
const Trending = lazy(() => import('./pages/trending'));
const Logistics = lazy(() => import('./pages/logistics'));
const SupplierOnboarding = lazy(() => import('./pages/supplier-onboarding'));

// FIX: Missing public pages - these were in navbar but not routed
const TradeShield = lazy(() => import('./pages/protection'));
const AntiFraud = lazy(() => import('./pages/anti-fraud'));
const ResourcesIndex = lazy(() => import('./pages/resources/index'));
const ResourcesDownloads = lazy(() => import('./pages/resources/downloads'));
const ResourceArticle1 = lazy(() => import('./pages/resources/how-to-source-verified-african-suppliers'));
const ResourceArticle2 = lazy(() => import('./pages/resources/kyc-kyb-and-aml-for-african-b2b-trade'));
const ResourceArticle3 = lazy(() => import('./pages/resources/escrow-vs-advance-payments-in-african-trade'));

// ✅ ENTERPRISE FIX: Mobile-specific pages
const InboxMobile = lazy(() => import('./pages/inbox-mobile'));
const RFQMobileWizard = lazy(() => import('./pages/rfq-mobile-wizard'));

// ============================================
// DEBUG COMPONENT - Detects stuck auth (Silent mode)
// ============================================
function DebugAuth() {
  const auth = useAuth();

  useEffect(() => {
    // Only log in development - no popups
    if (import.meta.env.DEV) {
      console.log('🔍 [App Debug] Auth State:', {
        loading: auth.loading,
        authReady: auth.authReady,
        hasUser: !!auth.user,
        role: auth.role,
        hasProfile: !!auth.profile
      });

      // Silent timeout - just log warning, don't show popup
      if (auth.loading || !auth.authReady) {
        const timer = setTimeout(() => {
          console.warn('⚠️ [App] Auth loading longer than expected:', {
            loading: auth.loading,
            authReady: auth.authReady,
            user: auth.user?.id || 'none',
            role: auth.role || 'none'
          });
          // AuthProvider has its own timeout - don't show popup here
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [auth.loading, auth.authReady, auth.user, auth.role]);

  return null;
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function AppContent() {
  const { authReady } = useAuth();
  const { resetKernel } = useCapability(); // ✅ KERNEL-CENTRIC: Get resetKernel function from Kernel

  useSessionRefresh();
  useBrowserNavigation();
  
  // ✅ KERNEL-CENTRIC: Clean Logout - On SIGN_OUT, call resetKernel() to purge the "Brain"
  // ✅ KERNEL POLISH: Add debounce with isResetting ref to prevent resetKernel() from being called twice
  useEffect(() => {
    const isResettingRef = { current: false }; // ✅ KERNEL POLISH: Track reset state
    let resetTimeoutId = null;
    let lastSignOutTime = 0;
    const DEBOUNCE_MS = 1000; // 1 second debounce
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          // ✅ KERNEL POLISH: Check if already resetting
          if (isResettingRef.current) {
            console.log('[App] SIGN_OUT - resetKernel() already in progress, skipping');
            return;
          }
          
          const now = Date.now();
          // ✅ KERNEL POLISH: Debounce - only call resetKernel if last call was more than 1 second ago
          if (now - lastSignOutTime < DEBOUNCE_MS) {
            console.log('[App] SIGN_OUT debounced - skipping duplicate resetKernel() call');
            return;
          }
          
          // Clear any pending timeout
          if (resetTimeoutId) {
            clearTimeout(resetTimeoutId);
          }
          
          lastSignOutTime = now;
          isResettingRef.current = true; // ✅ KERNEL POLISH: Mark as resetting
          console.log('[App] SIGN_OUT detected - calling resetKernel() to purge Brain');
          
          // ✅ KERNEL POLISH: Use timeout to ensure resetKernel is only called once
          resetTimeoutId = setTimeout(() => {
            resetKernel(); // ✅ KERNEL-CENTRIC: Clear Kernel state before next user logs in
            isResettingRef.current = false; // ✅ KERNEL POLISH: Clear reset flag after completion
            resetTimeoutId = null;
          }, 100); // Small delay to batch multiple SIGN_OUT events
        }
      }
    );
    
    return () => {
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
      }
      isResettingRef.current = false; // ✅ KERNEL POLISH: Clear flag on cleanup
      subscription.unsubscribe();
    };
  }, [resetKernel]);

  useEffect(() => {
    // Only setup preloading after auth is ready
    if (authReady) {
    setupLinkPreloading();
    if (typeof window !== 'undefined') {
      useIdlePreloading();
    }
    }
  }, [authReady]); // Only run when auth is ready

  // ✅ EMERGENCY FIX: Self-Healing Engine - Auto-reload on module update errors
  useEffect(() => {
    const handlePreloadError = () => {
      console.log('[App] Vite preload error detected - auto-reloading to fix module cache');
      window.location.reload();
    };

    window.addEventListener('vite:preloadError', handlePreloadError);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
    };
  }, []);

  return (
          <Layout>
          <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup-surgery" element={<SignupSurgery />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/post-login" element={<PostLoginRouter />} />
            <Route path="/products" element={<Products />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/compare" element={<CompareProducts />} />
            <Route path="/rfq" element={<RFQMarketplace />} />
          <Route path="/rfq/detail" element={<RFQDetail />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/supplier" element={<SupplierProfile />} />
            <Route path="/business/:id" element={<BusinessProfile />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/countries" element={<Countries />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/about-us" element={<About />} /> {/* ✅ KERNEL ROUTING: Alias for About page to prevent broken links */}
          <Route path="/afrikoni-code" element={<AfrikoniCode />} /> {/* ✅ PUBLIC ROUTING: Afrikoni Code page */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/buyer-hub" element={<BuyerHub />} />
          <Route path="/supplier-hub" element={<SupplierHub />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/order-protection" element={<OrderProtection />} />
          {/* FIX: Missing public pages - these were linked in navbar but not routed */}
          <Route path="/protection" element={<TradeShield />} />
          <Route path="/anti-fraud" element={<AntiFraud />} />
          <Route path="/resources" element={<ResourcesIndex />} />
          <Route path="/resources/downloads" element={<ResourcesDownloads />} />
          <Route path="/resources/how-to-source-verified-african-suppliers" element={<ResourceArticle1 />} />
          <Route path="/resources/kyc-kyb-and-aml-for-african-b2b-trade" element={<ResourceArticle2 />} />
          <Route path="/resources/escrow-vs-advance-payments-in-african-trade" element={<ResourceArticle3 />} />
          <Route path="/community" element={<Community />} />
          <Route path="/verification-center" element={<VerificationCenter />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/logistics" element={<Logistics />} />

          {/* ✅ ENTERPRISE FIX: Mobile-specific routes */}
          <Route path="/inbox-mobile" element={
            <ProtectedRoute>
              <InboxMobile />
            </ProtectedRoute>
          } />
          <Route path="/rfq/create-mobile" element={<RFQMobileWizard />} />

          {/* Onboarding */}
          <Route 
            path="/onboarding/company" 
            element={
              <ProtectedRoute>
                <SupplierOnboarding />
              </ProtectedRoute>
            } 
          />

          {/* Legal */}
            <Route path="/sitemap.xml" element={<SitemapXML />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms-enforcement" element={<TermsEnforcement />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* PHASE 4: Legacy role-based dashboard routes - redirect to /dashboard */}
          {/* These routes are deprecated but kept for backward compatibility (bookmarks, external links) */}
          <Route
            path="/dashboard/buyer"
            element={
              <ProtectedRoute requireCompanyId={true}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/seller"
            element={
              <ProtectedRoute requireCompanyId={true}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/hybrid"
            element={
              <ProtectedRoute requireCompanyId={true}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/logistics"
            element={
              <ProtectedRoute requireCompanyId={true}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* ✅ AFRIKONI OS KERNEL - Unified Dashboard Router */}
          {/* ============================================================ */}
          {/* 🏛️ INFRASTRUCTURE ARCHITECTURE: */}
          {/* - DashboardLayout stays mounted (persistent shell) */}
          {/* - CapabilityProvider is now GLOBAL (wraps entire app) */}
          {/* - RequireCapability guards entry (ensures capabilities.ready) */}
          {/* - All routes are nested under /dashboard/* (unified tree) */}
          {/* - <Outlet /> swaps pages while layout persists */}
          {/* ============================================================ */}
          <Route
            path="/dashboard/*"
            element={
              <RequireCapability require={null}>
                <Dashboard />
              </RequireCapability>
            }
          >
            {/* 0. SYSTEM HOME */}
            <Route index element={<DashboardHome />} />

            {/* 1. SELLER ENGINE (Supply Chain) */}
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductsNewPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="supplier-rfqs" element={<SupplierRFQsPage />} />
            <Route path="supplier-analytics" element={<SupplierAnalyticsPage />} />

            {/* 2. BUYER ENGINE (Sourcing) */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="rfqs" element={<RFQsPage />} />
            <Route path="rfqs/new" element={<RFQsNewPage />} />
            <Route path="rfqs/:id" element={<RFQDetailPage />} />
            <Route path="saved" element={<SavedItemsPage />} />

            {/* 3. LOGISTICS ENGINE (Fulfillment) */}
            <Route path="shipments" element={<ShipmentsPage />} />
            <Route path="shipments/:id" element={<ShipmentDetailPage />} />
            <Route path="shipments/new" element={<ShipmentNewPage />} />
            <Route path="fulfillment" element={<FulfillmentPage />} />
            <Route path="logistics-dashboard" element={<LogisticsDashboardPage />} />
            <Route path="logistics-quote" element={<LogisticsQuotePage />} />

            {/* 4. FINANCIAL ENGINE */}
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="returns/:id" element={<ReturnDetailPage />} />
            <Route path="escrow/:orderId" element={<EscrowPage />} />

            {/* 5. GOVERNANCE & SECURITY (The Firewall) */}
            <Route path="compliance" element={
              <ProtectedRoute requireAdmin={true}>
                <CompliancePage />
              </ProtectedRoute>
            } />
            <Route path="risk" element={
              <ProtectedRoute requireAdmin={true}>
                <RiskPage />
              </ProtectedRoute>
            } />
            <Route path="kyc" element={<KYCPage />} />
            <Route path="verification-status" element={<VerificationStatusPage />} />
            <Route path="verification-marketplace" element={<VerificationMarketplacePage />} />
            <Route path="anticorruption" element={
              <ProtectedRoute requireAdmin={true}>
                <AnticorruptionPage />
              </ProtectedRoute>
            } />
            <Route path="audit" element={
              <ProtectedRoute requireAdmin={true}>
                <AuditPage />
              </ProtectedRoute>
            } />
            <Route path="protection" element={<ProtectionPage />} />

            {/* 6. COMMUNITY & ENGAGEMENT */}
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="disputes" element={<DisputesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="support-chat" element={<SupportChatPage />} />
            <Route path="help" element={<HelpPage />} />

            {/* 7. ANALYTICS & INTELLIGENCE */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="koniai" element={<KoniAIPage />} />

            {/* 8. SYSTEM SETTINGS & UTILITIES */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="company-info" element={<CompanyInfoPage />} />
            <Route path="team-members" element={<TeamMembersPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="crisis" element={
              <ProtectedRoute requireAdmin={true}>
                <CrisisPage />
              </ProtectedRoute>
            } />

            {/* 9. DEV TOOLS (Development only - hidden in production) */}
            {import.meta.env.DEV && (
              <>
                <Route path="test-emails" element={<TestEmailsPage />} />
                <Route path="architecture-viewer" element={<ArchitectureViewerPage />} />
              </>
            )}
            
            {/* ✅ ADMIN ROUTES - Protected by admin check in ProtectedRoute */}
            <Route path="admin/users" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />
            <Route path="admin/analytics" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/review" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminReviewPage />
              </ProtectedRoute>
            } />
            <Route path="admin/disputes" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDisputesPage />
              </ProtectedRoute>
            } />
            <Route path="admin/support-tickets" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSupportTicketsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/marketplace" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminMarketplacePage />
              </ProtectedRoute>
            } />
            <Route path="admin/onboarding-tracker" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminOnboardingTrackerPage />
              </ProtectedRoute>
            } />
            <Route path="admin/revenue" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRevenuePage />
              </ProtectedRoute>
            } />
            <Route path="admin/rfq-matching" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRFQMatchingPage />
              </ProtectedRoute>
            } />
            <Route path="admin/rfq-analytics" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRFQAnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/supplier-management" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSupplierManagementPage />
              </ProtectedRoute>
            } />
            <Route path="admin/growth-metrics" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminGrowthMetricsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/trade-intelligence" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminTradeIntelligencePage />
              </ProtectedRoute>
            } />
            <Route path="admin/kyb" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminKYBPage />
              </ProtectedRoute>
            } />
            <Route path="admin/verification-review" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminVerificationReviewPage />
              </ProtectedRoute>
            } />
            <Route path="admin/reviews" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminReviewsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/reviews-moderation" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminReviewsModerationPage />
              </ProtectedRoute>
            } />
            <Route path="admin/trust-engine" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminTrustEnginePage />
              </ProtectedRoute>
            } />
            <Route path="admin/rfq-review" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRFQReviewPage />
              </ProtectedRoute>
            } />
            <Route path="admin/leads" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLeadsPage />
              </ProtectedRoute>
            } />
            <Route path="admin/founder-control" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminFounderControlPage />
              </ProtectedRoute>
            } />
            {/* Default admin route redirects to users */}
            <Route path="admin" element={
              <ProtectedRoute requireAdmin={true}>
                <Navigate to="/dashboard/admin/users" replace />
              </ProtectedRoute>
            } />
            {/* Add more nested routes here as needed */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
  );
}

function App() {
  console.log('🚀 Afrikoni app booting');
  console.log('ENV:', import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING');

  return (
    <LanguageProvider>
      <CurrencyProvider>
        {/* ✅ CRITICAL: AuthProvider MUST come before UserProvider and RoleProvider */}
        <AuthProvider>
          <UserProvider>
            {/* ✅ RoleProvider uses AuthProvider's data */}
            <RoleProvider>
              {/* ✅ KERNEL ALIGNMENT: CapabilityProvider lifted to global level */}
              {/* This enables NotificationBell and other global components to access capabilities */}
              {/* even on public routes (/, /products, /marketplace, etc.) */}
              <CapabilityProvider>
                <ScrollToTop />
                <Toaster position="top-right" />
                
                {/* Debug component to detect stuck auth */}
                <DebugAuth />

                <AppContent />
              </CapabilityProvider>
            </RoleProvider>
          </UserProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;