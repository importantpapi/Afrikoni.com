// Mock data for all pages - replace with Supabase queries later

export const mockBuyerStats = {
  ordersInProgress: 12,
  rfqsWaitingReply: 5,
  rfqsWithQuotes: 8,
  deliveredOrders30d: 24,
  savedSuppliers: 18,
  savedProducts: 42
};

export const mockSellerStats = {
  revenueThisMonth: 125000,
  ordersToFulfill: 8,
  awaitingPayment: 35000,
  lowStockItems: 5,
  productViews7d: 1240,
  unreadMessages: 12
};

export const mockHybridStats = {
  salesThisMonth: 125000,
  purchasesThisMonth: 85000,
  ordersAsSeller: 15,
  ordersAsBuyer: 8,
  rfqsSent: 12,
  rfqsReceived: 6
};

export const mockLogisticsStats = {
  activeShipments: 24,
  deliveriesThisWeek: 18,
  delayedShipments: 2,
  pickupsToday: 5,
  revenueThisMonth: 45000
};

export const mockOrders = [
  {
    id: 'ORD-001',
    product: 'Premium Cocoa Beans',
    supplier: 'Ghana Cocoa Co.',
    quantity: '500 KG',
    status: 'processing',
    orderDate: '2025-01-15',
    deliveryDate: '2025-02-10',
    amount: 12500
  },
  {
    id: 'ORD-002',
    product: 'African Print Fabrics',
    supplier: 'Textile Masters Ltd',
    quantity: '2000 meters',
    status: 'shipped',
    orderDate: '2025-01-10',
    deliveryDate: '2025-02-05',
    amount: 8500
  },
  {
    id: 'ORD-003',
    product: 'Shea Butter',
    supplier: 'Natural Beauty Exports',
    quantity: '1000 KG',
    status: 'delivered',
    orderDate: '2025-01-05',
    deliveryDate: '2025-01-28',
    amount: 6200
  }
];

export const mockRFQs = [
  {
    id: 'RFQ-001',
    title: 'Bulk Order: Cashew Nuts',
    category: 'Food & Beverages',
    quantity: '10,000 KG',
    status: 'open',
    responses: 5,
    createdDate: '2025-01-20',
    deadline: '2025-02-01'
  },
  {
    id: 'RFQ-002',
    title: 'Solar Panel Systems',
    category: 'Energy',
    quantity: '500 units',
    status: 'quoted',
    responses: 8,
    createdDate: '2025-01-18',
    deadline: '2025-01-30'
  }
];

export const mockProducts = [
  {
    id: 'PROD-001',
    name: 'Premium Organic Cocoa Beans',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
    price: '$2,500 - $3,000',
    moq: '500 KG',
    supplier: 'Ghana Cocoa Co.',
    country: 'Ghana',
    verified: true,
    rating: 4.8,
    responseTime: '< 24h',
    spec: 'Cocoa beans | 25KG bags'
  },
  {
    id: 'PROD-002',
    name: 'African Print Cotton Fabric',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400',
    price: '$4.50 - $6.00',
    moq: '100 meters',
    supplier: 'Textile Masters Ltd',
    country: 'Nigeria',
    verified: true,
    rating: 4.9,
    responseTime: '< 12h',
    spec: 'Cotton fabric | 1.5m width'
  },
  {
    id: 'PROD-003',
    name: 'Raw Shea Butter',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    price: '$6.20 - $8.50',
    moq: '200 KG',
    supplier: 'Natural Beauty Exports',
    country: 'Ghana',
    verified: true,
    rating: 4.7,
    responseTime: '< 24h',
    spec: 'Shea butter | Food grade'
  }
];

export const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'Ghana Cocoa Co.',
    country: 'Ghana',
    verified: true,
    premium: false,
    yearsInBusiness: 15,
    responseTime: '< 24h',
    rating: 4.8,
    totalProducts: 24,
    mainCategories: ['Food & Beverages', 'Agriculture']
  },
  {
    id: 'SUP-002',
    name: 'Textile Masters Ltd',
    country: 'Nigeria',
    verified: true,
    premium: true,
    yearsInBusiness: 8,
    responseTime: '< 12h',
    rating: 4.9,
    totalProducts: 45,
    mainCategories: ['Textiles', 'Apparel']
  }
];

export const mockMessages = [
  {
    id: 'MSG-001',
    counterpart: 'Ghana Cocoa Co.',
    role: 'supplier',
    country: 'Ghana',
    lastMessage: 'Thank you for your interest. We can offer...',
    unread: 2,
    timestamp: '2 hours ago',
    verified: true
  },
  {
    id: 'MSG-002',
    counterpart: 'Textile Masters Ltd',
    role: 'supplier',
    country: 'Nigeria',
    lastMessage: 'The samples have been shipped. Tracking...',
    unread: 0,
    timestamp: '1 day ago',
    verified: true
  }
];

