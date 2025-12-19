import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { requireAuth, requireOnboarding, getCurrentUserAndRole } from '@/utils/authHelpers';
import { isAdmin } from '@/utils/permissions';
import AccessDenied from './AccessDenied';

export default function ProtectedRoute({ 
  children, 
  requireOnboarding: needsOnboarding = false,
  requireAdmin: needsAdmin = false 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkAuth();
    // We intentionally only depend on needsOnboarding and needsAdmin here; Supabase clients are stable singletons.
  }, [needsOnboarding, needsAdmin]);

  const checkAuth = async () => {
    try {
      // Check if admin access is required
      if (needsAdmin) {
        const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        if (!userData) {
          navigate('/login');
          return;
        }

        const hasAdminAccess = isAdmin(userData);
        if (!hasAdminAccess) {
          console.warn('❌ Access denied: Admin-only page');
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (needsOnboarding) {
        // Require both auth and onboarding
        const result = await requireOnboarding(supabase, supabaseHelpers);
        if (!result) {
          // Not authenticated - let requireOnboarding / callers redirect as needed
          return;
        }

        if (result.needsOnboarding) {
          // Route users to the correct onboarding experience based on their role
          if (result.role === 'logistics') {
            navigate('/logistics-partner-onboarding');
          } else {
            navigate('/onboarding');
          }
          return;
        }

        setIsAuthorized(true);
      } else {
        // Only require auth
        const result = await requireAuth(supabase);
        if (!result) {
          // Preserve current location as "from" state for redirect after login
          const next = searchParams.get('next') || location.pathname + location.search;
          navigate(`/login?next=${encodeURIComponent(next)}`);
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

  if (accessDenied) {
    return <AccessDenied />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

