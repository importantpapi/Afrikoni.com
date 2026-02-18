// App.jsx - COMPLETE FIXED VERSION
// Replace your entire src/App.jsx with this

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import Layout from './layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { Button } from '@/components/shared/ui/button';
import { Logo } from '@/components/shared/ui/Logo';
import ErrorBoundary from '@/components/ErrorBoundary';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
import HreflangTags from '@/components/HreflangTags';
import { LanguageProvider } from './i18n/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthProvider';
import { UserProvider } from './contexts/UserContext';
import { RoleProvider } from './contexts/RoleContext';
import { CapabilityProvider } from './contexts/CapabilityContext';
import { TradeProvider } from './contexts/TradeContext';
import { WorkspaceModeProvider } from './contexts/WorkspaceModeContext';
import RequireCapability from './guards/RequireCapability';
import { useAuth } from './contexts/AuthProvider';
import { useCapability } from './contexts/CapabilityContext';
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
import { useSovereignHandshake } from './hooks/useSovereignHandshake';
import { migrateToSecureStorage } from './utils/secureStorage';

/**
 * =============================================================================
 * BOOT SCREEN - Handshake UI
 * =============================================================================
 */
/**
 * =============================================================================
 * BOOT SCREEN - Handshake UI (Horizon 2026)
 * =============================================================================
 */
const BootScreen = ({ status, error }) => {
  // Map internal status codes to user-friendly messages
  const statusLabels = {
    'RESOLVING_IDENTITY': 'Verifying Identity...',
    'HYDRATING_KERNEL': 'Syncing Trade Data...',
    'READY': 'Connection Established',
    'Syncing': 'Optimizing Global Trade Route...',
  };

  const displayStatus = error || statusLabels[status] || status || "Optimizing your trade experience...";

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Background Ambient Depth */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="relative mb-12">
        <div className="absolute inset-0 animate-ping bg-primary/20 rounded-full blur-2xl" />
        <div className="w-24 h-24 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-3 bg-os-accent/5 border border-os-accent/10 rounded-os-md flex items-center justify-center backdrop-blur-md shadow-glow">
            <Logo type="icon" size="sm" className="text-os-accent" />
          </div>
        </div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-foreground font-black text-3xl tracking-tighter uppercase">
            AFRIKONI <span className="text-primary">HORIZON</span>
          </h2>

          <div className="flex items-center justify-center gap-3 bg-os-surface-1 py-3.5 px-6 rounded-os-md border border-os-stroke mb-8 backdrop-blur-xl shadow-os-md">
            {error ? (
              <AlertCircle className="w-4 h-4 text-destructive" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.32s]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.16s]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
              </div>
            )}
            <span className="text-foreground/90 text-os-sm font-mono uppercase tracking-wider">
              {displayStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, label: 'Kernel', active: status === 'HYDRATING_KERNEL' || status === 'READY' },
              { icon: UserCheck, label: 'Identity', active: status === 'RESOLVING_IDENTITY' || status === 'HYDRATING_KERNEL' || status === 'READY' },
              { icon: Globe, label: 'Network', active: status === 'READY' }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-os-md flex items-center justify-center border transition-all duration-700 ${step.active
                  ? 'bg-primary/5 border-primary/30 text-primary shadow-glow'
                  : 'bg-os-surface-1 border-os-stroke text-foreground/20'
                  }`}>
                  <step.icon className={`w-6 h-6 ${step.active ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`text-os-xs uppercase tracking-[0.2em] font-black transition-colors ${step.active ? 'text-primary' : 'text-foreground/20'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="mt-8 text-primary hover:bg-primary/10 rounded-full text-os-xs uppercase tracking-widest font-bold"
            >
              Force Restart Engine
            </Button>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-0 right-0">
        <p className="text-foreground/10 text-os-xs uppercase tracking-[0.5em] font-black">
          Global Trade OS &copy; 2026 HORIZON
        </p>
      </div>
    </div>
  );
};


/* ===== Public pages (eager) ===== */
import Home from './pages/index';
import Login from './pages/login';
import Signup from './pages/signup';
import SignupSurgery from './pages/SignupSurgery';
import ForgotPassword from './pages/forgot-password';
import AuthCallback from './pages/auth-callback';
import NotFound from './pages/NotFound';

/* ===== Non-critical Public pages (lazy) ===== */
const SavedPage = lazy(() => import('./pages/saved'));
const SitemapXML = lazy(() => import('./pages/sitemap.xml'));
const PrivacyPolicy = lazy(() => import('./pages/privacy-policy'));
const TermsAndConditions = lazy(() => import('./pages/terms-and-conditions'));
const TermsEnforcement = lazy(() => import('./pages/terms-enforcement'));
const CookiePolicy = lazy(() => import('./pages/cookie-policy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicy'));
const Countries = lazy(() => import('./pages/countries'));
const HowItWorks = lazy(() => import('./pages/how-it-works'));

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
const ProductsEditPage = lazy(() => import('./pages/dashboard/products/edit'));
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
const VerificationCenter = lazy(() => import('./pages/dashboard/VerificationCenter'));
const NetworkDashboard = lazy(() => import('./pages/dashboard/NetworkDashboard'));

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
const AgentOnboarding = lazy(() => import('./pages/dashboard/AgentOnboarding'));

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
const Trending = lazy(() => import('./pages/trending'));
const Logistics = lazy(() => import('./pages/logistics'));
const SupplierOnboarding = lazy(() => import('./pages/supplier-onboarding'));
const BecomeSupplier = lazy(() => import('./pages/become-supplier'));
const ServiceSuppliers = lazy(() => import('./pages/services/suppliers'));
const ServiceBuyers = lazy(() => import('./pages/services/buyers'));
const TradeProtection = lazy(() => import('./pages/protection'));
const EscrowPolicy = lazy(() => import('./pages/escrow-policy'));

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
// ✅ ROUTING GUARD: Redirects non-language paths to default language
// e.g. /supplier-hub -> /en/supplier-hub
const LanguageWrapper = () => {
  const { lang } = useParams();
  const location = useLocation();
  const supportedLangs = ['en', 'fr', 'pt', 'ar'];

  if (!supportedLangs.includes(lang)) {
    return <Navigate to={`/en${location.pathname}`} replace />;
  }

  return <Outlet />;
};

// Helper for smart redirects preserving path
const SmartRedirect = ({ prefix = '/en' }) => {
  const location = useLocation();
  return <Navigate to={`${prefix}${location.pathname}`} replace />;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function AppContent() {
  const { authReady } = useAuth();
  const { kernelError, ready: isSystemReady } = useCapability();
  const location = useLocation();

  // ✅ SOVEREIGN SYNC: Parallel Handshake
  const { handshakeStatus } = useSovereignHandshake();

  useSessionRefresh();
  useBrowserNavigation();
  useVersionCheck();


  useEffect(() => {
    if (authReady) {
      setupLinkPreloading();
      if (typeof window !== 'undefined') {
        useIdlePreloading();
      }
    }
  }, [authReady]);

  const isDashboardRoute = location.pathname.includes('/dashboard') ||
    location.pathname.includes('/onboarding');

  const systemAccessReady = !isDashboardRoute || isSystemReady;

  if (!systemAccessReady) {
    return <BootScreen status={handshakeStatus} error={kernelError} />;
  }

  return (
    <Layout>
      <ChunkErrorBoundary>
        <Routes>
          {/* SEO Authority Handshake: Redirect root to default lang */}
          <Route path="/" element={<Navigate to="/en" replace />} />

          {/* Supported Language Subdirectories */}
          <Route path="/:lang" element={<LanguageWrapper />}>
            {/* Public */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="signup-surgery" element={<SignupSurgery />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="auth/post-login" element={<PostLoginRouter />} />
            <Route path="products" element={<Products />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="product" element={<ProductDetail />} />
            <Route path="product/:productId" element={<ProductDetail />} />
            <Route path="compare" element={<CompareProducts />} />
            <Route path="rfq" element={<RFQMarketplace />} />
            <Route path="rfq/detail" element={<RFQDetail />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="supplier" element={<SupplierProfile />} />
            <Route path="business/:id" element={<BusinessProfile />} />
            <Route path="categories" element={<Categories />} />
            <Route path="countries" element={<Countries />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="contact" element={<Contact />} />
            <Route path="help" element={<Help />} />
            <Route path="about" element={<About />} />
            <Route path="about-us" element={<About />} />
            <Route path="afrikoni-code" element={<AfrikoniCode />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="buyer-hub" element={<BuyerHub />} />
            <Route path="supplier-hub" element={<SupplierHub />} />
            <Route path="trust" element={<Trust />} />
            <Route path="order-protection" element={<OrderProtection />} />
            <Route path="community" element={<Community />} />
            <Route path="trending" element={<Trending />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="become-supplier" element={<BecomeSupplier />} />
            <Route path="services/suppliers" element={<ServiceSuppliers />} />
            <Route path="services/buyers" element={<ServiceBuyers />} />
            <Route path="protection" element={<TradeProtection />} />
            <Route path="escrow-policy" element={<EscrowPolicy />} />

            <Route path="inbox-mobile" element={
              <ProtectedRoute>
                <InboxMobile />
              </ProtectedRoute>
            } />
            <Route path="rfq/create-mobile" element={
              <ProtectedRoute>
                <RFQMobileWizard />
              </ProtectedRoute>
            } />

            <Route
              path="onboarding/company"
              element={
                <ProtectedRoute>
                  <SupplierOnboarding />
                </ProtectedRoute>
              }
            />

            <Route path="sitemap.xml" element={<SitemapXML />} />

            {/* Legal Pages - P0 Priority from Audit */}
            <Route path="legal/terms" element={<TermsOfService />} />
            <Route path="legal/privacy" element={<PrivacyPolicyPage />} />

            {/* Legacy Legal Routes (redirect to new paths) */}
            <Route path="privacy-policy" element={<Navigate to="/en/legal/privacy" replace />} />
            <Route path="terms-and-conditions" element={<Navigate to="/en/legal/terms" replace />} />
            <Route path="terms-enforcement" element={<TermsEnforcement />} />
            <Route path="cookie-policy" element={<CookiePolicy />} />

            {/* Unified Dashboard Router */}
            <Route
              path="dashboard/*"
              element={
                <RequireCapability require={null}>
                  <Dashboard />
                </RequireCapability>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductsNewPage />} />
              <Route path="products/edit/:productId" element={<ProductsEditPage />} />
              <Route path="sales" element={<TradeMonitor viewMode="sell" />} />
              <Route path="supplier-rfqs" element={<RFQMonitor viewMode="supplier" />} />
              <Route path="supplier-analytics" element={<SupplierAnalyticsPage />} />
              <Route path="orders" element={<TradeMonitor viewMode="buy" />} />
              <Route path="orders/:id" element={<TradeWorkspacePage />} />
              <Route path="rfqs" element={<RFQMonitor viewMode="buyer" />} />
              <Route path="rfqs/new" element={<RFQsNewPage />} />
              <Route path="rfqs/:id" element={<TradeWorkspacePage />} />
              <Route path="trade/:id" element={<TradeWorkspacePage />} />
              <Route path="saved" element={<SavedItemsPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="shipments/:id" element={<ShipmentDetailPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="trust-center" element={<TrustHealthPage />} />
              <Route path="verification-center" element={<VerificationCenter />} />
              <Route path="network" element={<NetworkDashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="koniai" element={<KoniAIPage />} />
              <Route path="control-plane" element={<ControlPlanePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="company-info" element={<CompanyInfoPage />} />
              <Route path="team-members" element={<TeamMembersPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="revenue" element={<RevenuePage />} />
            </Route>
          </Route>


          {/* Legacy Support Redirects */}
          <Route path="/marketplace" element={<SmartRedirect />} />
          <Route path="/products" element={<SmartRedirect />} />
          <Route path="/product/*" element={<SmartRedirect />} />
          <Route path="/dashboard/*" element={<SmartRedirect />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
      </ChunkErrorBoundary>
    </Layout>
  );
}

function App() {
  // 🔒 SECURITY: Migrate unencrypted localStorage to encrypted storage on boot
  useEffect(() => {
    try {
      migrateToSecureStorage();
    } catch (error) {
      console.error('❌ localStorage migration failed:', error);
      // Non-blocking - app continues even if migration fails
    }
  }, []);

  return (
    <ErrorBoundary fallbackMessage="System error. Please refresh the page or contact support.">
      <HelmetProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <HreflangTags />
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

                        <AppContent />
                      </WorkspaceModeProvider>
                    </TradeProvider>
                  </CapabilityProvider>
                </RoleProvider>
              </UserProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
