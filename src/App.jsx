import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { PageLoader } from './components/ui/skeletons';
import { LanguageProvider } from './i18n/LanguageContext';
import { useIdlePreloading, setupLinkPreloading } from './utils/preloadData';

// Lightweight routes - keep as regular imports for faster initial load
import Home from './pages/index';
import Login from './pages/login';
import Signup from './pages/signup';
import Onboarding from './pages/onboarding';
import AuthCallback from './pages/auth-callback';
import NotFound from './pages/NotFound';
import SitemapXML from './pages/sitemap.xml';

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
const LogisticsDashboard = lazy(() => import('./pages/dashboard/logistics-dashboard'));
const DashboardAnalytics = lazy(() => import('./pages/dashboard/analytics'));
const SupplierAnalytics = lazy(() => import('./pages/dashboard/supplier-analytics'));
const DashboardPayments = lazy(() => import('./pages/dashboard/payments'));
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
const AdminAnalytics = lazy(() => import('./pages/dashboard/admin/analytics'));
const AdminMarketplace = lazy(() => import('./pages/dashboard/admin/marketplace'));
const AdminReviews = lazy(() => import('./pages/dashboard/admin/reviews'));
const AdminRevenue = lazy(() => import('./pages/dashboard/admin/revenue'));

// Lazy-loaded heavy routes - Marketplace
const Products = lazy(() => import('./pages/products'));
const Marketplace = lazy(() => import('./pages/marketplace'));
const ProductDetail = lazy(() => import('./pages/productdetails'));
const CompareProducts = lazy(() => import('./pages/compare'));
const RFQMarketplace = lazy(() => import('./pages/rfq-marketplace'));
const RFQDetail = lazy(() => import('./pages/rfqdetails'));
const Suppliers = lazy(() => import('./pages/suppliers'));
const SupplierProfile = lazy(() => import('./pages/supplierprofile'));

// Lazy-loaded heavy routes - Other pages
const AddProduct = lazy(() => import('./pages/addproduct'));
const AddProductSmart = lazy(() => import('./pages/addproduct-smart'));
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
const Countries = lazy(() => import('./pages/countries'));
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

function App() {
  // Setup preloading on mount
  useEffect(() => {
    setupLinkPreloading();
    useIdlePreloading();
  }, []);

  return (
    <LanguageProvider>
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
            <Route path="/product" element={<ProductDetail />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/compare" element={<CompareProducts />} />
            <Route path="/products/add" element={<ProtectedRoute><AddProductSmart /></ProtectedRoute>} />
            <Route path="/products/add-old" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/rfq/create" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
            <Route path="/rfq" element={<RFQMarketplace />} />
            <Route path="/rfq/detail" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
            <Route path="/rfq-management" element={<ProtectedRoute><RFQManagement /></ProtectedRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/supplier" element={<SupplierProfile />} />
            <Route path="/become-supplier" element={<BecomeSupplier />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/countries" element={<Countries />} />
            <Route path="/sitemap.xml" element={<SitemapXML />} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPremium /></ProtectedRoute>} />
            {/* Unified Dashboard - handles all roles */}
            <Route path="/dashboard" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/buyer" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/seller" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/hybrid" element={<ProtectedRoute requireOnboarding={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/dashboard/admin/review" element={<ProtectedRoute><AdminReview /></ProtectedRoute>} />
            <Route path="/dashboard/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/admin/marketplace" element={<ProtectedRoute><AdminMarketplace /></ProtectedRoute>} />
            <Route path="/dashboard/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
            <Route path="/dashboard/admin/revenue" element={<ProtectedRoute><AdminRevenue /></ProtectedRoute>} />
            {/* Dashboard sub-pages */}
            <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardOrders /></ProtectedRoute>} />
            <Route path="/dashboard/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs" element={<ProtectedRoute><DashboardRFQs /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs/new" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
            <Route path="/dashboard/rfqs/:id" element={<ProtectedRoute><RFQDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/products" element={<ProtectedRoute><DashboardProducts /></ProtectedRoute>} />
            <Route path="/dashboard/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
            <Route path="/dashboard/products/:id/edit" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
            <Route path="/dashboard/sales" element={<ProtectedRoute><DashboardSales /></ProtectedRoute>} />
            <Route path="/dashboard/shipments" element={<ProtectedRoute><DashboardShipments /></ProtectedRoute>} />
            <Route path="/dashboard/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/logistics" element={<ProtectedRoute><LogisticsDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><DashboardPayments /></ProtectedRoute>} />
            <Route path="/dashboard/protection" element={<ProtectedRoute><DashboardProtection /></ProtectedRoute>} />
            <Route path="/dashboard/saved" element={<ProtectedRoute><DashboardSaved /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/dashboard/company-info" element={<ProtectedRoute><CompanyInfo /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
            <Route path="/dashboard/help" element={<ProtectedRoute><DashboardHelp /></ProtectedRoute>} />
            <Route path="/dashboard/koniai" element={<ProtectedRoute><KoniAIHub /></ProtectedRoute>} />
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
            {/* Insights / Resources */}
            <Route path="/resources" element={<ResourcesIndex />} />
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
    </LanguageProvider>
  );
}

export default App;

