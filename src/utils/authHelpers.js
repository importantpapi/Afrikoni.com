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
  
  // Defensive check: if supabaseHelpers is missing, import it
  let helpers = supabaseHelpers;
  if (!helpers) {
    try {
      const { supabaseHelpers: importedHelpers } = await import('@/api/supabaseClient');
      helpers = importedHelpers;
    } catch (importError) {
      if (import.meta.env.DEV) {
        console.error('[DEBUG] Failed to import supabaseHelpers:', importError);
      }
      // Return safe defaults if we can't import helpers
      return {
        user: null,
        profile: null,
        role: null,
        companyId: null,
        onboardingCompleted: false
      };
    }
  }
  
  // Validate helpers structure
  if (!helpers || !helpers.auth || typeof helpers.auth.me !== 'function') {
    const errorMsg = `Invalid supabaseHelpers structure: helpers=${!!helpers}, auth=${!!helpers?.auth}, me=${typeof helpers?.auth?.me}`;
    if (import.meta.env.DEV) {
      console.error('[DEBUG]', errorMsg, helpers);
    }
    return {
      user: null,
      profile: null,
      role: 'buyer',
      companyId: null,
      onboardingCompleted: false
    };
  }
  
  try {
    // 1. Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        user: null,
        profile: null,
        role: null,
        companyId: null,
        onboardingCompleted: false
      };
    }

    // 2. Get auth user
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !authUser) {
      return {
        user: null,
        profile: null,
        role: null,
        companyId: null,
        onboardingCompleted: false
      };
    }

    // 3. Fetch user profile using existing helper (handles profiles/users fallback)
    let profile = null;
    try {
      // Defensive check: ensure helpers and helpers.auth exist
      if (!helpers || !helpers.auth || typeof helpers.auth.me !== 'function') {
        throw new Error(`Invalid supabaseHelpers: helpers=${!!helpers}, helpers.auth=${!!helpers?.auth}, helpers.auth.me=${typeof helpers?.auth?.me}`);
      }
      
      profile = await helpers.auth.me();
    } catch (profileError) {
      if (import.meta.env.DEV) {
        console.error('[DEBUG] Profile fetch error:', profileError);
      }
      // If profile doesn't exist, create minimal one
      if (profileError.code === 'PGRST116' || profileError.code === '42P01') {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            full_name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
            role: 'buyer',
            onboarding_completed: false
          }, { onConflict: 'id' });
        if (upsertError) {
          // Ignore profile creation error and fall back to minimal profile
        }
        
        // Return minimal profile data
        profile = {
          id: authUser.id,
          email: authUser.email,
          role: null,
          onboarding_completed: false
        };
      } else {
        // Other error - return null
        return {
          user: authUser,
          profile: null,
          role: null,
          companyId: null,
          onboardingCompleted: false
        };
      }
    }

    if (!profile) {
      return {
        user: authUser,
        profile: null,
        role: null,
        companyId: null,
        onboardingCompleted: false
      };
    }

    // 4. Get or create company (with timeout to prevent hanging)
    let companyId = null;
    try {
      // Add timeout to prevent hanging on company queries
      const companyPromise = getOrCreateCompany(supabase, profile);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Company fetch timeout')), 5000)
      );
      
      companyId = await Promise.race([companyPromise, timeoutPromise]).catch(err => {
        console.warn('[getCurrentUserAndRole] Company fetch failed or timed out:', err.message);
        return null; // Return null on timeout/error
      });
    } catch (companyError) {
      // Continue without company ID - non-blocking
      console.warn('[getCurrentUserAndRole] Company error (non-blocking):', companyError?.message || companyError);
    }

    // 5. Role is deprecated - React components use useCapability() hook instead
    // This utility is for non-React contexts only
    // const role = null; // Deprecated - removed from return object

    // 6. Check onboarding status
    const onboardingCompleted = profile.onboarding_completed === true;

    return {
      user: authUser,
      profile,
      // role removed - deprecated, use useCapability() hook in React components
      companyId,
      onboardingCompleted
    };
  } catch (error) {
    // Return safe defaults on error
    return {
      user: null,
      profile: null,
      // role removed - deprecated
      companyId: null,
      onboardingCompleted: false
    };
  }
}

/**
 * Check if user has completed onboarding
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<boolean>}
 */
export async function hasCompletedOnboarding(supabase, supabaseHelpers) {
  const { onboardingCompleted } = await getCurrentUserAndRole(supabase, supabaseHelpers);
  return onboardingCompleted;
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
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<{user: Object, profile: Object, emailVerified: boolean}|null>}
 * @deprecated role field removed - use useCapability() hook in React components
 */
export async function requireEmailVerification(supabase, supabaseHelpers) {
  const result = await getCurrentUserAndRole(supabase, supabaseHelpers);
  
  if (!result.user) {
    return null; // Not authenticated
  }
  
  const emailVerified = await isEmailVerified(supabase);
  
  return {
    ...result,
    emailVerified
  };
}

