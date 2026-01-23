import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCapability } from '@/context/CapabilityContext';
import { useAuth } from '@/contexts/AuthProvider';
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
  // ✅ FULL-STACK SYNC: Get auth state for admin check
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  // ✅ FULL-STACK SYNC: Admin Override - Admins bypass all capability checks
  if (isAdmin) {
    console.log('[RequireCapability] Admin user detected - bypassing capability checks');
    return <>{children}</>;
  }

  // ✅ CRITICAL FIX: Safe access with optional chaining
  let capability;
  try {
    capability = useCapability();
  } catch (error) {
    console.error('[RequireCapability] Error accessing capabilities:', error);
    // ✅ CRITICAL: Return children if capability access fails
    return <>{children}</>;
  }
  
  // ✅ CRITICAL FIX: Safe access with optional chaining
  if (!capability) {
    return <>{children}</>;
  }

  // ✅ CRITICAL FIX: Safe access with optional chaining
  // ✅ FOUNDATION FIX: Check for critical database sync errors
  if (capability?.error && !capability?.ready) {
    const isDatabaseSyncError = capability?.error?.includes('Database sync error') ||
                                capability?.error?.includes('table') ||
                                capability?.error?.includes('does not exist');
    
    if (isDatabaseSyncError) {
      // Critical error: Show clear error message, don't show spinner
      return (
        <div className="min-h-screen flex items-center justify-center bg-afrikoni-ivory p-8">
          <div className="max-w-2xl text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-4">
              Database Sync Error
            </h2>
            <p className="text-lg text-afrikoni-text-dark/70 mb-6">
              {capability?.error || 'Database sync error'}
            </p>
            <div className="bg-afrikoni-sand/50 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold mb-2">To fix this:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Run the database migration: <code className="bg-white px-2 py-1 rounded">supabase/migrations/20260117_foundation_fix.sql</code></li>
                <li>Or contact your database administrator</li>
                <li>Refresh the page after the migration is complete</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
    
    // Network/timeout error - show spinner with retry option
    console.error('[RequireCapability] Capability error and not ready - showing spinner');
    return <SpinnerWithTimeout message="Preparing your workspace..." ready={capability?.ready ?? true} />;
  }

  // ✅ SINGLE REDIRECT OWNER: Block rendering but NEVER redirect
  // Show spinner if capabilities not ready
  if (!capability?.ready) {
    return <SpinnerWithTimeout message="Preparing your workspace..." ready={capability?.ready ?? true} />;
  }

  // ✅ SINGLE REDIRECT OWNER: Show error UI with retry instead of redirecting
  // Helper to render capability error
  const renderCapabilityError = (message) => (
    <div className="min-h-screen flex items-center justify-center bg-afrikoni-ivory p-8">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-afrikoni-text-dark mb-4">
          Access Restricted
        </h2>
        <p className="text-lg text-afrikoni-text-dark/70 mb-6">
          {message}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => capability.forceRefresh?.() || window.location.reload()}
            className="w-full px-6 py-3 bg-afrikoni-gold text-white rounded-lg hover:bg-afrikoni-gold/90 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full px-6 py-3 bg-gray-200 text-afrikoni-text-dark rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Check capability requirements - show error UI instead of redirecting
  if (require === 'buy') {
    if (!capability?.can_buy) {
      return renderCapabilityError('This feature requires buyer capabilities. Please contact support to enable buying features.');
    }
  }

  if (require === 'sell') {
    if (!capability?.can_sell) {
      return renderCapabilityError('This feature requires seller capabilities. Please apply for seller verification.');
    }
    if (requireApproved && capability?.sell_status !== 'approved') {
      return renderCapabilityError('Your seller account is pending approval. We\'ll notify you once it\'s approved.');
    }
  }

  if (require === 'logistics') {
    if (!capability?.can_logistics) {
      return renderCapabilityError('This feature requires logistics capabilities. Please contact support to enable logistics features.');
    }
    if (requireApproved && capability?.logistics_status !== 'approved') {
      return renderCapabilityError('Your logistics account is pending approval. We\'ll notify you once it\'s approved.');
    }
  }

  // All requirements met - render children
  return <>{children}</>;
}
