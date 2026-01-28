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
  // ✅ Get auth state directly for fast-path routing
  const { user, profile, authReady } = useAuth();

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

  // ✅ FIX: Fast-path for new users without company_id
  // Don't wait for capabilities - route to onboarding immediately
  // ✅ ALIBABA FLOW: Route based on user role
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // Fast-path: Auth ready + user exists + no company_id → role-specific onboarding
    if (authReady && user && profile && !profile.company_id) {
      const userRole = profile.role || 'buyer';
      const onboardingPath = getOnboardingPath(userRole);
      console.log(`🚀 FAST-PATH: New ${userRole} without company_id → ${onboardingPath}`);
      hasNavigatedRef.current = true;
      navigate(onboardingPath, { replace: true });
      return;
    }

    // Fast-path: Auth ready + user exists + has company_id but no profile yet
    // Wait briefly then redirect (profile might be loading)
    if (authReady && user && !profile) {
      const timer = setTimeout(() => {
        if (!hasNavigatedRef.current) {
          // Get role from user metadata if profile not loaded yet
          const userRole = user.user_metadata?.intended_role || user.user_metadata?.role || 'buyer';
          const onboardingPath = getOnboardingPath(userRole);
          console.log(`🚀 FAST-PATH: User without profile (${userRole}) → ${onboardingPath}`);
          hasNavigatedRef.current = true;
          navigate(onboardingPath, { replace: true });
        }
      }, 2000); // 2 second wait for profile to load
      return () => clearTimeout(timer);
    }
  }, [authReady, user, profile, navigate]);

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

  // ✅ Safety fallback: If nothing happens after 8 seconds, force redirect
  // ✅ ALIBABA FLOW: Use role-based routing in fallback too
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigatedRef.current && authReady && user) {
        const userRole = profile?.role || user.user_metadata?.intended_role || 'buyer';
        const fallbackPath = profile?.company_id
          ? getDashboardPath(userRole)
          : getOnboardingPath(userRole);
        console.warn(`[PostLoginRouter] Fallback: 8s timeout - forcing redirect to ${fallbackPath}`);
        hasNavigatedRef.current = true;
        window.location.href = fallbackPath;
      }
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [authReady, user, profile]);

  // ✅ Show loading while routing
  return <LoadingScreen message="Unlocking Workspace..." />;
}
