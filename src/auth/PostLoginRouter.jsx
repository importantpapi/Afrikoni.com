import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel'; // ✅ KERNEL MANIFESTO: Rule 1 - Use Kernel exclusively
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';

export default function PostLoginRouter() {
  // ✅ KERNEL MANIFESTO: Rule 1 - Get everything from Kernel (no direct useAuth/useCapability)
  const { 
    userId, 
    profileCompanyId, 
    capabilities, 
    isSystemReady
  } = useDashboardKernel();
  
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // ✅ NAVIGATION FIX: Enhanced readiness check with fail-safe timeout
    if (!userId || hasNavigatedRef.current) {
      return; // No user or already navigated
    }

    // ✅ NAVIGATION FIX: Wait for Kernel, but with bounded timeout
    if (!isSystemReady || !capabilities?.ready) {
      // ✅ DIAGNOSTIC: Log why we're waiting
      console.log('[PostLoginRouter] ⏳ Waiting for Kernel...', {
        userId: !!userId,
        profileCompanyId,
        isSystemReady,
        'capabilities.ready': capabilities?.ready,
        'Waiting for': !isSystemReady ? 'isSystemReady=true' : 'capabilities.ready=true'
      });

      // Set up a fail-safe: if still not ready after 3 seconds, force navigation anyway
      const failSafeTimeout = setTimeout(() => {
        if (!hasNavigatedRef.current && userId) {
          console.warn('[PostLoginRouter] ⚠️ Fail-safe triggered - Kernel not ready after 3s', {
            isSystemReady,
            'capabilities.ready': capabilities?.ready,
            profileCompanyId,
            'Forcing navigation to': profileCompanyId ? '/dashboard' : '/onboarding/company'
          });
          const target = profileCompanyId ? '/dashboard' : '/onboarding/company';
          hasNavigatedRef.current = true;
          window.location.href = target; // Use hard redirect as fail-safe
        }
      }, 3000);

      return () => clearTimeout(failSafeTimeout);
    }

    // ✅ KERNEL MANIFESTO: Rule 3 - Use profileCompanyId from Kernel (not profile?.company_id)
    const target = profileCompanyId ? '/dashboard' : '/onboarding/company';

    console.log("🚀 KERNEL REDIRECT: Jumping to", target);

    // ✅ KERNEL MANIFESTO FIX: Wrap navigate in setTimeout(0) to prevent React render cycle cancellation
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        navigate(target, { replace: true });
        hasNavigatedRef.current = true;
      }
    }, 0);

    // ✅ KERNEL MANIFESTO FIX: Hard redirect fallback if React Router fails
    setTimeout(() => {
      if ((window.location.pathname === '/auth/post-login' || window.location.pathname === '/login') && !hasNavigatedRef.current) {
        console.warn('[PostLoginRouter] 🔄 Fallback: React Router navigation failed, using hard redirect');
        hasNavigatedRef.current = true;
        window.location.href = target;
      }
    }, 1500);

    return;
  }, [isSystemReady, capabilities?.ready, userId, profileCompanyId, navigate]);
  
  // ✅ KERNEL MANIFESTO: Rule 2 - UI Gate - Show loading while Kernel initializes
  if (!isSystemReady) {
    return <LoadingScreen message="Unlocking Workspace..." />;
  }
  
  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state
  return <LoadingScreen message="Unlocking Workspace..." />;
}
