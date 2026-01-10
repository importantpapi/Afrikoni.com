// ==============================================
// ROLE CONSTANTS
// ==============================================
/**
 * Valid user roles in Afrikoni
 * @readonly
 * @enum {string}
 */
export const ROLES = Object.freeze({
  BUYER: 'buyer',
  SELLER: 'seller',
  LOGISTICS: 'logistics',
  HYBRID: 'hybrid',
});

// ==============================================
// ROLE VALIDATION
// ==============================================
/**
 * Check if a value is a valid role
 * @param {string|null} role - Role to validate
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

// ==============================================
// ROLE CHECKERS
// ==============================================
/**
 * Check if user has buyer capabilities
 * @param {string|null} role - User role
 * @returns {boolean}
 */
export const isBuyer = (role) => {
  return role === ROLES.BUYER || role === ROLES.HYBRID;
};

/**
 * Check if user has seller capabilities
 * @param {string|null} role - User role
 * @returns {boolean}
 */
export const isSeller = (role) => {
  return role === ROLES.SELLER || role === ROLES.HYBRID;
};

/**
 * Check if user has logistics capabilities
 * @param {string|null} role - User role
 * @returns {boolean}
 */
export const isLogistics = (role) => {
  return role === ROLES.LOGISTICS;
};

/**
 * Check if user has hybrid role
 * @param {string|null} role - User role
 * @returns {boolean}
 */
export const isHybrid = (role) => {
  return role === ROLES.HYBRID;
};

// ==============================================
// CAPABILITY SYSTEM
// ==============================================
/**
 * User capabilities based on role
 * @readonly
 */
export const CAPABILITIES = Object.freeze({
  [ROLES.BUYER]: ['browse', 'purchase', 'rfq', 'track_orders'],
  [ROLES.SELLER]: ['browse', 'sell', 'manage_products', 'fulfill_orders'],
  [ROLES.LOGISTICS]: ['browse', 'manage_shipments', 'track_deliveries'],
  [ROLES.HYBRID]: [
    'browse', 
    'purchase', 
    'sell', 
    'manage_products', 
    'rfq', 
    'track_orders', 
    'fulfill_orders'
  ],
});

/**
 * Check if user has a specific capability
 * @param {string|null} role - User role
 * @param {string} capability - Capability to check
 * @returns {boolean}
 */
export const hasCapability = (role, capability) => {
  if (!role || !isValidRole(role)) return false;
  return CAPABILITIES[role]?.includes(capability) ?? false;
};

/**
 * Get all capabilities for a role
 * @param {string|null} role - User role
 * @returns {string[]}
 */
export const getCapabilities = (role) => {
  if (!role || !isValidRole(role)) return ['browse']; // Guests can browse
  return CAPABILITIES[role] ?? [];
};

// ==============================================
// NAVIGATION HELPERS
// ==============================================
/**
 * Get dashboard route based on role
 * @param {string|null} role - User role
 * @returns {string}
 */
export const getDashboardRoute = (role) => {
  const routes = {
    [ROLES.BUYER]: '/dashboard/buyer',
    [ROLES.SELLER]: '/dashboard/seller',
    [ROLES.LOGISTICS]: '/dashboard/logistics',
    [ROLES.HYBRID]: '/dashboard', // Unified dashboard
  };
  return routes[role] ?? '/';
};

/**
 * Get human-readable role name
 * @param {string|null} role - User role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  const names = {
    [ROLES.BUYER]: 'Buyer',
    [ROLES.SELLER]: 'Seller',
    [ROLES.LOGISTICS]: 'Logistics Partner',
    [ROLES.HYBRID]: 'Buyer & Seller',
  };
  return names[role] ?? 'Guest';
};

/**
 * Get role badge color for UI
 * @param {string|null} role - User role
 * @returns {string} Tailwind color class
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.BUYER]: 'bg-blue-500',
    [ROLES.SELLER]: 'bg-green-500',
    [ROLES.LOGISTICS]: 'bg-purple-500',
    [ROLES.HYBRID]: 'bg-yellow-500',
  };
  return colors[role] ?? 'bg-gray-500';
};

// ==============================================
// ROLE-BASED NAVIGATION ITEMS
// ==============================================
/**
 * Get navigation items based on user role
 * @param {string|null} role - User role
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {Array} Navigation items
 */
export const getNavigationItems = (role, isAuthenticated) => {
  // Base navigation (everyone)
  const baseNav = [
    { key: 'nav-home', label: 'Home', path: '/', icon: 'home' },
    { key: 'nav-marketplace', label: 'Marketplace', path: '/marketplace', icon: 'store' },
    { key: 'nav-categories', label: 'Categories', path: '/categories', icon: 'category' },
  ];

  // Guest navigation
  if (!isAuthenticated) {
    return [
      ...baseNav,
      { key: 'nav-how-it-works', label: 'How It Works', path: '/how-it-works', icon: 'info' },
      { key: 'nav-login', label: 'Login', path: '/login', icon: 'login' },
    ];
  }

  // Role-specific navigation
  const roleNav = {
    [ROLES.BUYER]: [
      { key: 'nav-my-orders', label: 'My Orders', path: '/dashboard/orders', icon: 'shopping_bag' },
      { key: 'nav-rfqs', label: 'RFQs', path: '/dashboard/rfqs', icon: 'request_quote' },
      { key: 'nav-dashboard', label: 'Dashboard', path: '/dashboard/buyer', icon: 'dashboard' },
    ],
    [ROLES.SELLER]: [
      { key: 'nav-my-products', label: 'My Products', path: '/dashboard/products', icon: 'inventory' },
      { key: 'nav-orders', label: 'Orders', path: '/dashboard/orders', icon: 'local_shipping' },
      { key: 'nav-dashboard', label: 'Dashboard', path: '/dashboard/seller', icon: 'dashboard' },
    ],
    [ROLES.LOGISTICS]: [
      { key: 'nav-shipments', label: 'Shipments', path: '/dashboard/shipments', icon: 'local_shipping' },
      { key: 'nav-dashboard', label: 'Dashboard', path: '/dashboard/logistics', icon: 'dashboard' },
    ],
    [ROLES.HYBRID]: [
      { key: 'nav-dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { key: 'nav-buy', label: 'Buy', path: '/dashboard/orders', icon: 'shopping_bag' },
      { key: 'nav-sell', label: 'Sell', path: '/dashboard/products', icon: 'inventory' },
    ],
  };

  return [
    ...baseNav,
    ...(roleNav[role] || []),
    { key: 'nav-profile', label: 'Profile', path: '/dashboard/settings', icon: 'person' },
  ];
};

