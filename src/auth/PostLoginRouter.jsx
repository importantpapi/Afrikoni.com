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
    systemStatus,
    authReady,
    authLoading
  } = useDashboardKernel();

  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  // ✅ BIG TECH PATTERN: Universal fail-safe - ALWAYS redirects within 5s, no matter what
  // This prevents infinite spinner deadlocks regardless of userId, profileStatus, or any other condition
  useEffect(() => {
    const universalFailSafe = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        console.warn('[PostLoginRouter] 🚨 UNIVERSAL FAIL-SAFE triggered after 5s');
        hasNavigatedRef.current = true;

        // Best-effort redirect based on available data
        let target;
        if (userId && profileCompanyId) {
          target = '/dashboard';
          console.log('[PostLoginRouter] Fail-safe: Has userId + company → /dashboard');
        } else if (userId && !profileCompanyId) {
          target = '/onboarding/company';
          console.log('[PostLoginRouter] Fail-safe: Has userId, no company → /onboarding');
        } else {
          target = '/login?error=session_timeout';
          console.log('[PostLoginRouter] Fail-safe: No userId → /login');
        }

        window.location.href = target;
      }
    }, 5000); // 5 second absolute deadline

    return () => clearTimeout(universalFailSafe);
  }, []); // Empty deps - runs once on mount, guarantees escape

  useEffect(() => {
    // Guard: Already navigated
    if (hasNavigatedRef.current) {
      return;
    }

    // ✅ FIX: Removed !userId guard to prevent deadlock
    // Wait for auth to be ready before making routing decisions
    if (!authReady || authLoading) {
      console.log('[PostLoginRouter] ⏳ Waiting for auth to be ready...', {
        authReady,
        authLoading,
        elapsed: '0s'
      });
      return; // Wait for auth to initialize
    }

    // Auth is ready - now check userId
    if (!userId) {
      console.log('[PostLoginRouter] ⏳ Auth ready but no userId yet, waiting...', {
        authReady,
        authLoading,
        hasUser: !!userId
      });
      // Don't return early - universal fail-safe will handle timeout
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
      // Still loading - universal fail-safe will handle timeout
      console.log('[PostLoginRouter] ⏳ Profile still loading...', {
        profileStatus,
        systemStatus,
        elapsed: '0s'
      });
      return; // Wait for profile to load or fail-safe to trigger
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
  }, [userId, profileStatus, profileCompanyId, systemStatus, authReady, authLoading, navigate]);

  // Show loading screen while waiting
  return <LoadingScreen message="Unlocking Workspace..." />;
}
