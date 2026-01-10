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

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

export default function ServiceProtectedRoute({ children, requiredRole }) {
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Check if user has a role set
    const userRole = role || profile?.role || null;
    if (!userRole || !['buyer', 'seller', 'hybrid', 'logistics'].includes(userRole)) {
      // No role set - redirect to choose-service
      navigate('/choose-service', { replace: true });
      return;
    }

    // Check if role matches required role
    if (userRole !== requiredRole) {
      // Role doesn't match - redirect to choose-service (do NOT log out)
      navigate('/choose-service', { replace: true });
      return;
    }

    // Role matches - access granted (rendered below)
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

