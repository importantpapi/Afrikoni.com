import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardHome from './DashboardHome';

export default function Dashboard() {
  const [currentRole, setCurrentRole] = useState('buyer');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
    try {
        const { role, onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        if (!isMounted) return;

        // If onboarding not completed, redirect to onboarding
        if (!onboardingCompleted) {
          navigate('/onboarding');
            return;
          }
          
        setCurrentRole(role || 'buyer');
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
  }, [navigate]);

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

