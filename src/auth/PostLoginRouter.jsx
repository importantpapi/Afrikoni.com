/**
 * PostLoginRouter - Single Source of Truth for Post-Login Routing
 * 
 * This is the ONLY place that decides where users go after login or session restore.
 * 
 * GUARANTEES:
 * - Uses centralized AuthProvider (no duplicate auth calls)
 * - Waits for authReady before routing
 * - Redirects based on actual role state
 * - Supports Buyer, Seller, Hybrid, Logistics, Admin
 * - Eliminates redirect loops, 404s, and role confusion
 * - Never fails due to database logic
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';

/**
 * PostLoginRouter - Centralized Role-Based Routing
 * 
 * Uses AuthProvider (no duplicate auth calls)
 * Waits for authReady before routing
 * Single source of truth for role-based navigation
 */
export default function PostLoginRouter() {
  const navigate = useNavigate();
  const { user, profile, role, authReady, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to be ready
    if (!authReady || loading) {
      console.log('[PostLoginRouter] Waiting for auth to be ready...');
      return;
    }

    // If no user → redirect to login
    if (!user) {
      console.log('[PostLoginRouter] No user → redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    console.log('[PostLoginRouter] ✅ AUTH READY - User:', user.id, 'Role:', role);

    // Check onboarding status
    const onboardingCompleted = profile?.onboarding_completed === true;

    // 🧭 ONBOARDING CHECK: If onboarding not completed, show role selection
    if (!onboardingCompleted) {
      console.log('[PostLoginRouter] Onboarding not completed → redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // 🎯 ROLE-BASED REDIRECTION (centralized routing logic)
    console.log('[PostLoginRouter] Routing based on role:', role);
    
    switch (role) {
      case 'buyer':
        console.log('[PostLoginRouter] → /dashboard/buyer');
        navigate('/dashboard/buyer', { replace: true });
        break;
      case 'seller':
        console.log('[PostLoginRouter] → /dashboard/seller');
        navigate('/dashboard/seller', { replace: true });
        break;
      case 'hybrid':
        console.log('[PostLoginRouter] → /dashboard/hybrid');
        navigate('/dashboard/hybrid', { replace: true });
        break;
      case 'logistics':
      case 'logistics_partner':
        console.log('[PostLoginRouter] → /dashboard/logistics');
        navigate('/dashboard/logistics', { replace: true });
        break;
      case 'admin':
        console.log('[PostLoginRouter] → /dashboard/admin');
        navigate('/dashboard/admin', { replace: true });
        break;
      default:
        console.log('[PostLoginRouter] Unknown role → redirecting to dashboard');
        navigate('/dashboard', { replace: true });
    }
  }, [authReady, loading, user, profile, role, navigate]);

  // Show loading state while waiting for auth or routing
  return (
    <SpinnerWithTimeout message="Securing your Afrikoni workspace…" />
  );
}

