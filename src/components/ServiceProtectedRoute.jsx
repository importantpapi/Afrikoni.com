/**
 * Service Protected Route
 * 
 * Protects dashboard routes by ensuring user's role matches the required role.
 * If role doesn't match, redirects to /choose-service (does NOT log out).
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {'buyer'|'seller'|'hybrid'|'logistics'} props.requiredRole - Required role to access this route
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Loader2 } from 'lucide-react';

export default function ServiceProtectedRoute({ children, requiredRole }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, [requiredRole]);

  const checkAccess = async () => {
    try {
      const { user, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Check if user has a role set
      if (!profile?.role || !['buyer', 'seller', 'hybrid', 'logistics'].includes(profile.role)) {
        // No role set - redirect to choose-service
        navigate('/choose-service', { replace: true });
        return;
      }

      // Check if role matches required role
      if (profile.role !== requiredRole) {
        // Role doesn't match - redirect to choose-service (do NOT log out)
        navigate('/choose-service', { replace: true });
        return;
      }

      // Role matches - grant access
      setHasAccess(true);
    } catch (error) {
      console.error('ServiceProtectedRoute error:', error);
      navigate('/choose-service', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirecting
  }

  return <>{children}</>;
}

