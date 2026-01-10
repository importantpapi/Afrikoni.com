/**
 * AuthGate - Simple Authentication Check
 * 
 * Only checks if user is authenticated.
 * Delegates all routing logic to PostLoginRouter.
 * 
 * ❌ NO role logic
 * ❌ NO onboarding logic
 * ❌ NO redirects except to /login
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import PostLoginRouter from '@/auth/PostLoginRouter';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

export default function AuthGate({ children }) {
  const navigate = useNavigate();
  // Use centralized AuthProvider (no duplicate getSession calls)
  const { user, authReady, loading: authLoading } = useAuth();

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Checking authentication..." />;
  }

  // If not authenticated, show public content
  if (!user) {
    return <>{children}</>;
  }

  // If authenticated, let PostLoginRouter handle routing
  return <PostLoginRouter />;
}

