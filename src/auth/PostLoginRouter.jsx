import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';

export default function PostLoginRouter() {
  const { user, profile, authReady } = useAuth();
  const capabilities = useCapability();
  const navigate = useNavigate();

  useEffect(() => {
    // 🛣️ FORCE NAVIGATION: Direct log to debug router state
    console.log("🛣️ Router Check:", { 
      authReady, 
      hasUser: !!user, 
      capsReady: capabilities?.ready,
      capsLoading: capabilities?.loading,
      hasProfile: !!profile,
      companyId: profile?.company_id 
    });
    
    // ✅ TOTAL VIBRANIUM RESET: Wait for BOTH authReady AND capabilities.ready AND profile check
    // Only navigate when ALL conditions are true (no race condition)
    if (authReady && user && profile && capabilities?.ready && !capabilities?.loading) {
      const target = profile?.company_id ? '/dashboard' : '/onboarding/company';
      console.log("🚀 Redirecting to:", target);
      navigate(target, { replace: true });
      // ✅ VERIFICATION: Log FINISH LINE REACHED when navigate executes
      console.log("🏁 FINISH LINE REACHED: Navigation executed to", target);
    } else {
      console.log("⏳ Router waiting:", {
        authReady,
        hasUser: !!user,
        capsReady: capabilities?.ready,
        capsLoading: capabilities?.loading,
        hasProfile: !!profile
      });
    }
  }, [authReady, user, profile, capabilities?.ready, capabilities?.loading, navigate]);
  
  // ✅ TOTAL VIBRANIUM RESET: Add timeout fallback to prevent infinite waiting
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authReady && user && !capabilities?.ready) {
        console.warn('[PostLoginRouter] Timeout - capabilities not ready after 10s, forcing navigation');
        // Force navigation even if capabilities aren't ready (fallback)
        const target = profile?.company_id ? '/dashboard' : '/onboarding/company';
        navigate(target, { replace: true });
      }
    }, 10000); // 10-second timeout
    
    return () => clearTimeout(timeoutId);
  }, [authReady, user, profile, capabilities?.ready, navigate]);

  return <LoadingScreen message="Unlocking Workspace..." />;
}
