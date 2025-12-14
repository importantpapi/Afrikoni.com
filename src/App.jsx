import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { PageLoader } from './components/ui/skeletons';
import { LanguageProvider } from './i18n/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useIdlePreloading, setupLinkPreloading } from './utils/preloadData';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { useBrowserNavigation } from './hooks/useBrowserNavigation';

// Lightweight routes - keep as regular imports for faster initial load
import Home from './pages/index';
import Login from './pages/login';
import Signup from './pages/signup';
import Onboarding from './pages/onboarding';
import AuthCallback from './pages/auth-callback';
import NotFound from './pages/NotFound';
import SitemapXML from './pages/sitemap.xml';
import PrivacyPolicy from './pages/privacy-policy';
import TermsAndConditions from './pages/terms-and-conditions';
import CookiePolicy from './pages/cookie-policy';

// Lazy-loaded heavy routes - Dashboard
const Dashboard = lazy(() => import('./pages/dashboard'));
const DashboardOrders = lazy(() => import('./pages/dashboard/orders'));
const OrderDetailPage = lazy(() => import('./pages/dashboard/orders/[id]'));
const DashboardRFQs = lazy(() => import('./pages/dashboard/rfqs'));
const RFQDetailPage = lazy(() => import('./pages/dashboard/rfqs/[id]'));
const DashboardProducts = lazy(() => import('./pages/dashboard/products'));
const ProductForm = lazy(() => import('./pages/dashboard/products/new'));
const DashboardSales = lazy(() => import('./pages/dashboard/sales'));
const DashboardShipments = lazy(() => import('./pages/dashboard/shipments'));
const ShipmentDetailPage = lazy(() => import('./pages/dashboard/shipments/[id]'));
const NewShipmentPage = lazy(() => import('./pages/dashboard/shipments/new'));
const LogisticsDashboard = lazy(() => import('./pages/dashboard/logistics-dashboard'));
const DashboardAnalytics = lazy(() => import('./pages/dashboard/analytics'));
const SupplierAnalytics = lazy(() => import('./pages/dashboard/supplier-analytics'));
const DashboardPayments = lazy(() => import('./pages/dashboard/payments'));
const DashboardInvoices = lazy(() => import('./pages/dashboard/invoices'));
const DashboardReturns = lazy(() => import('./pages/dashboard/returns'));
const DashboardReviews = lazy(() => import('./pages/dashboard/reviews'));
const DashboardFulfillment = lazy(() => import('./pages/dashboard/fulfillment'));
const DashboardPerformance = lazy(() => import('./pages/dashboard/performance'));
const EscrowDetail = lazy(() => import('./pages/dashboard/escrow/[orderId]'));
const InvoiceDetailPage = lazy(() => import('./pages/dashboard/invoices/[id]'));
const ReturnDetailPage = lazy(() => import('./pages/dashboard/returns/[id]'));
const AdminLeads = lazy(() => import('./pages/dashboard/admin/leads'));
const AdminKYB = lazy(() => import('./pages/dashboard/admin/kyb'));
const AdminDisputes = lazy(() => import('./pages/dashboard/admin/disputes'));
const DashboardProtection = lazy(() => import('./pages/dashboard/protection'));
const DashboardSaved = lazy(() => import('./pages/dashboard/saved'));
const DashboardSettings = lazy(() => import('./pages/dashboard/settings'));
const CompanyInfo = lazy(() => import('./pages/dashboard/company-info'));
const NotificationsCenter = lazy(() => import('./pages/dashboard/notifications'));
const DashboardHelp = lazy(() => import('./pages/dashboard/help'));
const TestEmails = lazy(() => import('./pages/dashboard/test-emails'));
const KoniAIHub = lazy(() => import('./pages/dashboard/koniai'));
const RiskManagement = lazy(() => import('./pages/dashboard/risk'));
const ComplianceCenter = lazy(() => import('./pages/dashboard/compliance'));
const KYCTracker = lazy(() => import('./pages/dashboard/kyc'));
const AntiCorruption = lazy(() => import('./pages/dashboard/anticorruption'));
const CrisisManagement = lazy(() => import('./pages/dashboard/crisis'));
const AuditLogs = lazy(() => import('./pages/dashboard/audit'));
const AdminDashboard = lazy(() => import('./pages/admindashboard'));
const AdminUsers = lazy(() => import('./pages/dashboard/admin/users'));
const AdminReview = lazy(() => import('./pages/dashboard/admin/review'));
const AdminVerificationReview = lazy(() => import('./pages/dashboard/admin/verification-review'));
const AdminAnalytics = lazy(() => import('./pages/dashboard/admin/analytics'));
const AdminMarketplace = lazy(() => import('./pages/dashboard/admin/marketplace'));
const AdminReviews = lazy(() => import('./pages/dashboard/admin/reviews'));
const AdminRevenue = lazy(() => import('./pages/dashboard/admin/revenue'));
const AdminSupportTickets = lazy(() => import('./pages/dashboard/admin/support-tickets'));
const AdminGrowthMetrics = lazy(() => import('./pages/dashboard/admin/growth-metrics'));
const AdminOnboardingTracker = lazy(() => import('./pages/dashboard/admin/onboarding-tracker'));
const SupportChat = lazy(() => import('./pages/dashboard/support-chat'));
const UserDisputes = lazy(() => import('./pages/dashboard/disputes'));
const SubscriptionsPage = lazy(() => import('./pages/dashboard/subscriptions'));
const LogisticsQuotePage = lazy(() => import('./pages/dashboard/logistics-quote'));
const VerificationMarketplace = lazy(() => import('./pages/dashboard/verification-marketplace'));
const TeamMembersPage = lazy(() => import('./pages/dashboard/team-members'));
const SupplierAcquisitionPage = lazy(() => import('./pages/supplier-acquisition/[country]'));
const LogisticsPartnerOnboarding = lazy(() => import('./pages/logistics-partner-onboarding'));
const LogisticsHubPage = lazy(() => import('./pages/logistics-hub/[country]'));

// Lazy-loaded heavy routes - Marketplace
const Products = lazy(() => import('./pages/products'));
const Marketplace = lazy(() => import('./pages/marketplace'));
const ProductDetail = lazy(() => import('./pages/productdetails'));
const CompareProducts = lazy(() => import('./pages/compare'));
const RFQMarketplace = lazy(() => import('./pages/rfq-marketplace'));
const RFQDetail = lazy(() => import('./pages/rfqdetails'));
const Suppliers = lazy(() => import('./pages/suppliers'));
const SupplierProfile = lazy(() => import('./pages/supplierprofile'));
const BusinessProfile = lazy(() => import('./pages/business/[id]'));

// Lazy-loaded heavy routes - Other pages
const AddProduct = lazy(() => import('./pages/addproduct'));
const AddProductSmart = lazy(() => import('./pages/addproduct-smart'));
const AddProductSimple = lazy(() => import('./pages/addproduct-simple'));
const AddProductAlibaba = lazy(() => import('./pages/addproduct-alibaba'));
const CreateRFQ = lazy(() => import('./pages/createrfq'));
const Categories = lazy(() => import('./pages/categories'));
const Orders = lazy(() => import('./pages/orders'));
const OrderDetail = lazy(() => import('./pages/orderdetails'));
const MessagesPremium = lazy(() => import('./pages/messages-premium'));
const VerificationCenter = lazy(() => import('./pages/verification-center'));
const Analytics = lazy(() => import('./pages/analytics'));
const TradeFinancing = lazy(() => import('./pages/tradefinancing'));
const AIMatchmaking = lazy(() => import('./pages/aimatchmaking'));
const PaymentGateway = lazy(() => import('./pages/payementgateways'));
const MultiCurrency = lazy(() => import('./pages/multicurrency'));
const BuyerCentral = lazy(() => import('./pages/buyercentral'));
const Help = lazy(() => import('./pages/help'));
const Contact = lazy(() => import('./pages/contact'));
const RFQManagement = lazy(() => import('./pages/rfqmanagement'));
const Investors = lazy(() => import('./pages/investors'));
const ResourcesIndex = lazy(() => import('./pages/resources/index'));
const HowToSourceVerifiedAfricanSuppliers = lazy(() => import('./pages/resources/how-to-source-verified-african-suppliers'));
const KycKybAndAmlForAfricanB2BTrade = lazy(() => import('./pages/resources/kyc-kyb-and-aml-for-african-b2b-trade'));
const EscrowVsAdvancePaymentsInAfricanTrade = lazy(() => import('./pages/resources/escrow-vs-advance-payments-in-african-trade'));
const SellerGrowth = lazy(() => import('./pages/sellergrowth'));
const SellerOnboarding = lazy(() => import('./pages/selleronboarding'));
const OrderProtection = lazy(() => import('./pages/order-protection'));
const BuyerHub = lazy(() => import('./pages/buyer-hub'));
const SupplierHub = lazy(() => import('./pages/supplier-hub'));
const Logistics = lazy(() => import('./pages/logistics'));
// Countries page - regular import to avoid chunk loading issues
import Countries from './pages/countries';
const Trending = lazy(() => import('./pages/trending'));
const TradeShield = lazy(() => import('./pages/protection'));
const InspectionServices = lazy(() => import('./pages/inspection'));
const Pricing = lazy(() => import('./pages/pricing'));
const AntiFraud = lazy(() => import('./pages/anti-fraud'));
const Disputes = lazy(() => import('./pages/disputes'));
const BecomeSupplier = lazy(() => import('./pages/become-supplier'));
const Terms = lazy(() => import('./pages/terms'));
const Privacy = lazy(() => import('./pages/privacy'));
const Cookies = lazy(() => import('./pages/cookies'));
const SellerAgreement = lazy(() => import('./pages/seller-agreement'));
const BuyerProtectionPolicy = lazy(() => import('./pages/buyer-protection'));
const AntiCorruptionPolicy = lazy(() => import('./pages/anti-corruption-policy'));
const EscrowPolicy = lazy(() => import('./pages/escrow-policy'));
const SupplierOnboarding = lazy(() => import('./pages/supplier-onboarding'));
const TrustCenter = lazy(() => import('./pages/trust'));
const HowPaymentWorks = lazy(() => import('./pages/how-payment-works'));
const HowItWorks = lazy(() => import('./pages/how-it-works'));
const About = lazy(() => import('./pages/about'));
const Community = lazy(() => import('./pages/community'));
const Blog = lazy(() => import('./pages/blog'));
const Troubleshooting = lazy(() => import('./pages/troubleshooting'));
const Downloads = lazy(() => import('./pages/resources/downloads'));
const SuppliersService = lazy(() => import('./pages/services/suppliers'));
const BuyersService = lazy(() => import('./pages/services/buyers'));
const LogisticsService = lazy(() => import('./pages/services/logistics'));
const Enterprise = lazy(() => import('./pages/enterprise'));

function App() {
  // Setup session refresh to keep users logged in
  useSessionRefresh();
  
  // Setup browser navigation support (back/forward buttons, keyboard shortcuts)
  useBrowserNavigation();
  
  // Setup preloading on mount
  useEffect(() => {
    setupLinkPreloading();
    // useIdlePreloading is not a hook, call it directly
    if (typeof window !== 'undefined') {
      useIdlePreloading();
    }
  }, []);

  return (
    <LanguageProvider>
      <CurrencyProvider>
        <ScrollToTop />
        <Toaster position="top-right" />
        <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
            <Route path="/supplier-onboarding" element={<ProtectedRoute><SupplierOnboarding /></ProtectedRoute>} />
            {/* Trust & Verification Center */}
            <Route path="/dashboard/verification" element={<ProtectedRoute><VerificationCenter /></ProtectedRoute>} />
            <Route path="/verification-center" element={<ProtectedRoute><VerificationCenter /></ProtectedRoute>} />
            <Route path="/products" element={<Products />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/product" element={<ProductDetail />} />
            <Route path="/compare" element={<CompareProducts />} />
            <Route path="/products/add" element={<ProtectedRoute><AddProductSmart /></ProtectedRoute>} />
            <Route path="/products/add-smart" element={<ProtectedRoute><AddProductSmart /></ProtectedRoute>} />
            <Route path="/products/add-old" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/rfq/create" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
            <Route path="/rfq" element={<RFQMarketplace />} />
            <Route path="/rfq/detail" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
            <Route path="/rfq-management" element={<ProtectedRoute><RFQManagement /></ProtectedRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/supplier" element={<SupplierProfile />} />
            <Route path="/business/:id" element={<BusinessProfile />} />
            <Route path="/become-supplier" element={<BecomeSupplier />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/sitemap.xml" element={<SitemapXML />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPremium /></ProtectedRoute>} />
            {/* Unified Dashboard - handles all roles */}
            <Route path="/dashboard" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/buyer" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/seller" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/hybrid" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/logistics" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/dashboard/admin/review" element={<ProtectedRoute><AdminReview /></ProtectedRoute>} />
            <Route path="/dashboard/admin/verification-review" element={<ProtectedRoute><AdminVerificationReview /></ProtectedRoute>} />
            <Route path="/dashboard/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/admin/marketplace" element={<ProtectedRoute><AdminMarketplace /></ProtectedRoute>} />
            <Route path="/dashboard/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
            <Route path="/dashboard/admin/revenue" element={<ProtectedRoute><AdminRevenue /></ProtectedRoute>} />
            <Route path="/dashboard/admin/growth-metrics" element={<ProtectedRoute><AdminGrowthMetrics /></ProtectedRoute>} />
            <Route path="/dashboard/admin/onboarding-tracker" element={<ProtectedRoute><AdminOnboardingTracker /></ProtectedRoute>} />
            <Route path="/dashboard/admin/leads" element={<ProtectedRoute><AdminLeads /></ProtectedRoute>} />
            <Route path="/dashboard/admin/kyb" element={<ProtectedRoute><AdminKYB /></ProtectedRoute>} />
            <Route path="/dashboard/admin/disputes" element={<ProtectedRoute><AdminDisputes /></ProtectedRoute>} />
            <Route path="/dashboard/admin/support-tickets" element={<ProtectedRoute><AdminSupportTickets /></ProtectedRoute>} />
            <Route path="/dashboard/admin/onboarding-tracker" element={<ProtectedRoute><AdminOnboardingTracker /></ProtectedRoute>} />
            {/* Dashboard sub-pages */}
            <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardOrders /></ProtectedRoute>} />
            <Route path="/dashboard/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/orders/:orderId/logistics-quote" element={<ProtectedRoute><LogisticsQuotePage /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs" element={<ProtectedRoute><DashboardRFQs /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs/new" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs/:id" element={<ProtectedRoute><RFQDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/products" element={<ProtectedRoute><DashboardProducts /></ProtectedRoute>} />
            <Route path="/dashboard/products/new" element={<ProtectedRoute><AddProductAlibaba /></ProtectedRoute>} />
            <Route path="/dashboard/products/:id/edit" element={<ProtectedRoute><AddProductAlibaba /></ProtectedRoute>} />
            <Route path="/products/add" element={<ProtectedRoute><AddProductAlibaba /></ProtectedRoute>} />
            <Route path="/dashboard/sales" element={<ProtectedRoute><DashboardSales /></ProtectedRoute>} />
            <Route path="/dashboard/shipments" element={<ProtectedRoute><DashboardShipments /></ProtectedRoute>} />
            <Route path="/dashboard/shipments/new" element={<ProtectedRoute><NewShipmentPage /></ProtectedRoute>} />
            <Route path="/dashboard/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/supplier-analytics" element={<ProtectedRoute><SupplierAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><DashboardPayments /></ProtectedRoute>} />
            <Route path="/dashboard/invoices" element={<ProtectedRoute><DashboardInvoices /></ProtectedRoute>} />
            <Route path="/dashboard/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/returns" element={<ProtectedRoute><DashboardReturns /></ProtectedRoute>} />
            <Route path="/dashboard/returns/:id" element={<ProtectedRoute><ReturnDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/reviews" element={<ProtectedRoute><DashboardReviews /></ProtectedRoute>} />
            <Route path="/dashboard/fulfillment" element={<ProtectedRoute><DashboardFulfillment /></ProtectedRoute>} />
            <Route path="/dashboard/performance" element={<ProtectedRoute><DashboardPerformance /></ProtectedRoute>} />
            <Route path="/dashboard/escrow/:orderId" element={<ProtectedRoute><EscrowDetail /></ProtectedRoute>} />
            <Route path="/dashboard/protection" element={<ProtectedRoute><DashboardProtection /></ProtectedRoute>} />
            <Route path="/dashboard/saved" element={<ProtectedRoute><DashboardSaved /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/dashboard/company-info" element={<ProtectedRoute><CompanyInfo /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
            <Route path="/dashboard/help" element={<ProtectedRoute><DashboardHelp /></ProtectedRoute>} />
            <Route path="/dashboard/koniai" element={<ProtectedRoute><KoniAIHub /></ProtectedRoute>} />
            <Route path="/dashboard/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
            <Route path="/dashboard/verification-marketplace" element={<ProtectedRoute><VerificationMarketplace /></ProtectedRoute>} />
            <Route path="/dashboard/team-members" element={<ProtectedRoute><TeamMembersPage /></ProtectedRoute>} />
            <Route path="/dashboard/support-chat" element={<ProtectedRoute><SupportChat /></ProtectedRoute>} />
            <Route path="/dashboard/disputes" element={<ProtectedRoute><UserDisputes /></ProtectedRoute>} />
            <Route path="/supplier-acquisition/:country?" element={<SupplierAcquisitionPage />} />
            <Route path="/supplier-acquisition" element={<SupplierAcquisitionPage />} />
            <Route path="/logistics-partner-onboarding" element={<LogisticsPartnerOnboarding />} />
            <Route path="/logistics-hub/:country?" element={<LogisticsHubPage />} />
            <Route path="/logistics-hub" element={<LogisticsHubPage />} />
            <Route path="/dashboard/test-emails" element={<ProtectedRoute><TestEmails /></ProtectedRoute>} />
            {/* Risk & Compliance Routes */}
            <Route path="/dashboard/risk" element={<ProtectedRoute><RiskManagement /></ProtectedRoute>} />
            <Route path="/dashboard/compliance" element={<ProtectedRoute><ComplianceCenter /></ProtectedRoute>} />
            <Route path="/dashboard/kyc" element={<ProtectedRoute><KYCTracker /></ProtectedRoute>} />
            <Route path="/dashboard/anticorruption" element={<ProtectedRoute><AntiCorruption /></ProtectedRoute>} />
            <Route path="/dashboard/crisis" element={<ProtectedRoute><CrisisManagement /></ProtectedRoute>} />
            <Route path="/dashboard/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/financing" element={<TradeFinancing />} />
            <Route path="/ai-matchmaking" element={<AIMatchmaking />} />
            <Route path="/payment" element={<PaymentGateway />} />
            <Route path="/currency" element={<MultiCurrency />} />
            <Route path="/buyer-central" element={<BuyerCentral />} />
            <Route path="/buyer-hub" element={<BuyerHub />} />
            <Route path="/supplier-hub" element={<SupplierHub />} />
            <Route path="/order-protection" element={<OrderProtection />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/protection" element={<TradeShield />} />
            <Route path="/inspection" element={<InspectionServices />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/anti-fraud" element={<AntiFraud />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/trust" element={<TrustCenter />} />
            <Route path="/how-payment-works" element={<HowPaymentWorks />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/community" element={<Community />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/troubleshooting" element={<Troubleshooting />} />
            {/* Service Pages */}
            <Route path="/services/suppliers" element={<SuppliersService />} />
            <Route path="/services/buyers" element={<BuyersService />} />
            <Route path="/services/logistics" element={<LogisticsService />} />
            {/* Insights / Resources */}
              <Route path="/resources" element={<ResourcesIndex />} />
              <Route path="/resources/downloads" element={<Downloads />} />
              <Route path="/resources/how-to-source-verified-african-suppliers" element={<HowToSourceVerifiedAfricanSuppliers />} />
              <Route path="/resources/kyc-kyb-and-aml-for-african-b2b-trade" element={<KycKybAndAmlForAfricanB2BTrade />} />
              <Route path="/resources/escrow-vs-advance-payments-in-african-trade" element={<EscrowVsAdvancePaymentsInAfricanTrade />} />
            <Route path="/seller-growth" element={<SellerGrowth />} />
            <Route path="/seller-onboarding" element={<SellerOnboarding />} />
            {/* Legal & Policies */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/seller-agreement" element={<SellerAgreement />} />
            <Route path="/buyer-protection" element={<BuyerProtectionPolicy />} />
            <Route path="/anti-corruption-policy" element={<AntiCorruptionPolicy />} />
            <Route path="/escrow-policy" element={<EscrowPolicy />} />
            {/* Catch-all 404 route - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;

