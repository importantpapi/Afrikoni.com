// App.jsx - COMPLETE FIXED VERSION
// Replace your entire src/App.jsx with this

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { PageLoader } from '@/components/shared/ui/skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
import { LanguageProvider } from './i18n/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthProvider';
import { UserProvider } from './contexts/UserContext';
import { RoleProvider } from './context/RoleContext';
import { CapabilityProvider } from './context/CapabilityContext';
import { TradeProvider } from './context/TradeContext';
import { WorkspaceModeProvider } from './contexts/WorkspaceModeContext';
import RequireCapability from './components/auth/RequireCapability';
import { useAuth } from './contexts/AuthProvider';
import { useCapability } from './context/CapabilityContext';
import { supabase } from './api/supabaseClient';
import { useIdlePreloading, setupLinkPreloading } from './utils/preloadData';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { useBrowserNavigation } from './hooks/useBrowserNavigation';
import { useVersionCheck } from './hooks/useVersionCheck'; // ✅ ENTERPRISE RESILIENCE
import {
  Loader2,
  ShieldCheck,
  UserCheck,
  Globe,
  Zap,
  AlertCircle
} from 'lucide-react';
import OSReadinessPanel from './components/debug/OSReadinessPanel';

/**
 * =============================================================================
 * BOOT SCREEN - Handshake UI
 * =============================================================================
 */
const BootScreen = ({ status, error }) => (
  <div className="fixed inset-0 bg-[#1a0f0f] z-[9999] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative mb-8">
      <div className="absolute inset-0 animate-ping bg-[#e8c68a]/20 rounded-full blur-xl" />
      <div className="w-20 h-20 border-4 border-[#e8c68a]/20 border-t-[#e8c68a] rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className="w-8 h-8 text-[#e8c68a] fill-[#e8c68a]/20" />
      </div>
    </div>

    <div className="max-w-md w-full">
      <h2 className="text-[#f5f5f0] font-bold text-2xl mb-2 tracking-tight uppercase">
        Afrikoni Trade OS
      </h2>

      <div className="flex items-center justify-center gap-3 bg-white/5 py-3 px-6 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
        {error ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-[#e8c68a] animate-spin" />
        )}
        <span className="text-[#f5f5f0]/80 text-sm font-medium">
          {error || status || "Waking up the engine..."}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: ShieldCheck, label: 'Session', active: status?.includes('profile') || status?.includes('kernel') || status?.includes('Ready') || status?.includes('Sync') },
          { icon: UserCheck, label: 'Profile', active: status?.includes('kernel') || status?.includes('Ready') || status?.includes('Sync') },
          { icon: Globe, label: 'World', active: status?.includes('Ready') }
        ].map((step, idx) => (
          <div key={idx} className={`flex flex-col items-center gap-2 transition-opacity duration-500 ${step.active ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`p-3 rounded-xl ${step.active ? 'bg-[#e8c68a]/10 text-[#e8c68a]' : 'bg-white/5 text-white/40'}`}>
              <step.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#f5f5f0]/60">{step.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-[#e8c68a] text-sm underline underline-offset-4 hover:text-white transition-colors"
        >
          Force Restart OS
        </button>
      )}
    </div>

    <div className="absolute bottom-8 left-0 right-0">
      <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-medium">
        Infrastructure-Grade Trade Kernel &copy; 2026
      </p>
    </div>
  </div>
);

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
/* ===== Dashboard shell ===== */
const Dashboard = lazy(() => import('./pages/dashboard/WorkspaceDashboard'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const PostLoginRouter = lazy(() => import('./auth/PostLoginRouter'));

/* ===== AFRIKONI OS KERNEL - Dashboard Pages ===== */
/* Organized by Engine: Seller, Buyer, Logistics, Governance, System */

// 0. SYSTEM HOME
// (DashboardHome imported eagerly above)

// 1. SELLER ENGINE (Supply Chain)
const ProductsPage = lazy(() => import('./pages/dashboard/products'));
const ProductsNewPage = lazy(() => import('./pages/dashboard/products/new'));
// const SalesPage = lazy(() => import('./pages/dashboard/sales')); // DEPRECATED
// const SupplierRFQsPage = lazy(() => import('./pages/dashboard/supplier-rfqs')); // DEPRECATED
const SupplierAnalyticsPage = lazy(() => import('./pages/dashboard/supplier-analytics'));

// 2. BUYER ENGINE (Sourcing)
// const OrdersPage = lazy(() => import('./pages/dashboard/orders')); // DEPRECATED
const TradeMonitor = lazy(() => import('./pages/dashboard/TradeMonitor')); // [NEW] Unified
const RFQMonitor = lazy(() => import('./pages/dashboard/RFQMonitor')); // [NEW] Unified
const TraceCenterPage = lazy(() => import('./pages/dashboard/TraceCenter')); // [NEW] The Unbroken Flow
// const RFQsPage = lazy(() => import('./pages/dashboard/rfqs')); // DEPRECATED
const RFQsNewPage = lazy(() => import('./pages/dashboard/rfqs/new'));
const TradeWorkspacePage = lazy(() => import('./pages/dashboard/OneFlow'));
const SavedItemsPage = lazy(() => import('./pages/dashboard/saved'));

// 3. LOGISTICS ENGINE (Fulfillment)
const ShipmentsPage = lazy(() => import('./pages/dashboard/shipments'));
const ShipmentDetailPage = lazy(() => import('./pages/dashboard/shipments/[id]'));
const ShipmentNewPage = lazy(() => import('./pages/dashboard/shipments/new'));
const FulfillmentPage = lazy(() => import('./pages/dashboard/fulfillment'));
const LogisticsQuotePage = lazy(() => import('./pages/dashboard/logistics-quote'));
const LogisticsPartnerPortalPage = lazy(() => import('./pages/logistics/LogisticsPartnerPortal'));

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
const TrustHealthPage = lazy(() => import('./pages/dashboard/trust-health'));
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

// TRADE PIPELINE
const TradePipelinePage = lazy(() => import('./pages/dashboard/trade-pipeline'));

// QUICK TRADE WIZARD (The Killer Flow)
const QuickTradeWizard = lazy(() => import('./pages/dashboard/QuickTradeWizard'));

// 7. ANALYTICS & INTELLIGENCE
const AnalyticsPage = lazy(() => import('./pages/dashboard/analytics'));
const PerformancePage = lazy(() => import('./pages/dashboard/performance'));
const KoniAIPage = lazy(() => import('./pages/dashboard/koniai'));

// TRADE OS CONTROL PLANE (Mission Control)
const ControlPlanePage = lazy(() => import('./pages/dashboard/control-plane'));


// 8. SYSTEM SETTINGS & UTILITIES
const SettingsPage = lazy(() => import('./pages/dashboard/settings'));
const CompanyInfoPage = lazy(() => import('./pages/dashboard/company-info'));
const TeamMembersPage = lazy(() => import('./pages/dashboard/team-members'));
const SubscriptionsPage = lazy(() => import('./pages/dashboard/subscriptions'));

// 10. NEW TRADE OS MODULES (2026 Evolution)
const CorridorsPage = lazy(() => import('./pages/dashboard/corridors'));
const DocumentsPage = lazy(() => import('./pages/dashboard/documents'));
const RevenuePage = lazy(() => import('./pages/dashboard/revenue'));
const MessagesPage = lazy(() => import('./pages/MessagesPremium'));

// 9. DEV TOOLS (Development only)
const TestEmailsPage = lazy(() => import('./pages/dashboard/test-emails'));
const DesignDemoPage = lazy(() => import('./pages/design-demo'));
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

// ✅ ENTERPRISE FIX: Mobile-specific pages
const InboxMobile = lazy(() => import('./pages/inbox-mobile'));
const RFQMobileWizard = lazy(() => import('./pages/rfq-mobile-wizard'));

// ============================================
// DEBUG COMPONENT - Detects stuck auth (Silent mode)
// ============================================
// DebugAuth removed for production stability

// ============================================
// MAIN APP COMPONENT
// ============================================
function AppContent() {
  const { user, profile, authReady, authResolutionComplete } = useAuth();
  const { ready: kernelReady, kernelError, resetKernel } = useCapability();
  const location = useLocation();

  useSessionRefresh();
  useBrowserNavigation();
  useVersionCheck(); // ✅ ENTERPRISE RESILIENCE: Auto-update on version mismatch

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
            return;
          }

          const now = Date.now();
          // ✅ KERNEL POLISH: Debounce - only call resetKernel if last call was more than 1 second ago
          if (now - lastSignOutTime < DEBOUNCE_MS) {
            return;
          }

          // Clear any pending timeout
          if (resetTimeoutId) {
            clearTimeout(resetTimeoutId);
          }

          lastSignOutTime = now;
          isResettingRef.current = true; // ✅ KERNEL POLISH: Mark as resetting

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
  // Hard Refresh Patch Removed: Stability is now handled by robust error boundaries

  // ✅ HANDSHAKE GATE: Consuming all hydration states
  const isDashboardRoute = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/onboarding');

  const getHandshakeStatus = () => {
    if (!authReady) return "Resolving session...";
    if (!authResolutionComplete) return "Loading profile...";
    if (user && !kernelReady) return "Synchronizing World...";
    return "Ready";
  };

  const status = getHandshakeStatus();
  // ✅ FIX PREMATURE RENDERING: Block if kernelError exists or kernel not ready
  const isSystemReady = !isDashboardRoute || (
    authResolutionComplete &&
    (!user || (kernelReady && !kernelError && profile))
  );

  // ✅ HANDSHAKE GATE RENDER
  if (!isSystemReady) {
    return <BootScreen status={status} error={kernelError} />;
  }

  return (
    <Layout>
      <ChunkErrorBoundary>
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
            <Route path="/community" element={<Community />} />
            {/* Verification Center moved to Dashboard routes */}
            <Route path="/trending" element={<Trending />} />
            <Route path="/logistics" element={<Logistics />} />

            {/* ✅ ENTERPRISE FIX: Mobile-specific routes */}
            <Route path="/inbox-mobile" element={
              <ProtectedRoute>
                <InboxMobile />
              </ProtectedRoute>
            } />
            <Route path="/rfq/create-mobile" element={
              <ProtectedRoute>
                <RFQMobileWizard />
              </ProtectedRoute>
            } />

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

            {/* ✅ AFRIKONI OS KERNEL - Unified Dashboard Router */}
            {/* ============================================================ */}
            {/* 🏛️ INFRASTRUCTURE ARCHITECTURE: */}
            {/* - OSShell stays mounted (persistent modular layout) */}
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
              <Route path="products/quick-add" element={<ProductsNewPage />} />
              <Route path="products/quick-add/:id" element={<ProductsNewPage />} />
              <Route path="sales" element={<TradeMonitor viewMode="sell" />} />
              <Route path="supplier-rfqs" element={<RFQMonitor viewMode="supplier" />} />
              <Route path="supplier-analytics" element={<SupplierAnalyticsPage />} />

              {/* 2. BUYER ENGINE (Sourcing) */}
              <Route path="orders" element={<TradeMonitor viewMode="buy" />} />
              <Route path="orders/:id" element={<TradeWorkspacePage />} />
              <Route path="rfqs" element={<RFQMonitor viewMode="buyer" />} />
              <Route path="rfqs/new" element={<RFQsNewPage />} />
              <Route path="rfqs/:id" element={<TradeWorkspacePage />} />
              <Route path="trade/:id" element={<TradeWorkspacePage />} />
              <Route path="saved" element={<SavedItemsPage />} />

              {/* 3. LOGISTICS ENGINE (Fulfillment) */}
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="shipments/:id" element={<ShipmentDetailPage />} />
              <Route path="shipments/new" element={<ShipmentNewPage />} />
              <Route path="fulfillment" element={<FulfillmentPage />} />
              <Route path="logistics-quote" element={<LogisticsQuotePage />} />
              <Route path="logistics-portal" element={<LogisticsPartnerPortalPage />} />

              {/* 4. FINANCIAL ENGINE */}
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="returns/:id" element={<ReturnDetailPage />} />
              <Route path="escrow/:orderId" element={<EscrowPage />} />

              {/* 5. GOVERNANCE & SECURITY (The Firewall) */}
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="risk" element={<RiskPage />} />
              <Route path="trust-center" element={<TrustHealthPage />} />
              <Route path="trust-health" element={<Navigate to="trust-center" replace />} /> {/* Legacy Redirect */}
              <Route path="kyc" element={<KYCPage />} />
              <Route path="verification-status" element={<VerificationStatusPage />} />
              <Route path="verification-marketplace" element={<VerificationMarketplacePage />} />
              <Route path="verification-center" element={<VerificationCenter />} />
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

              {/* TRADE PIPELINE */}
              <Route path="trade-pipeline" element={<TradePipelinePage />} />
              <Route path="trace-center" element={<TraceCenterPage />} /> {/* [NEW] Visual Command */}

              {/* QUICK TRADE WIZARD (The Killer Flow) */}
              <Route path="quick-trade/new" element={<QuickTradeWizard />} />

              {/* 7. ANALYTICS & INTELLIGENCE */}
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="koniai" element={<KoniAIPage />} />

              {/* TRADE OS CONTROL PLANE (Mission Control) */}
              <Route path="control-plane" element={<ControlPlanePage />} />


              {/* 8. SYSTEM SETTINGS & UTILITIES */}
              <Route path="settings" element={
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              } />
              <Route path="company-info" element={<CompanyInfoPage />} />
              <Route path="team-members" element={<TeamMembersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />

              {/* 10. TRADE OS MODULES */}
              <Route path="corridors" element={<CorridorsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="messages" element={<MessagesPage />} />

              {/* 9. DEV TOOLS (Development only - hidden in production) */}
              {import.meta.env.DEV && (
                <>
                  <Route path="test-emails" element={<TestEmailsPage />} />
                  <Route path="design-demo" element={<DesignDemoPage />} />
                </>
              )}
              {/* Add more nested routes here as needed */}
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>
    </Layout>
  );
}

function App() {
  if (import.meta.env.DEV) {
    console.log('🚀 Afrikoni app booting');
    console.log('ENV:', import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING');
  }

  return (
    <ErrorBoundary fallbackMessage="System error. Please refresh the page or contact support.">
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
                  <TradeProvider>
                    <WorkspaceModeProvider>
                      <ScrollToTop />
                      <Toaster position="top-right" />

                      {/* Debug component to detect stuck auth */}
                      <OSReadinessPanel />


                      {/* KoniAI+ Global Chat Assistant */}

                      <AppContent />
                    </WorkspaceModeProvider>
                  </TradeProvider>
                </CapabilityProvider>
              </RoleProvider>
            </UserProvider>
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
