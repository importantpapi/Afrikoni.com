/**
 * ProtectedRoute - Uses centralized AuthProvider
 * 
 * GUARANTEES:
 * - Waits for authReady before checking auth
 * - Uses auth context (no duplicate auth calls)
 * - Always terminates loading (via SpinnerWithTimeout)
 */

import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isAdmin } from '@/utils/permissions';
import { toast } from 'sonner';
import { SpinnerWithTimeout } from './ui/SpinnerWithTimeout';
import AccessDenied from './AccessDenied';

export default function ProtectedRoute({ 
  children, 
  requireAdmin: needsAdmin = false 
}) {
  const { user, profile, role, authReady, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Wait for auth to be ready
  if (!authReady || loading) {
    return <SpinnerWithTimeout message="Checking authentication..." />;
  }

  // If no user → redirect to login
  if (!user) {
    const next = searchParams.get('next') || location.pathname + location.search;
    navigate(`/login?next=${encodeURIComponent(next)}`);
    toast.error('Please log in to continue', { duration: 3000 });
    return null;
  }

  // Check admin access if required
  if (needsAdmin) {
    const hasAdminAccess = isAdmin(user, profile);
    if (!hasAdminAccess) {
      console.warn('[ProtectedRoute] ❌ Access denied: Admin-only page');
      return <AccessDenied />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

