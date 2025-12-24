import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getDashboardPathForRole } from '@/utils/roleHelpers';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/layouts/DashboardLayout';
import RoleSelection from '@/components/dashboard/RoleSelection';
import BuyerHome from './buyer/BuyerHome';
import SellerHome from './seller/SellerHome';
import LogisticsHome from './logistics/LogisticsHome';

export default function Dashboard() {
  const [currentRole, setCurrentRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // 🛡️ SIMPLE AUTH CHECK ONLY - No redirect logic here
        // PostLoginRouter handles all routing decisions
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
          return;
        }
        
        if (!isMounted) return;
        
        // Get role and onboarding status for display purposes only
        const { role, onboardingCompleted, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        // 🛡️ ROLE-AWARE DASHBOARD VERIFICATION (ANTI-SPOOF)
        // Verify user's role matches the dashboard route they're trying to access
        const pathRole = location.pathname.includes('/dashboard/seller') ? 'seller' :
                        location.pathname.includes('/dashboard/buyer') ? 'buyer' :
                        location.pathname.includes('/dashboard/hybrid') ? 'hybrid' :
                        location.pathname.includes('/dashboard/logistics') ? 'logistics' :
                        location.pathname.includes('/dashboard/admin') ? 'admin' :
                        null;
        
        if (pathRole && role) {
          // Admin can access any dashboard
          const isAdmin = profile?.is_admin === true;
          
          // Verify role access (with special cases)
          const hasAccess = 
            isAdmin || // Admin can access everything
            role === pathRole || // Exact match
            (pathRole === 'seller' && role === 'hybrid') || // Hybrid can access seller
            (pathRole === 'buyer' && role === 'hybrid'); // Hybrid can access buyer
          
          if (!hasAccess) {
            // Role mismatch - redirect to PostLoginRouter for proper routing
            console.warn(`[Auth] Role mismatch: ${role} trying to access ${pathRole} dashboard`);
            if (isMounted) {
              navigate('/auth/post-login', { replace: true });
            }
            return;
          }
        }
        
        // If no role selected or onboarding not completed, show role selection
        if (!role || !onboardingCompleted) {
          if (isMounted) {
            setNeedsRoleSelection(true);
            setIsLoading(false);
          }
          return;
        }
        
        // Determine effective role based on URL and actual role
        const normalizedRole = role || 'buyer';
        let effectiveRole = normalizedRole;
        
        // Respect URL hint for role-specific dashboards
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

        // If user hit the base /dashboard route, redirect to role-specific dashboard
        // This is the ONLY redirect in dashboard - role-specific routing
        if (location.pathname === '/dashboard') {
          const dashboardPath = getDashboardPathForRole(normalizedRole);
          const finalPath =
            normalizedRole === 'hybrid' || normalizedRole === 'logistics'
              ? `/dashboard/${normalizedRole}`
              : dashboardPath;
          if (isMounted) {
            navigate(finalPath, { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error('Dashboard init error:', error);
        if (isMounted) {
          // On error, redirect to PostLoginRouter to handle routing
          navigate('/auth/post-login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => { isMounted = false; };
  }, [navigate, location.pathname]);

  const handleRoleSelected = async (selectedRole) => {
    // Reload user data to get updated role
    const { role } = await getCurrentUserAndRole(supabase, supabaseHelpers);
    const normalizedRole = role || selectedRole;
    
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
      case 'hybrid':
        return <BuyerHome />;
      case 'seller':
        return <SellerHome />;
      case 'logistics':
        return <LogisticsHome />;
      default:
        return <BuyerHome />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
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

