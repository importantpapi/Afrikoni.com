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
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Check Kernel readiness flags
    if (!isSystemReady || !capabilities?.ready || !userId || hasNavigatedRef.current) {
      return; // Wait for Kernel to be ready
    }
    
    // ✅ KERNEL MANIFESTO: Rule 3 - Use profileCompanyId from Kernel (not profile?.company_id)
    const target = profileCompanyId ? '/dashboard' : '/onboarding/company';
    
    console.log("🚀 KERNEL REDIRECT: Jumping to", target);
    
    // ✅ KERNEL MANIFESTO FIX: Wrap navigate in setTimeout(0) to prevent React render cycle cancellation
    setTimeout(() => {
      navigate(target, { replace: true });
      hasNavigatedRef.current = true;
    }, 0);
    
    // ✅ KERNEL MANIFESTO FIX: Increased timeout to 1000ms for slow networks
    setTimeout(() => {
      if (window.location.pathname === '/login' && !hasNavigatedRef.current) {
        console.warn('[PostLoginRouter] Fallback: React Router navigation failed, using hard redirect');
        window.location.href = target;
      }
    }, 1000);
    
    return;
  }, [isSystemReady, capabilities?.ready, userId, profileCompanyId, navigate]);
  
  // ✅ KERNEL MANIFESTO: Rule 2 - UI Gate - Show loading while Kernel initializes
  if (!isSystemReady) {
    return <LoadingScreen message="Unlocking Workspace..." />;
  }
  
  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state
  return <LoadingScreen message="Unlocking Workspace..." />;
}
