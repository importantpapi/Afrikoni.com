export const createPageUrl = (pageName) => {
  const routes = {
    'Home': '/',
    'Products': '/products',
    'ProductDetail': '/product',
    'Categories': '/categories',
    'Suppliers': '/suppliers',
    'SupplierProfile': '/supplier',
    'CreateRFQ': '/rfq/create',
    'RFQDetail': '/rfq/detail',
    'RFQManagement': '/rfq-management',
    'Orders': '/orders',
    'OrderDetail': '/order',
    'Messages': '/messages',
    // ✅ UNIFIED WORKSPACE: Legacy role-based aliases point to the unified kernel dashboard
    'SellerDashboard': '/dashboard',
    'BuyerDashboard': '/dashboard',
    'AdminDashboard': '/dashboard/admin',
    'LogisticsDashboard': '/dashboard',
    'HybridDashboard': '/dashboard',
    'AddProduct': '/dashboard/products/new',
    'Analytics': '/analytics',
    'TradeFinancing': '/financing',
    'AIMatchmaking': '/ai-matchmaking',
    'PaymentGateway': '/payment',
    'MultiCurrency': '/currency',
    'Login': '/login',
    'Signup': '/signup',
    'SellerGrowth': '/seller-growth',
    'SellerOnboarding': '/seller-onboarding',
    'BuyerCentral': '/buyer-central',
    'Profile': '/dashboard',
    'Settings': '/dashboard',
    'Verification': '/dashboard/verification',
    'Help': '/help',
    'Contact': '/contact',
    'Investors': '/investors'
  };
  return routes[pageName] || '/';
};

