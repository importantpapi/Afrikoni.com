import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getDashboardPathForRole } from '@/utils/roleHelpers';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardHome from './DashboardHome';

export default function Dashboard() {
  const [currentRole, setCurrentRole] = useState('buyer');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
    try {
        // Check email verification
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const emailVerified = authUser?.email_confirmed_at !== null;
        
        if (!isMounted) return;
        
        // Check onboarding and role
        const { role, onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        // If onboarding not completed, redirect to onboarding step 1
        if (!onboardingCompleted) {
          navigate('/onboarding?step=1', { replace: true });
          return;
        }
        
        // Email verification status checked (not blocking access)
          
        const normalizedRole = role || 'buyer';
        setCurrentRole(normalizedRole);

        // If user hit the base /dashboard route, redirect them to a role-specific dashboard
        if (location.pathname === '/dashboard') {
          const dashboardPath = getDashboardPathForRole(normalizedRole);
          // For hybrid and logistics, use unified dashboard
          const finalPath = (normalizedRole === 'hybrid' || normalizedRole === 'logistics') 
            ? `/dashboard/${normalizedRole}` 
            : dashboardPath;
          navigate(finalPath, { replace: true });
          return;
        }
      } catch (error) {
          // Error logged (removed for production)
        if (isMounted) {
          navigate('/login');
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

  const renderDashboardContent = () => {
    // Use the new enterprise dashboard home
    return <DashboardHome currentRole={currentRole} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again.">
      {renderDashboardContent()}
      </ErrorBoundary>
    </DashboardLayout>
  );
}

