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
 */
export default function PostLoginRouter() {
  // ✅ Get auth state directly for fast-path routing
  const { user, profile, authReady } = useAuth();

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
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // Fast-path: Auth ready + user exists + no company_id → onboarding
    if (authReady && user && profile && !profile.company_id) {
      console.log("🚀 FAST-PATH: New user without company_id → onboarding");
      hasNavigatedRef.current = true;
      navigate('/onboarding/company', { replace: true });
      return;
    }

    // Fast-path: Auth ready + user exists + has company_id but no profile yet
    // Wait briefly then redirect (profile might be loading)
    if (authReady && user && !profile) {
      const timer = setTimeout(() => {
        if (!hasNavigatedRef.current) {
          console.log("🚀 FAST-PATH: User without profile → onboarding");
          hasNavigatedRef.current = true;
          navigate('/onboarding/company', { replace: true });
        }
      }, 2000); // 2 second wait for profile to load
      return () => clearTimeout(timer);
    }
  }, [authReady, user, profile, navigate]);

  // ✅ Standard path: Wait for full Kernel readiness
  useEffect(() => {
    if (hasNavigatedRef.current) return;

    // Wait for Kernel to be ready
    if (!isSystemReady || !capabilities?.ready || !userId) {
      return;
    }

    // ✅ Route based on company_id
    const target = profileCompanyId ? '/dashboard' : '/onboarding/company';

    console.log("🚀 KERNEL REDIRECT: Jumping to", target);

    // Wrap navigate in setTimeout(0) to prevent React render cycle issues
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        navigate(target, { replace: true });
        hasNavigatedRef.current = true;
      }
    }, 0);

  }, [isSystemReady, capabilities?.ready, userId, profileCompanyId, navigate]);

  // ✅ Safety fallback: If nothing happens after 8 seconds, force redirect
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigatedRef.current && authReady && user) {
        console.warn('[PostLoginRouter] Fallback: 8s timeout - forcing redirect');
        hasNavigatedRef.current = true;
        // Default to dashboard, let dashboard handle further routing
        window.location.href = profile?.company_id ? '/dashboard' : '/onboarding/company';
      }
    }, 8000);

    return () => clearTimeout(fallbackTimer);
  }, [authReady, user, profile]);

  // ✅ Show loading while routing
  return <LoadingScreen message="Unlocking Workspace..." />;
}
