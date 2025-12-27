import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { getDashboardPathForRole } from '@/utils/roleHelpers';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/layouts/DashboardLayout';
import RoleSelection from '@/components/dashboard/RoleSelection';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import BuyerHome from './buyer/BuyerHome';
import SellerHome from './seller/SellerHome';
import LogisticsHome from './logistics/LogisticsHome';
import HybridHome from './hybrid/HybridHome';

export default function Dashboard() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  
  const [currentRole, setCurrentRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state (only for role selection logic)
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    // Safety timeout: Force loading to false after 10 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Dashboard] Loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 10000);

    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[Dashboard] Waiting for auth to be ready...');
      if (isMounted) {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[Dashboard] No user → redirecting to login');
      if (isMounted) {
        clearTimeout(timeoutId);
        setIsLoading(false);
        navigate('/login', { replace: true });
      }
      return;
    }

    console.log('[Dashboard] ✅ AUTH READY - User:', user.id, 'Role:', role);
    
    const init = async () => {
      try {
        setIsLoading(true);

        const onboardingCompleted = profile?.onboarding_completed === true;
        const normalizedRole = role === 'logistics_partner' ? 'logistics' : (role || 'buyer');
        
        const pathRole = location.pathname.includes('/dashboard/seller') ? 'seller' :
                        location.pathname.includes('/dashboard/buyer') ? 'buyer' :
                        location.pathname.includes('/dashboard/hybrid') ? 'hybrid' :
                        location.pathname.includes('/dashboard/logistics') ? 'logistics' :
                        location.pathname.includes('/dashboard/admin') ? 'admin' :
                        null;
        
        const userEmail = user?.email?.toLowerCase();
        const isFounder = userEmail === 'youba.thiam@icloud.com';
        const isAdmin = profile?.is_admin === true || isFounder;
        
        if (pathRole && normalizedRole) {
          const hasAccess = 
            isAdmin ||
            normalizedRole === pathRole ||
            (pathRole === 'seller' && normalizedRole === 'hybrid') ||
            (pathRole === 'buyer' && normalizedRole === 'hybrid') ||
            (pathRole === 'logistics' && normalizedRole === 'logistics');
          
          if (!hasAccess) {
            console.warn(`[Dashboard] Role mismatch: ${normalizedRole} trying to access ${pathRole} dashboard - redirecting to PostLoginRouter`);
            if (isMounted) {
              clearTimeout(timeoutId);
              setIsLoading(false);
              setTimeout(() => {
                navigate('/auth/post-login', { replace: true });
              }, 200);
            }
            return;
          }
        }
        
        if (pathRole === 'logistics' && normalizedRole && normalizedRole !== 'logistics' && isFounder) {
          console.log(`[Dashboard] Founder accessing logistics dashboard via dev switcher (current role: ${normalizedRole})`);
        } else if (pathRole === 'logistics' && normalizedRole && normalizedRole !== 'logistics' && !isAdmin) {
          console.warn(`[Dashboard] Role mismatch for logistics: ${normalizedRole} - redirecting`);
          if (isMounted) {
            clearTimeout(timeoutId);
            setIsLoading(false);
            setTimeout(() => {
              navigate('/auth/post-login', { replace: true });
            }, 200);
          }
          return;
        }
        
        if (!role || !onboardingCompleted) {
          if (isMounted) {
            clearTimeout(timeoutId);
            setNeedsRoleSelection(true);
            setIsLoading(false);
          }
          return;
        }
        
        let effectiveRole = normalizedRole || 'buyer';
        
        if (location.pathname.startsWith('/dashboard/logistics')) {
          effectiveRole = 'logistics';
        } else if (location.pathname.startsWith('/dashboard/buyer')) {
          effectiveRole = 'buyer';
        } else if (location.pathname.startsWith('/dashboard/seller')) {
          effectiveRole = 'seller';
        } else if (location.pathname.startsWith('/dashboard/hybrid')) {
          effectiveRole = 'hybrid';
        }

        if (isMounted) {
          setCurrentRole(effectiveRole);
          setNeedsRoleSelection(false);
        }

        if (location.pathname === '/dashboard') {
          const dashboardPath = getDashboardPathForRole(normalizedRole || 'buyer');
          const finalPath =
            normalizedRole === 'hybrid' || normalizedRole === 'logistics'
              ? `/dashboard/${normalizedRole}`
              : dashboardPath;
          if (isMounted) {
            clearTimeout(timeoutId);
            setIsLoading(false);
            navigate(finalPath, { replace: true });
          }
          return;
        }
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Dashboard init error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
          navigate('/auth/post-login', { replace: true });
        }
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    // Only run when auth is ready
    if (authReady && !authLoading && user) {
      init();
    }

    return () => { 
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authReady, authLoading, user, profile?.company_id, profile?.onboarding_completed, profile?.is_admin, role, navigate, location.pathname]); // Use specific profile fields to prevent re-renders

  const handleRoleSelected = async (selectedRole) => {
    // Use role from AuthProvider (will be updated via refreshProfile)
    const normalizedRole = selectedRole === 'logistics_partner' ? 'logistics' : selectedRole;
    
    setCurrentRole(normalizedRole);
    setNeedsRoleSelection(false);
    
    // Redirect to role-specific dashboard
    const dashboardPath = getDashboardPathForRole(normalizedRole);
    const finalPath =
      normalizedRole === 'hybrid' || normalizedRole === 'logistics'
        ? `/dashboard/${normalizedRole}`
        : dashboardPath;
    navigate(finalPath, { replace: true });
  };

  const renderDashboardContent = () => {
    if (!currentRole) {
      return <BuyerHome />;
    }
    
    switch (currentRole) {
      case 'buyer':
        return <BuyerHome />;
      case 'hybrid':
        return <HybridHome />;
      case 'seller':
        return <SellerHome />;
      case 'logistics':
        return <LogisticsHome />;
      default:
        return <BuyerHome />;
    }
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading dashboard..." />;
  }

  // Show loading state if still resolving role/dashboard
  if (isLoading) {
    return <SpinnerWithTimeout message="Setting up your dashboard..." />;
  }

  // Show role selection if user hasn't selected a role
  if (needsRoleSelection) {
    return <RoleSelection onRoleSelected={handleRoleSelected} />;
  }

  return (
    <DashboardLayout currentRole={currentRole || 'buyer'}>
      <ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again.">
        {renderDashboardContent()}
      </ErrorBoundary>
    </DashboardLayout>
  );
}

