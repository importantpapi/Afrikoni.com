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
import { getUserRole } from './roleHelpers';

/**
 * Get current authenticated user with full profile and role
 * Handles all fallback logic (profiles/users tables)
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<{user: Object|null, profile: Object|null, role: string, companyId: string|null, onboardingCompleted: boolean}>}
 */
export async function getCurrentUserAndRole(supabase, supabaseHelpers) {
  try {
    // 1. Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        user: null,
        profile: null,
        role: 'buyer',
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
        role: 'buyer',
        companyId: null,
        onboardingCompleted: false
      };
    }

    // 3. Fetch user profile using existing helper (handles profiles/users fallback)
    let profile = null;
    try {
      profile = await supabaseHelpers.auth.me();
    } catch (profileError) {
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
          role: 'buyer',
          onboarding_completed: false
        };
      } else {
        // Other error - return null
        return {
          user: authUser,
          profile: null,
          role: 'buyer',
          companyId: null,
          onboardingCompleted: false
        };
      }
    }

    if (!profile) {
      return {
        user: authUser,
        profile: null,
        role: 'buyer',
        companyId: null,
        onboardingCompleted: false
      };
    }

    // 4. Get or create company
    let companyId = null;
    try {
      companyId = await getOrCreateCompany(supabase, profile);
    } catch (companyError) {
      // Continue without company ID - non-blocking
    }

    // 5. Normalize role
    const role = getUserRole(profile);

    // 6. Check onboarding status
    const onboardingCompleted = profile.onboarding_completed === true;

    return {
      user: authUser,
      profile,
      role,
      companyId,
      onboardingCompleted
    };
  } catch (error) {
    // Return safe defaults on error
    return {
      user: null,
      profile: null,
      role: 'buyer',
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
 * Require authentication - ensures there is a logged-in user
 * 
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<{user: Object}|null>}
 */
export async function requireAuth(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return { user };
}

/**
 * Require onboarding completion - checks if user has completed onboarding
 * Returns flag so UI can redirect if needed
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {Object} supabaseHelpers - Supabase helpers object
 * @returns {Promise<{user: Object, profile: Object, role: string, companyId: string|null, onboardingCompleted: boolean}|null>}
 */
export async function requireOnboarding(supabase, supabaseHelpers) {
  const result = await getCurrentUserAndRole(supabase, supabaseHelpers);
  
  if (!result.user) {
    return null; // Not authenticated
  }
  
  if (!result.onboardingCompleted) {
    return { ...result, needsOnboarding: true }; // Flag for redirect
  }
  
  return result;
}

