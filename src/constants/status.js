/**
 * Centralized Status Constants & Helpers
 * 
 * Provides single source of truth for:
 * - Status values (orders, RFQs, shipments, products)
 * - Status labels (human-readable)
 * - Status colors (Afrikoni-branded)
 * - Status icons
 * - Status transition rules
 */

// ============================================
// ORDER STATUS
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.COMPLETED]: 'Completed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded'
};

export const ORDER_STATUS_VARIANTS = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.CONFIRMED]: 'info',
  [ORDER_STATUS.PROCESSING]: 'info',
  [ORDER_STATUS.SHIPPED]: 'info',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger',
  [ORDER_STATUS.REFUNDED]: 'neutral'
};

// Valid status transitions for orders
export const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: []
};

// ============================================
// RFQ STATUS
// ============================================

export const RFQ_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  AWARDED: 'awarded',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

export const RFQ_STATUS_LABELS = {
  [RFQ_STATUS.DRAFT]: 'Draft',
  [RFQ_STATUS.OPEN]: 'Open',
  [RFQ_STATUS.PENDING]: 'Pending',
  [RFQ_STATUS.IN_REVIEW]: 'In Review',
  [RFQ_STATUS.AWARDED]: 'Awarded',
  [RFQ_STATUS.CLOSED]: 'Closed',
  [RFQ_STATUS.CANCELLED]: 'Cancelled'
};

export const RFQ_STATUS_VARIANTS = {
  [RFQ_STATUS.DRAFT]: 'neutral',
  [RFQ_STATUS.OPEN]: 'info',
  [RFQ_STATUS.PENDING]: 'warning',
  [RFQ_STATUS.IN_REVIEW]: 'info',
  [RFQ_STATUS.AWARDED]: 'success',
  [RFQ_STATUS.CLOSED]: 'neutral',
  [RFQ_STATUS.CANCELLED]: 'danger'
};

// ============================================
// SHIPMENT STATUS
// ============================================

export const SHIPMENT_STATUS = {
  PENDING_PICKUP: 'pending_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  CUSTOMS: 'customs',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const SHIPMENT_STATUS_LABELS = {
  [SHIPMENT_STATUS.PENDING_PICKUP]: 'Pickup Scheduled',
  [SHIPMENT_STATUS.PICKED_UP]: 'Picked Up',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'In Transit',
  [SHIPMENT_STATUS.CUSTOMS]: 'In Customs',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [SHIPMENT_STATUS.DELIVERED]: 'Delivered',
  [SHIPMENT_STATUS.CANCELLED]: 'Cancelled'
};

export const SHIPMENT_STATUS_VARIANTS = {
  [SHIPMENT_STATUS.PENDING_PICKUP]: 'warning',
  [SHIPMENT_STATUS.PICKED_UP]: 'info',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'info',
  [SHIPMENT_STATUS.CUSTOMS]: 'warning',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'info',
  [SHIPMENT_STATUS.DELIVERED]: 'success',
  [SHIPMENT_STATUS.CANCELLED]: 'danger'
};

// Shipment status order for timeline
export const SHIPMENT_STATUS_ORDER = [
  SHIPMENT_STATUS.PENDING_PICKUP,
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.IN_TRANSIT,
  SHIPMENT_STATUS.CUSTOMS,
  SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  SHIPMENT_STATUS.DELIVERED
];

// ============================================
// PRODUCT STATUS
// ============================================

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

export const PRODUCT_STATUS_LABELS = {
  [PRODUCT_STATUS.DRAFT]: 'Draft',
  [PRODUCT_STATUS.ACTIVE]: 'Active',
  [PRODUCT_STATUS.PAUSED]: 'Paused',
  [PRODUCT_STATUS.INACTIVE]: 'Inactive',
  [PRODUCT_STATUS.ARCHIVED]: 'Archived'
};

export const PRODUCT_STATUS_VARIANTS = {
  [PRODUCT_STATUS.DRAFT]: 'neutral',
  [PRODUCT_STATUS.ACTIVE]: 'success',
  [PRODUCT_STATUS.PAUSED]: 'warning',
  [PRODUCT_STATUS.INACTIVE]: 'neutral',
  [PRODUCT_STATUS.ARCHIVED]: 'neutral'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status label for any status type
 */
export function getStatusLabel(status, type = 'order') {
  const labelMap = {
    order: ORDER_STATUS_LABELS,
    rfq: RFQ_STATUS_LABELS,
    shipment: SHIPMENT_STATUS_LABELS,
    product: PRODUCT_STATUS_LABELS
  };
  
  return labelMap[type]?.[status] || status;
}

/**
 * Get status variant (color) for any status type
 */
export function getStatusVariant(status, type = 'order') {
  const variantMap = {
    order: ORDER_STATUS_VARIANTS,
    rfq: RFQ_STATUS_VARIANTS,
    shipment: SHIPMENT_STATUS_VARIANTS,
    product: PRODUCT_STATUS_VARIANTS
  };
  
  return variantMap[type]?.[status] || 'neutral';
}

/**
 * Check if status transition is valid
 */
export function canTransitionTo(currentStatus, newStatus, type = 'order') {
  if (type === 'order') {
    const transitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    return transitions.includes(newStatus);
  }
  // Add other types as needed
  return true;
}

/**
 * Get next valid statuses for a given status
 */
export function getNextStatuses(currentStatus, type = 'order') {
  if (type === 'order') {
    return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  }
  return [];
}

/**
 * Get all statuses for a type
 */
export function getAllStatuses(type = 'order') {
  const statusMap = {
    order: Object.values(ORDER_STATUS),
    rfq: Object.values(RFQ_STATUS),
    shipment: Object.values(SHIPMENT_STATUS),
    product: Object.values(PRODUCT_STATUS)
  };
  
  return statusMap[type] || [];
}

