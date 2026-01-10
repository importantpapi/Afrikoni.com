import React, { ReactNode } from 'react';
import { useCapability } from '@/context/CapabilityContext';
import AccessDenied from '@/components/AccessDenied';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

type Props = {
  children: ReactNode;
  canBuy?: boolean;
  canSell?: boolean;
  canLogistics?: boolean;
  canAdmin?: boolean;
  /**
   * If true, requires capability to be approved (not just enabled)
   * Only applies to sell and logistics capabilities
   */
  requireApproved?: boolean;
  /**
   * If true, shows AccessDenied component
   * If false, shows inline message (default)
   */
  showAccessDenied?: boolean;
  /**
   * Custom message to show when capability is missing
   */
  fallbackMessage?: string;
};

/**
 * PHASE 5: RequireCapability - Replaces RequireDashboardRole
 * 
 * Checks company capabilities instead of roles.
 * 
 * RULES:
 * - NEVER redirects (unlike RequireDashboardRole)
 * - NEVER blocks dashboard rendering
 * - If capability missing, shows message or AccessDenied
 * - If capability loading, shows spinner (with timeout)
 * - If capability missing but not required, renders children anyway
 * 
 * @example
 * <RequireCapability canSell={true} requireApproved={true}>
 *   <ProductsPage />
 * </RequireCapability>
 */
export default function RequireCapability({
  children,
  canBuy,
  canSell,
  canLogistics,
  canAdmin,
  requireApproved = false,
  showAccessDenied = false,
  fallbackMessage,
}: Props) {
  const capabilities = useCapability();

  // Wait for capabilities to load (with timeout protection)
  if (capabilities.loading) {
    return <SpinnerWithTimeout message="Loading capabilities..." />;
  }

  // If there's an error loading capabilities, allow access (don't block)
  // Capabilities will be checked at RLS level anyway
  if (capabilities.error) {
    console.warn('[RequireCapability] Error loading capabilities, allowing access (RLS will enforce):', capabilities.error);
    return <>{children}</>;
  }

  // PHASE 5B: Check each required capability (OR logic if multiple capabilities specified)
  let hasAccess = false;
  let missingCapability: string | null = null;

  // Count how many capabilities are required
  const requiredCapabilities = [
    canBuy !== undefined && canBuy,
    canSell !== undefined && canSell,
    canLogistics !== undefined && canLogistics,
    canAdmin !== undefined && canAdmin,
  ].filter(Boolean).length;

  // If no capabilities required, allow access
  if (requiredCapabilities === 0) {
    hasAccess = true;
  } else {
    // If multiple capabilities specified, use OR logic (hasAccess if ANY is true)
    // If single capability specified, use AND logic (hasAccess only if THAT is true)
    const useOrLogic = requiredCapabilities > 1;
    const accessChecks: boolean[] = [];
    const missingCaps: string[] = [];

    // Check buy capability
    if (canBuy !== undefined && canBuy) {
      const hasBuy = capabilities.can_buy === true;
      accessChecks.push(hasBuy);
      if (!hasBuy) missingCaps.push('Buy');
    }

    // Check sell capability
    if (canSell !== undefined && canSell) {
      if (!capabilities.can_sell) {
        accessChecks.push(false);
        missingCaps.push('Sell');
      } else if (requireApproved && capabilities.sell_status !== 'approved') {
        accessChecks.push(false);
        missingCaps.push(`Sell (status: ${capabilities.sell_status})`);
      } else {
        accessChecks.push(true);
      }
    }

    // Check logistics capability
    if (canLogistics !== undefined && canLogistics) {
      if (!capabilities.can_logistics) {
        accessChecks.push(false);
        missingCaps.push('Logistics');
      } else if (requireApproved && capabilities.logistics_status !== 'approved') {
        accessChecks.push(false);
        missingCaps.push(`Logistics (status: ${capabilities.logistics_status})`);
      } else {
        accessChecks.push(true);
      }
    }

    // PHASE 5B: Admin capability check (admin is user-level, checked at route level)
    // Component-level admin check not implemented - admin pages should use ProtectedRoute requireAdmin
    if (canAdmin !== undefined && canAdmin) {
      console.warn('[RequireCapability] Admin check should be done at route level with ProtectedRoute requireAdmin');
      // Admin is checked via isAdmin() function at route level, not here
      // For component guard, we can't use hooks here, so block access
      accessChecks.push(false);
      missingCaps.push('Admin');
    }

    // PHASE 5B: Apply OR or AND logic
    if (useOrLogic) {
      // OR logic: hasAccess if ANY capability is true
      hasAccess = accessChecks.some(check => check === true);
      if (!hasAccess && missingCaps.length > 0) {
        missingCapability = `${missingCaps.join(' or ')} capability`;
      }
    } else {
      // AND logic: hasAccess only if the single required capability is true
      hasAccess = accessChecks.length > 0 ? accessChecks[0] : false;
      if (!hasAccess && missingCaps.length > 0) {
        missingCapability = `${missingCaps[0]} capability`;
      }
    }
  }

  // If capability is missing, show message or AccessDenied (DO NOT redirect)
  if (!hasAccess && missingCapability) {
    const message = fallbackMessage || `This feature requires ${missingCapability}.`;

    if (showAccessDenied) {
      return <AccessDenied message={message} />;
    }

    // Inline message (non-blocking)
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-afrikoni-gold mb-2">
            <svg
              className="w-16 h-16 mx-auto"
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
          <h3 className="text-lg font-semibold text-afrikoni-deep mb-2">Feature Unavailable</h3>
          <p className="text-sm text-afrikoni-text-dark mb-4">{message}</p>
          {capabilities.sell_status === 'pending' && (
            <p className="text-xs text-afrikoni-gold">Your seller application is pending approval.</p>
          )}
          {capabilities.logistics_status === 'pending' && (
            <p className="text-xs text-afrikoni-gold">Your logistics partner application is pending approval.</p>
          )}
        </div>
      </div>
    );
  }

  // Capability exists and is approved (if required) - render children
  return <>{children}</>;
}
