import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';

/**
 * PostLoginRouter - Routes users after successful login
 *
 * FIX: Added fast-path for new users without company_id
 * This prevents 5+ second wait for capabilities to load
 *
 * ✅ ALIBABA FLOW: Routes based on user role (buyer/seller/hybrid/services)
 */
export default function PostLoginRouter() {
  // FIX: Use authResolutionComplete instead of authReady to prevent race condition
  // authResolutionComplete is only true when profile fetch has completed
  const { user, profile, authReady, authResolutionComplete } = useAuth();

  /**
   * ✅ ALIBABA FLOW: Determine onboarding path based on role
   */
  const getOnboardingPath = (userRole) => {
    switch (userRole) {
      case 'seller':
        return '/onboarding/company'; // Seller onboarding
      case 'hybrid':
        return '/onboarding/company'; // Hybrid uses seller flow + buyer preferences
      case 'services':
        return '/onboarding/company'; // Services (logistics, finance) onboarding
      case 'buyer':
      default:
        return '/onboarding/company'; // Buyer onboarding (simplest)
    }
  };

  /**
   * ✅ ALIBABA FLOW: Determine dashboard path based on role
   */
  const getDashboardPath = (userRole) => {
    // For now, all roles go to same dashboard
    // Future: role-specific dashboard views
    return '/dashboard';
  };

  // ✅ KERNEL MANIFESTO: Get Kernel state for full routing
  const {
    userId,
    profileCompanyId,
    capabilities,
    isSystemReady
  } = useDashboardKernel();

  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  // FIX: Fast-path for new users without company_id
  // Use authResolutionComplete to ensure profile fetch has completed before routing
  // ALIBABA FLOW: Route based on user role
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // FIX: Wait for authResolutionComplete, not just authReady
    // This ensures profile fetch has completed before we make routing decisions
    if (!authResolutionComplete) {
      return; // Still resolving - wait
    }

    // Fast-path: Resolution complete + user exists + no company_id → role-specific onboarding
    if (user && profile && !profile.company_id) {
      const userRole = profile.role || 'buyer';
      const onboardingPath = getOnboardingPath(userRole);
      console.log(`🚀 FAST-PATH: New ${userRole} without company_id → ${onboardingPath}`);
      hasNavigatedRef.current = true;
      navigate(onboardingPath, { replace: true });
      return;
    }

    // Fast-path: Resolution complete + user exists + no profile → onboarding
    // Profile doesn't exist in DB (new OAuth user) - route to onboarding
    if (user && !profile) {
      const userRole = user.user_metadata?.intended_role || user.user_metadata?.role || 'buyer';
      const onboardingPath = getOnboardingPath(userRole);
      console.log(`🚀 FAST-PATH: User without profile (${userRole}) → ${onboardingPath}`);
      hasNavigatedRef.current = true;
      navigate(onboardingPath, { replace: true });
      return;
    }
  }, [authResolutionComplete, user, profile, navigate]);

  // ✅ Standard path: Wait for full Kernel readiness
  // ✅ ALIBABA FLOW: Route based on role + company status
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // Wait for Kernel to be ready
    if (!isSystemReady || !capabilities?.ready || !userId) {
      return;
    }

    // ✅ ALIBABA FLOW: Determine target based on role and company status
    const userRole = profile?.role || 'buyer';
    const target = profileCompanyId
      ? getDashboardPath(userRole)
      : getOnboardingPath(userRole);

    console.log(`🚀 KERNEL REDIRECT: ${userRole} → ${target}`);

    // Wrap navigate in setTimeout(0) to prevent React render cycle issues
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        navigate(target, { replace: true });
        hasNavigatedRef.current = true;
      }
    }, 0);

  }, [isSystemReady, capabilities?.ready, userId, profileCompanyId, navigate]);

  // FIX: Fallback timeout only fires if authResolutionComplete but Kernel still not ready
  // This catches edge cases where capabilities fail to load
  // ALIBABA FLOW: Use role-based routing in fallback too
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigatedRef.current && authResolutionComplete && user) {
        const userRole = profile?.role || user.user_metadata?.intended_role || 'buyer';
        const fallbackPath = profile?.company_id
          ? getDashboardPath(userRole)
          : getOnboardingPath(userRole);
        console.warn(`[PostLoginRouter] Fallback: 5s timeout after resolution - forcing redirect to ${fallbackPath}`);
        hasNavigatedRef.current = true;
        window.location.href = fallbackPath;
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [authResolutionComplete, user, profile]);

  // ✅ Show loading while routing
  return <LoadingScreen message="Unlocking Workspace..." />;
}
