import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';

export default function PostLoginRouter() {
  const { user, profile, authReady } = useAuth();
  const capabilities = useCapability();
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false); // ✅ KERNEL POLISH: Track if navigation already executed

  useEffect(() => {
    // ✅ TOTAL CODE PURGE: RE-LOCK REDIRECT LAW - capabilities.ready is the ONLY gate
    // If Kernel says ready and we have user+profile, navigate IMMEDIATELY - ignore ALL other checks
    if (capabilities?.ready && user && profile && !hasNavigatedRef.current) {
      const target = profile?.company_id ? '/dashboard' : '/onboarding/company';
      console.log("🚀 RE-LOCKED REDIRECT LAW: Kernel is WARM (capabilities.ready=true) - navigating to", target);
      
      // ✅ TOTAL CODE PURGE: Wrap navigate in 100ms timeout to ensure browser finishes rendering
      setTimeout(() => {
        navigate(target, { replace: true });
        hasNavigatedRef.current = true; // ✅ TOTAL PURGE: Mark as navigated to prevent duplicate calls
        console.log("🏁 FINISH LINE REACHED: Navigation executed to", target);
      }, 100); // ✅ TOTAL PURGE: 100ms timeout to ensure browser rendering completes
      
      return; // Exit early - navigation handled
    }
    
    // 🛣️ FORCE NAVIGATION: Direct log to debug router state (only if not navigating)
    if (!hasNavigatedRef.current) {
      console.log("🛣️ Router Check:", { 
        authReady, 
        hasUser: !!user, 
        capsReady: capabilities?.ready,
        capsLoading: capabilities?.loading,
        hasProfile: !!profile,
        companyId: profile?.company_id 
      });
    }
    // ✅ TOTAL CODE PURGE: Removed fallback checks - capabilities.ready is the ONLY gate
  }, [user, profile, capabilities?.ready, navigate]); // ✅ TOTAL PURGE: Removed authReady and capabilities.loading from deps
  
  // ✅ TOTAL VIBRANIUM RESET: Add timeout fallback to prevent infinite waiting
  // ✅ FORENSIC FIX: Include profile === null check to prevent no-man's-land scenario
  useEffect(() => {
    // ✅ TOTAL PURGE: Skip timeout if already navigated
    if (hasNavigatedRef.current) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      // ✅ TOTAL PURGE: Double-check we haven't navigated yet
      if (hasNavigatedRef.current) {
        return;
      }
      
      // Force navigation if capabilities not ready OR profile is null (prevents stuck loading screen)
      if (user && (!capabilities?.ready || !profile)) {
        console.warn('[PostLoginRouter] Timeout - capabilities not ready or profile missing after 10s, forcing navigation');
        // Force navigation even if capabilities aren't ready or profile is null (fallback)
        const target = profile?.company_id ? '/dashboard' : '/onboarding/company';
        
        // ✅ TOTAL PURGE: Wrap navigate in 100ms timeout to ensure browser rendering completes
        setTimeout(() => {
          navigate(target, { replace: true });
          hasNavigatedRef.current = true;
        }, 100); // ✅ TOTAL PURGE: 100ms timeout
      }
    }, 10000); // 10-second timeout
    
    return () => clearTimeout(timeoutId);
  }, [user, profile, capabilities?.ready, navigate]); // ✅ TOTAL PURGE: Removed authReady from deps

  return <LoadingScreen message="Unlocking Workspace..." />;
}
