import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole } from '@/utils/roleHelpers';
import { isAdmin } from '@/utils/permissions';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/layouts/DashboardLayout';
import BuyerHome from './buyer/BuyerHome';
import SellerHome from './seller/SellerHome';
import LogisticsHome from './logistics/LogisticsHome';
import HybridHome from './hybrid/HybridHome';

export default function Dashboard() {
  const [currentRole, setCurrentRole] = useState('buyer');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadUserAndRole = async () => {
      try {
        // Check session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
          return;
        }

        // Check email verification FIRST
        if (!session.user.email_confirmed_at) {
          if (isMounted) {
            navigate('/verify-email', { replace: true });
          }
          return;
        }

        // Fetch user profile and role
        const { user, profile, role, companyId, onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        if (!isMounted) return;

        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        // Check onboarding completion - MUST have onboarding_completed=true AND company_id
        if (!onboardingCompleted || !companyId) {
          if (isMounted) {
            navigate('/onboarding', { replace: true });
          }
          return;
        }

        // Check if user is admin (pass profile for database flag check)
        const adminCheck = isAdmin(user, profile);
        setIsAdminUser(adminCheck);
        
        // If admin, redirect to admin dashboard
        if (adminCheck) {
          navigate('/dashboard/admin', { replace: true });
          return;
        }
        
        // Normalize role using the helper function
        const normalizedRole = getUserRole(profile || user) || role || 'buyer';
        setCurrentRole(normalizedRole);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user role:', error);
        if (isMounted) {
          setIsLoading(false);
          // Default to buyer role on error
          setCurrentRole('buyer');
        }
      }
    };

    loadUserAndRole();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const renderDashboardContent = () => {
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
