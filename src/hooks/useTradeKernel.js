import { useMemo } from 'react';
import { useDashboardKernel } from './useDashboardKernel';

/**
 * useTradeKernel - Trade Operating System Kernel (2026)
 *
 * Builds on useDashboardKernel to add trade-specific intelligence:
 * - Role classification (buyer, seller, hybrid, logistics)
 * - Verification tier (unverified, pending, verified, premium)
 * - Trade readiness score
 * - Quick action permissions
 *
 * This is the single source of truth for ALL trade-related state.
 *
 * Usage:
 *   const kernel = useTradeKernel();
 *   if (kernel.canCreateRFQ) { ... }
 *   if (kernel.verificationTier === 'verified') { ... }
 */
export function useTradeKernel() {
  const base = useDashboardKernel();

  const extended = useMemo(() => {
    const caps = base.capabilities || {};

    // Role classification
    const isBuyer = caps.can_buy === true;
    const isSeller = caps.can_sell === true;
    const isLogistics = caps.can_logistics === true;
    const isHybrid = isBuyer && isSeller;

    const primaryRole = isHybrid ? 'hybrid'
      : isSeller ? 'seller'
      : isLogistics ? 'logistics'
      : 'buyer';

    // Verification tier from profile/company
    const profile = base.profile || {};
    const verificationStatus = profile.verification_status || 'unverified';
    const verificationTier = verificationStatus === 'VERIFIED' ? 'verified'
      : verificationStatus === 'PENDING' ? 'pending'
      : 'unverified';

    // Trade readiness - what can this user do right now?
    const hasCompany = !!base.profileCompanyId;
    const isVerified = verificationTier === 'verified';

    // Permission flags
    const canCreateRFQ = base.canLoadData && isBuyer;
    const canListProducts = base.canLoadData && isSeller;
    const canCreateShipment = base.canLoadData && isLogistics;
    const canRespondToRFQ = base.canLoadData && isSeller;
    const canPlaceOrder = base.canLoadData && isBuyer;
    const canAccessAnalytics = base.canLoadData;

    // Trade readiness score (0-100)
    let readinessScore = 0;
    if (hasCompany) readinessScore += 30;
    if (base.isSystemReady) readinessScore += 20;
    if (isVerified) readinessScore += 30;
    if (isBuyer || isSeller) readinessScore += 20;

    return {
      // Pass through base kernel
      ...base,

      // Role intelligence
      isBuyer,
      isSeller,
      isLogistics,
      primaryRole,

      // Verification
      verificationTier,
      isVerified,

      // Trade readiness
      hasCompany,
      readinessScore,

      // Permission flags
      canCreateRFQ,
      canListProducts,
      canCreateShipment,
      canRespondToRFQ,
      canPlaceOrder,
      canAccessAnalytics,
    };
  }, [base]);

  return extended;
}
