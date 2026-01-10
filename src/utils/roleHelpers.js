/**
 * PHASE 5B: Role Detection & Helper Functions - DEPRECATED
 * 
 * ⚠️ WARNING: These functions are DEPRECATED and will be removed in a future version.
 * 
 * All dashboard pages should use capabilities from CapabilityContext instead:
 * - Use `useCapability()` hook from '@/context/CapabilityContext'
 * - Check `can_buy`, `can_sell`, `can_logistics` flags
 * - Check `sell_status`, `logistics_status` for approval status
 * 
 * These functions are kept for backward compatibility with:
 * - Non-dashboard pages (public pages, components)
 * - Legacy code that hasn't been migrated yet
 * 
 * @deprecated Use capabilities from CapabilityContext instead
 */

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Get user role from profile data (legacy method)
 * Normalizes logistics_partner to logistics
 * 
 * @deprecated Use `useCapability()` hook and check `can_buy`, `can_sell`, `can_logistics` instead
 * @param {Object} profile - User profile object
 * @returns {string} - Normalized role ('buyer', 'seller', 'hybrid', 'logistics')
 */
export function getUserRole(profile) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] getUserRole is deprecated. Use useCapability() hook instead.');
  }
  
  if (!profile) return 'buyer';
  
  const role = profile.role || profile.user_role || 'buyer';
  
  // Normalize logistics_partner to logistics
  return role === 'logistics_partner' ? 'logistics' : role;
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user is buyer (or hybrid in buyer mode)
 * 
 * @deprecated Use `capabilities.can_buy === true` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function isBuyer(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] isBuyer is deprecated. Use capabilities.can_buy === true instead.');
  }
  
  if (!role) return false;
  if (role === 'buyer') return true;
  if (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'buyer')) return true;
  return false;
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user is seller (or hybrid in seller mode)
 * 
 * @deprecated Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function isSeller(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] isSeller is deprecated. Use capabilities.can_sell === true && capabilities.sell_status === "approved" instead.');
  }
  
  if (!role) return false;
  if (role === 'seller') return true;
  if (role === 'hybrid' && (viewMode === 'everything' || viewMode === 'seller')) return true;
  return false;
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user is hybrid
 * 
 * @deprecated Use `capabilities.can_buy === true && capabilities.can_sell === true && capabilities.sell_status === 'approved'` from useCapability() hook instead
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isHybrid(role) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] isHybrid is deprecated. Use capabilities.can_buy === true && capabilities.can_sell === true instead.');
  }
  return role === 'hybrid';
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user is logistics partner
 * 
 * @deprecated Use `capabilities.can_logistics === true && capabilities.logistics_status === 'approved'` from useCapability() hook instead
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isLogistics(role) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] isLogistics is deprecated. Use capabilities.can_logistics === true && capabilities.logistics_status === "approved" instead.');
  }
  return role === 'logistics' || role === 'logistics_partner';
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user can view buyer features
 * 
 * @deprecated Use `capabilities.can_buy === true` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users
 * @returns {boolean}
 */
export function canViewBuyerFeatures(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] canViewBuyerFeatures is deprecated. Use capabilities.can_buy === true instead.');
  }
  return isBuyer(role, viewMode);
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Check if user can view seller features
 * 
 * @deprecated Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users
 * @returns {boolean}
 */
export function canViewSellerFeatures(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] canViewSellerFeatures is deprecated. Use capabilities.can_sell === true && capabilities.sell_status === "approved" instead.');
  }
  return isSeller(role, viewMode);
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Determine if buyer data should be loaded
 * 
 * @deprecated Use `capabilities.can_buy === true` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function shouldLoadBuyerData(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] shouldLoadBuyerData is deprecated. Use capabilities.can_buy === true instead.');
  }
  if (!role) return false;
  if (role === 'buyer') return true;
  if (role === 'hybrid') {
    return viewMode === 'everything' || viewMode === 'buyer';
  }
  return false;
}

/**
 * PHASE 5B: DEPRECATED - Use capabilities from CapabilityContext instead
 * 
 * Determine if seller data should be loaded
 * 
 * @deprecated Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'` from useCapability() hook instead
 * @param {string} role - User role
 * @param {string} viewMode - View mode for hybrid users ('everything', 'buyer', 'seller')
 * @returns {boolean}
 */
export function shouldLoadSellerData(role, viewMode = 'everything') {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] shouldLoadSellerData is deprecated. Use capabilities.can_sell === true && capabilities.sell_status === "approved" instead.');
  }
  if (!role) return false;
  if (role === 'seller') return true;
  if (role === 'hybrid') {
    return viewMode === 'everything' || viewMode === 'seller';
  }
  return false;
}

/**
 * PHASE 5B: DEPRECATED - View modes are no longer used (single dashboard)
 * 
 * Get valid view modes for a role (legacy function)
 * 
 * @deprecated View modes are deprecated - all dashboard users use the same /dashboard route
 * @param {string} role - User role
 * @returns {string[]} - Array of valid view modes
 */
export function getValidViewModes(role) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] getValidViewModes is deprecated. View modes are no longer used - all users use /dashboard.');
  }
  if (role === 'hybrid') {
    return ['everything', 'buyer', 'seller'];
  }
  return [role]; // For non-hybrid, only their role is valid
}

/**
 * PHASE 5B: REMOVED - Single dashboard route (/dashboard) replaces role-based routes
 * 
 * Get dashboard path for a given role
 * 
 * @deprecated All dashboard routes now use /dashboard (single workspace). This function is removed.
 * @param {string} role - Normalized role
 * @returns {string} - Always returns '/dashboard' (single route)
 */
export function getDashboardPathForRole(role) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[roleHelpers] getDashboardPathForRole is deprecated. All dashboard routes now use /dashboard. This function will always return /dashboard.');
  }
  // PHASE 5B: All dashboard routes now use single /dashboard route (capability-based, not role-based)
  return '/dashboard';
}

