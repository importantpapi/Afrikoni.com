/**
 * Header Component Mapping
 * 
 * Centralized mapping for dashboard headers based on user capabilities.
 * This replaces the complex if/else chain in DashboardLayout.
 */

import BuyerHeader from '@/components/headers/BuyerHeader';
import SellerHeader from '@/components/headers/SellerHeader';
import LogisticsHeader from '@/components/headers/LogisticsHeader';
import HybridHeader from '@/components/headers/HybridHeader';

/**
 * Determine which header component to use based on capabilities
 * 
 * @param {Object} params
 * @param {boolean} params.isAdminPath - Is user on admin dashboard path
 * @param {boolean} params.isUserAdmin - Is user an admin
 * @param {boolean} params.isSeller - Can user sell (approved)
 * @param {boolean} params.isLogistics - Can user do logistics (approved)
 * @param {boolean} params.isHybridCapability - Is user both buyer and seller
 * @returns {Object} Object with component and required props
 */
export function getHeaderComponent({
  isSeller,
  isLogistics,
  isHybridCapability,
}) {
  // Seller-only (approved seller, not logistics)
  if (isSeller && !isLogistics) {
    return {
      component: SellerHeader,
      requiresAlertCount: false,
    };
  }

  // Logistics-only (approved logistics, not seller)
  if (isLogistics && !isSeller) {
    return {
      component: LogisticsHeader,
      requiresAlertCount: false,
    };
  }

  // Hybrid: Buyer + Seller (both approved)
  if (isHybridCapability) {
    return {
      component: HybridHeader,
      requiresAlertCount: false,
      requiresHybridProps: true,
    };
  }

  // Default: Buyer-only (everyone can buy)
  return {
    component: BuyerHeader,
    requiresAlertCount: false,
  };
}

/**
 * Header configuration map
 * Can be extended for future header types
 */
export const headerConfig = {
  buyer: {
    component: BuyerHeader,
    label: 'Buyer',
  },
  seller: {
    component: SellerHeader,
    label: 'Seller',
  },
  logistics: {
    component: LogisticsHeader,
    label: 'Logistics',
  },
  hybrid: {
    component: HybridHeader,
    label: 'Hybrid',
  },
};

export default getHeaderComponent;
