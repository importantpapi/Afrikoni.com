/**
 * Centralized Role Detection & Helper Functions
 * 
 * Provides single source of truth for:
 * - Role normalization
 * - Role type checks (buyer, seller, hybrid, logistics)
 * - Feature visibility checks
 * - Data loading decisions
 */

/**
 * Get user role from profile data
 * Normalizes logistics_partner to logistics
 * 
 * @param {Object} profile - User profile object
 * @returns {string} - Normalized role ('buyer', 'seller', 'hybrid', 'logistics')
 */
export function getUserRole(profile) {
  if (!profile) return 'buyer';
  
  const role = profile.role || profile.user_role || 'buyer';
  
  // Normalize logistics_partner to logistics
  return role === 'logistics_partner' ? 'logistics' : role;
}

/**
 * Check if user is buyer (or hybrid in buyer mode)
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function isBuyer(role, viewMode = 'everything') {
  if (!role) return false;
  if (role === 'buyer') return true;
  if (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'buyer')) return true;
  return false;
}

/**
 * Check if user is seller (or hybrid in seller mode)
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function isSeller(role, viewMode = 'everything') {
  if (!role) return false;
  if (role === 'seller') return true;
  if (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'seller')) return true;
  return false;
}

/**
 * Check if user is hybrid
 * 
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isHybrid(role) {
  return role === 'hybrid';
}

/**
 * Check if user is logistics partner
 * 
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isLogistics(role) {
  return role === 'logistics' || role === 'logistics_partner';
}

/**
 * Check if user can view buyer features
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users
 * @returns {boolean}
 */
export function canViewBuyerFeatures(role, viewMode = 'everything') {
  return isBuyer(role, viewMode);
}

/**
 * Check if user can view seller features
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users
 * @returns {boolean}
 */
export function canViewSellerFeatures(role, viewMode = 'everything') {
  return isSeller(role, viewMode);
}

/**
 * Determine if buyer data should be loaded
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function shouldLoadBuyerData(role, viewMode = 'everything') {
  if (!role) return false;
  if (role === 'buyer') return true;
  if (role === 'hybrid') {
    return viewMode === 'everything' || viewMode === 'buyer';
  }
  return false;
}

/**
 * Determine if seller data should be loaded
 * 
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function shouldLoadSellerData(role, viewMode = 'everything') {
  if (!role) return false;
  if (role === 'seller') return true;
  if (role === 'hybrid') {
    return viewMode === 'everything' || viewMode === 'seller';
  }
  return false;
}

/**
 * Get valid view modes for a role
 * 
 * @param {string} role - User role
 * @returns {string[]} - Array of valid view modes
 */
export function getValidViewModes(role) {
  if (role === 'hybrid') {
    return ['everything', 'buyer', 'seller'];
  }
  return [role]; // For non-hybrid, only their role is valid
}

