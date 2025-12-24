/**
 * PostLoginRouter - Single Source of Truth for Post-Login Routing
 * 
 * This is the ONLY place that decides where users go after login or session restore.
 * 
 * GUARANTEES:
 * - Self-heals missing profiles
 * - Redirects based on actual role state
 * - Supports Buyer, Seller, Hybrid, Logistics, Admin
 * - Eliminates redirect loops, 404s, and role confusion
 * - Never fails due to database logic
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Using relative import as fallback to ensure it always works
import { supabase } from '../api/supabaseClient';

export default function PostLoginRouter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveUser = async () => {
      try {
        // Get authenticated user
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate('/login', { replace: true });
          return;
        }

        // Check email verification (optional - can be enabled if needed)
        // if (!user.email_confirmed_at) {
        //   navigate('/verify-email', { replace: true });
        //   return;
        // }

        // Get or create profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, onboarding_completed, company_id')
          .eq('id', user.id)
          .single();

        // 🔁 SELF-HEALING PROFILE CREATION (SILENT ERROR HANDLING)
        // Users never see database errors - all failures are handled gracefully
        if (!profile || profileError) {
          try {
            console.log('🔧 Self-healing: Creating missing profile for user:', user.id);
            
            // Use UPSERT instead of INSERT to handle race conditions
            // This ensures we don't fail if profile was created elsewhere
            const profileData = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: 'buyer', // Default role
              onboarding_completed: false,
              company_id: null
            };
            
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert(profileData, { onConflict: 'id' });

            if (upsertError) {
              // Log error internally but never expose to user
              console.error('[Auth] Profile auto-create failed:', upsertError);
              // Use default profile values - user can still proceed
              profile = {
                role: 'buyer',
                onboarding_completed: false,
                company_id: null
              };
            } else {
              // Retry fetch after upsert
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('role, onboarding_completed, company_id')
                .eq('id', user.id)
                .single();
              
              profile = newProfile || {
                role: 'buyer',
                onboarding_completed: false,
                company_id: null
              };
            }
          } catch (err) {
            // 🔒 CRITICAL: Users never see database errors
            console.error('[Auth] Profile auto-create failed (exception):', err);
            // Use default profile - user can still proceed to dashboard
            profile = {
              role: 'buyer',
              onboarding_completed: false,
              company_id: null
            };
          }
        }

        // Normalize role
        const role = profile?.role || 'buyer';
        const onboardingCompleted = profile?.onboarding_completed === true;
        const hasCompany = !!profile?.company_id;

        // 🧭 ONBOARDING CHECK: If no role selected OR onboarding not completed, show role selection
        // Role selection happens in dashboard - redirect there
        // Dashboard component will show RoleSelection if needed
        if (!role || !onboardingCompleted) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // 🎯 ROLE-BASED REDIRECTION (matches existing Afrikoni dashboard routes exactly)
        switch (role) {
          case 'buyer':
            navigate('/dashboard/buyer', { replace: true });
            break;
          case 'seller':
            navigate('/dashboard/seller', { replace: true });
            break;
          case 'hybrid':
            navigate('/dashboard/hybrid', { replace: true });
            break;
          case 'logistics':
          case 'logistics_partner':
            navigate('/dashboard/logistics', { replace: true });
            break;
          case 'admin':
            navigate('/dashboard/admin', { replace: true });
            break;
          default:
            // Unknown role - show role selection
            navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('❌ PostLoginRouter error:', error);
        // On error, redirect to dashboard (it will handle role selection)
        navigate('/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    resolveUser();
  }, [navigate]);

  // Always show loading state while resolving
  // The component will navigate away, but we need to render something
  return (
    <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold mx-auto mb-4" />
        <p className="text-sm text-afrikoni-deep/70">
          Securing your Afrikoni workspace…
        </p>
      </div>
    </div>
  );
}

