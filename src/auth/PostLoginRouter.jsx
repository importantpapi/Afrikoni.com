import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';

/**
 * PostLoginRouter - SINGLE REDIRECT OWNER for post-authentication routing
 *
 * This component is the ONLY authority for redirecting users after login.
 * It makes decisions based on profileStatus from useDashboardKernel.
 *
 * Routing Logic:
 * - profileStatus === "ready" → /dashboard
 * - profileStatus === "missing" → /onboarding/company
 * - profileStatus === "error" → /login?error=profile_error
 * - profileStatus === "loading" → wait max 3s then force navigation
 */
export default function PostLoginRouter() {
  const {
    userId,
    profileCompanyId,
    profileStatus,
    systemStatus
  } = useDashboardKernel();

  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Guard: No user or already navigated
    if (!userId || hasNavigatedRef.current) {
      return;
    }

    // ✅ SINGLE REDIRECT OWNER: Decide navigation based on profileStatus
    let target = null;
    let reason = '';

    if (profileStatus === 'ready') {
      target = '/dashboard';
      reason = 'Profile loaded successfully';
    } else if (profileStatus === 'missing') {
      target = '/onboarding/company';
      reason = 'Profile does not exist, needs onboarding';
    } else if (profileStatus === 'error') {
      target = '/login?error=profile_error';
      reason = 'Profile fetch failed';
    } else if (profileStatus === 'loading') {
      // Still loading - set up fail-safe timeout
      console.log('[PostLoginRouter] ⏳ Profile still loading...', {
        profileStatus,
        systemStatus,
        elapsed: '0s'
      });

      const failSafeTimeout = setTimeout(() => {
        if (!hasNavigatedRef.current && userId) {
          // After 3 seconds, force navigation based on what we know
          const fallbackTarget = profileCompanyId ? '/dashboard' : '/onboarding/company';
          console.warn('[PostLoginRouter] ⚠️ Fail-safe triggered after 3s - forcing navigation', {
            profileStatus,
            profileCompanyId,
            target: fallbackTarget
          });
          hasNavigatedRef.current = true;
          window.location.href = fallbackTarget;
        }
      }, 3000);

      return () => clearTimeout(failSafeTimeout);
    }

    // If we have a target, navigate immediately
    if (target && !hasNavigatedRef.current) {
      console.log(`🚀 [PostLoginRouter] REDIRECT DECISION:`, {
        target,
        reason,
        profileStatus,
        profileCompanyId,
        userId: !!userId
      });

      hasNavigatedRef.current = true;

      // Try React Router first
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 0);

      // Hard redirect fallback after 1s
      setTimeout(() => {
        if (window.location.pathname === '/auth/post-login' || window.location.pathname === '/login') {
          console.warn('[PostLoginRouter] 🔄 React Router failed, using hard redirect');
          window.location.href = target;
        }
      }, 1000);
    }
  }, [userId, profileStatus, profileCompanyId, systemStatus, navigate]);

  // Show loading screen while waiting
  return <LoadingScreen message="Unlocking Workspace..." />;
}
