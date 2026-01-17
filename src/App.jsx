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
import Dashboard from './pages/dashboard';
import DashboardHome from './pages/dashboard/DashboardHome';
import PostLoginRouter from './auth/PostLoginRouter';

/* ===== Lazy dashboard pages ===== */
const OrdersPage = lazy(() => import('./pages/dashboard/orders'));
const RFQsPage = lazy(() => import('./pages/dashboard/rfqs'));
const RFQsNewPage = lazy(() => import('./pages/dashboard/rfqs/new'));
const ProductsPage = lazy(() => import('./pages/dashboard/products'));
const SalesPage = lazy(() => import('./pages/dashboard/sales'));
const PaymentsPage = lazy(() => import('./pages/dashboard/payments'));
const SettingsPage = lazy(() => import('./pages/dashboard/settings'));

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
const Pricing = lazy(() => import('./pages/pricing'));
const SupplierOnboarding = lazy(() => import('./pages/supplier-onboarding'));

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

  useSessionRefresh();
  useBrowserNavigation();

  useEffect(() => {
    // Only setup preloading after auth is ready
    if (authReady) {
    setupLinkPreloading();
    if (typeof window !== 'undefined') {
      useIdlePreloading();
    }
    }
  }, [authReady]); // Only run when auth is ready

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
          <Route path="/pricing" element={<Pricing />} />

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

          {/* ✅ PHASE 6: Capability-based dashboard routes with persistent layout */}
          {/* 🚨 CRITICAL: Dashboard requires company_id and capability.ready */}
          {/* Wrap with CapabilityProvider so RequireCapability can access capabilities */}
          {/* DashboardLayout stays mounted - only child routes change via <Outlet /> */}
          <Route
            path="/dashboard/*"
            element={
              <CapabilityProvider>
                <RequireCapability require={null}>
                  <Dashboard />
                </RequireCapability>
              </CapabilityProvider>
            }
          >
            {/* ✅ Nested routes - DashboardLayout (in WorkspaceDashboard) stays mounted */}
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="rfqs" element={<RFQsPage />} />
            <Route path="rfqs/new" element={<RFQsNewPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* ✅ Admin Routes - Protected by admin check in ProtectedRoute */}
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
        {/* ✅ CRITICAL: AuthProvider MUST come before RoleProvider */}
        <AuthProvider>
          <UserProvider>
            {/* ✅ RoleProvider now uses AuthProvider's data */}
            <RoleProvider>

              <ScrollToTop />
              <Toaster position="top-right" />
              
              {/* Debug component to detect stuck auth */}
              <DebugAuth />

              <AppContent />

            </RoleProvider>
          </UserProvider>
          </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;