/**
 * Marketplace helper functions
 */

/**
 * Calculate time remaining until deadline
 */
export function getTimeRemaining(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff < 0) return { expired: true, text: 'Expired' };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) return { expired: false, text: `${days} days left` };
  if (days > 0) return { expired: false, text: `${days}d ${hours}h left`, urgent: true };
  if (hours > 0) return { expired: false, text: `${hours}h left`, urgent: true };
  return { expired: false, text: 'Less than 1h left', urgent: true };
}

/**
 * Check if supplier has fast response (response_rate > 80 or avg_response_time < 24h)
 */
export function hasFastResponse(company) {
  if (!company) return false;
  return (company.response_rate > 80) || (company.avg_response_time && company.avg_response_time < 24);
}

/**
 * Check if product is ready to ship (lead_time_min_days <= 7)
 */
export function isReadyToShip(product) {
  if (!product) return false;
  return product.lead_time_min_days && product.lead_time_min_days <= 7;
}

