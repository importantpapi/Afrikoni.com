/**
 * Centralized Authentication & User Helpers
 * 
 * Provides single source of truth for:
 * - User authentication checks
 * - Profile fetching (with fallback logic)
 * - Onboarding status checks
 * - Company ID fetching
 */

import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getOrCreateCompany } from './companyHelper';
// ✅ OS RESTORATION FIX: getUserRole import removed - deprecated
// React components use useCapability() hook instead
// This utility is for non-React contexts only

/**
 * Get current authenticated user with full profile and role
 * Handles all fallback logic (profiles/users tables)
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<{user: Object|null, profile: Object|null, companyId: string|null, onboardingCompleted: boolean}>}
 * @deprecated role field removed - use useCapability() hook in React components
 */
export async function getCurrentUserAndRole(supabase, supabaseHelpers) {
  // ✅ FINAL 3% FIX: Function removed - throw error to catch any remaining usage
  throw new Error(
    'getCurrentUserAndRole has been removed as part of kernel alignment. ' +
    'Use useDashboardKernel() hook in React components or direct Supabase calls in non-React contexts. ' +
    'See: src/hooks/useDashboardKernel.js for React usage, or use supabase.auth.getUser() + supabase.from("profiles").select() for non-React.'
  );
}

/**
 * Check if user has completed onboarding
 * 
 * ✅ FINAL 3% FIX: Refactored to use direct Supabase calls instead of getCurrentUserAndRole
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object (deprecated, kept for compatibility)
 * @returns {Promise<boolean>}
 */
export async function hasCompletedOnboarding(supabase, supabaseHelpers) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    return profile?.onboarding_completed === true;
  } catch (error) {
    return false;
  }
}

/**
 * Require authentication - ensures there is a logged-in user with a **fresh** session
 *
 * SECURITY: This MUST always derive state from `supabase.auth.getSession()`
 * to avoid stale/cached auth leaking across users.
 *
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<{user: Object}|null>}
 */
export async function requireAuth(supabase) {
  // 1) Revalidate session first – this is the source of truth
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return null;
  }

  // 2) Fetch current auth user and ensure it matches the session user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Safety check: session/user consistency
  if (user.id !== session.user.id) {
    // Defensive guard: if these ever diverge, treat as unauthenticated
    if (import.meta.env.DEV) {
      console.error('[AUTH] Session/user mismatch detected in requireAuth', {
        sessionUserId: session.user.id,
        userId: user.id,
      });
    }
    return null;
  }

  // Email verification is intentionally **not** required for auth here.
  return { user };
}

/**
 * Require onboarding completion - checks if user has completed onboarding
 * Returns flag so UI can redirect if needed
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<{user: Object, profile: Object, companyId: string|null, onboardingCompleted: boolean}|null>}
 * @deprecated role field removed - use useCapability() hook in React components
 */
export async function requireOnboarding(supabase, supabaseHelpers) {
  const result = await getCurrentUserAndRole(supabase, supabaseHelpers);
  
  if (!result.user) {
    return null; // Not authenticated
  }

  // PRODUCTION FIX: Removed email verification requirement
  // Users can complete onboarding even if email not confirmed
  // const emailVerified = result.user.email_confirmed_at !== null;
  // if (!emailVerified) {
  //   return null; // Treat unconfirmed as not authenticated
  // }
  
  if (!result.onboardingCompleted) {
    return { ...result, needsOnboarding: true }; // Flag for redirect
  }
  
  return result;
}

/**
 * Check if user's email is verified
 * 
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<boolean>}
 */
export async function isEmailVerified(supabase) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }
    
    // Check email_verified flag from auth user
    return user.email_confirmed_at !== null || user.email_verified === true;
  } catch (error) {
    return false;
  }
}

/**
 * Require email verification before allowing dashboard access
 * 
 * ✅ FINAL 3% FIX: Refactored to use direct Supabase calls instead of getCurrentUserAndRole
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object (deprecated, kept for compatibility)
 * @returns {Promise<{user: Object, profile: Object, emailVerified: boolean}|null>}
 * @deprecated role field removed - use useCapability() hook in React components
 */
export async function requireEmailVerification(supabase, supabaseHelpers) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .maybeSingle();

    const emailVerified = await isEmailVerified(supabase);
  
    return {
      user,
      profile: profile || null,
      companyId: profile?.company_id || null,
      emailVerified
    };
  } catch (error) {
    return null;
  }
}

