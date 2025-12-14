import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { requireAuth, requireOnboarding } from '@/utils/authHelpers';

export default function ProtectedRoute({ children, requireOnboarding: needsOnboarding = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [needsOnboarding]);

  const checkAuth = async () => {
    try {
      if (needsOnboarding) {
        // Require both auth and onboarding
        const result = await requireOnboarding(supabase, supabaseHelpers);
        if (!result) {
          // Redirected to login or onboarding
          return;
        }
        if (result.needsOnboarding) {
          navigate('/onboarding');
          return;
        }
        setIsAuthorized(true);
      } else {
        // Only require auth
        const result = await requireAuth(supabase);
        if (!result) {
          navigate('/login');
          return;
        }
        setIsAuthorized(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('ProtectedRoute auth error:', error);
      }
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

