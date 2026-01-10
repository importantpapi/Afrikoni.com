import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCapability } from '@/context/CapabilityContext';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

/**
 * PHASE 5B: RequireCapability - Route guard based on company capabilities
 * 
 * This is a ROUTE guard (used in Routes), not a component guard.
 * Replaces role-based route guards with capability-based guards.
 * 
 * RULES:
 * - ONLY blocks when capability.ready === false
 * - Does NOT check auth/role/profile (auth should be handled by ProtectedRoute wrapper, if needed)
 * - Passes ready prop to SpinnerWithTimeout to prevent timeout when ready === true
 * 
 * CAPABILITY CHECKS:
 * - require="buy" → requires can_buy === true
 * - require="sell" → requires can_sell === true
 * - require="sell" + requireApproved → requires can_sell === true AND sell_status === "approved"
 * - require="logistics" → requires can_logistics === true
 * - require="logistics" + requireApproved → requires can_logistics === true AND logistics_status === "approved"
 * - No require prop → just waits for capability.ready (for dashboard home)
 * 
 * @example
 * // Dashboard home - just requires ready
 * <Route path="/dashboard" element={
 *   <RequireCapability>
 *     <DashboardHome />
 *   </RequireCapability>
 * } />
 * 
 * @example
 * // Buyer page - requires buy capability
 * <Route path="/dashboard/orders" element={
 *   <RequireCapability require="buy">
 *     <OrdersPage />
 *   </RequireCapability>
 * } />
 * 
 * @example
 * // Seller page - requires sell capability (approved)
 * <Route path="/dashboard/products" element={
 *   <RequireCapability require="sell" requireApproved>
 *     <ProductsPage />
 *   </RequireCapability>
 * } />
 */
export default function RequireCapability({
  children,
  require = null, // "buy" | "sell" | "logistics" | null
  requireApproved = false, // If true, requires status === "approved"
}) {
  const capability = useCapability();

  // PHASE 5B: ONLY block when capability.ready === false
  // Pass ready prop to SpinnerWithTimeout to cancel timeout when capability.ready === true
  if (!capability.ready) {
    return <SpinnerWithTimeout message="Preparing your workspace..." ready={capability.ready} />;
  }

  // PHASE 5B: If caps.error AND not ready → show spinner
  // Note: If ready is true but error exists, we still allow access (RLS will enforce)
  if (capability.error && !capability.ready) {
    console.error('[RequireCapability] Capability error and not ready - showing spinner');
    return <SpinnerWithTimeout message="Preparing your workspace..." ready={capability.ready} />;
  }

  // STEP 6: Check capability requirements
  if (require === 'buy') {
    if (!capability.can_buy) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (require === 'sell') {
    if (!capability.can_sell) {
      return <Navigate to="/dashboard" replace />;
    }
    // If requireApproved, also check sell_status === "approved"
    if (requireApproved && capability.sell_status !== 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (require === 'logistics') {
    if (!capability.can_logistics) {
      return <Navigate to="/dashboard" replace />;
    }
    // If requireApproved, also check logistics_status === "approved"
    if (requireApproved && capability.logistics_status !== 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // All requirements met - render children
  return <>{children}</>;
}
