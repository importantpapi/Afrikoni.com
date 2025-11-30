import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './layout';
import Home from './pages/index';
import Login from './pages/login';
import Signup from './pages/signup';
import VerificationCenter from './pages/verification-center';
import Products from './pages/products';
import ProductDetail from './pages/productdetails';
import AddProduct from './pages/addproduct';
import CreateRFQ from './pages/createrfq';
import Suppliers from './pages/suppliers';
import SupplierProfile from './pages/supplierprofile';
import Categories from './pages/categories';
import RFQDetail from './pages/rfqdetails';
import RFQMarketplace from './pages/rfq-marketplace';
import Orders from './pages/orders';
import OrderDetail from './pages/orderdetails';
import Messages from './pages/messages';
import MessagesPremium from './pages/messages-premium';
import AdminDashboard from './pages/admindashboard';
import Dashboard from './pages/dashboard';
import DashboardOrders from './pages/dashboard/orders';
import OrderDetailPage from './pages/dashboard/orders/[id]';
import DashboardRFQs from './pages/dashboard/rfqs';
import RFQDetailPage from './pages/dashboard/rfqs/[id]';
import DashboardProducts from './pages/dashboard/products';
import ProductForm from './pages/dashboard/products/new';
import DashboardSales from './pages/dashboard/sales';
import DashboardShipments from './pages/dashboard/shipments';
import ShipmentDetailPage from './pages/dashboard/shipments/[id]';
import DashboardAnalytics from './pages/dashboard/analytics';
import DashboardPayments from './pages/dashboard/payments';
import DashboardProtection from './pages/dashboard/protection';
import DashboardSaved from './pages/dashboard/saved';
import DashboardSettings from './pages/dashboard/settings';
import CompanyInfo from './pages/dashboard/company-info';
import NotificationsCenter from './pages/dashboard/notifications';
import DashboardHelp from './pages/dashboard/help';
import Analytics from './pages/analytics';
import TradeFinancing from './pages/tradefinancing';
import AIMatchmaking from './pages/aimatchmaking';
import PaymentGateway from './pages/payementgateways';
import MultiCurrency from './pages/multicurrency';
import BuyerCentral from './pages/buyercentral';
import Help from './pages/help';
import Contact from './pages/contact';
import RFQManagement from './pages/rfqmanagement';
import Investors from './pages/investors';
import SellerGrowth from './pages/sellergrowth';
import SellerOnboarding from './pages/selleronboarding';
import OrderProtection from './pages/order-protection';
import BuyerHub from './pages/buyer-hub';
import SupplierHub from './pages/supplier-hub';
import Logistics from './pages/logistics';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verification" element={<ProtectedRoute><VerificationCenter /></ProtectedRoute>} />
          <Route path="/dashboard/verification" element={<ProtectedRoute><VerificationCenter /></ProtectedRoute>} />
          <Route path="/products" element={<Products />} />
          <Route path="/marketplace" element={<Products />} />
          <Route path="/product" element={<ProductDetail />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/products/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/rfq/create" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
          <Route path="/rfq" element={<RFQMarketplace />} />
          <Route path="/rfq/detail" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
          <Route path="/rfq-management" element={<ProtectedRoute><RFQManagement /></ProtectedRoute>} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/supplier" element={<SupplierProfile />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPremium /></ProtectedRoute>} />
          <Route path="/messages/old" element={<Messages />} />
                {/* Unified Dashboard - handles all roles */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/seller" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/buyer" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/hybrid" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/logistics" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                {/* Dashboard sub-pages */}
                <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardOrders /></ProtectedRoute>} />
                <Route path="/dashboard/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/dashboard/rfqs" element={<ProtectedRoute><DashboardRFQs /></ProtectedRoute>} />
                <Route path="/dashboard/rfqs/new" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
                <Route path="/dashboard/rfqs/:id" element={<ProtectedRoute><RFQDetailPage /></ProtectedRoute>} />
                <Route path="/dashboard/products" element={<ProtectedRoute><DashboardProducts /></ProtectedRoute>} />
                <Route path="/dashboard/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                <Route path="/dashboard/sales" element={<ProtectedRoute><DashboardSales /></ProtectedRoute>} />
                <Route path="/dashboard/shipments" element={<ProtectedRoute><DashboardShipments /></ProtectedRoute>} />
                <Route path="/dashboard/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
                <Route path="/dashboard/payments" element={<ProtectedRoute><DashboardPayments /></ProtectedRoute>} />
                <Route path="/dashboard/protection" element={<ProtectedRoute><DashboardProtection /></ProtectedRoute>} />
                <Route path="/dashboard/saved" element={<ProtectedRoute><DashboardSaved /></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
                <Route path="/dashboard/company-info" element={<ProtectedRoute><CompanyInfo /></ProtectedRoute>} />
                <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
                <Route path="/dashboard/help" element={<ProtectedRoute><DashboardHelp /></ProtectedRoute>} />
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
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/seller-growth" element={<SellerGrowth />} />
          <Route path="/seller-onboarding" element={<SellerOnboarding />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;

