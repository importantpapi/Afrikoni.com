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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:23',message:'getCurrentUserAndRole entry',data:{hasSupabaseHelpers:!!supabaseHelpers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // Defensive check: if supabaseHelpers is missing, import it
  let helpers = supabaseHelpers;
  if (!helpers) {
    try {
      const { supabaseHelpers: importedHelpers } = await import('@/api/supabaseClient');
      helpers = importedHelpers;
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:32',message:'supabaseHelpers auto-imported',data:{hasHelpers:!!helpers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch (logErr) {
        console.debug('[DEBUG] supabaseHelpers auto-imported');
      }
      // #endregion
    } catch (importError) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:40',message:'Failed to import supabaseHelpers',data:{error:importError?.message,stack:importError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch (logErr) {
        console.error('[DEBUG] Failed to import supabaseHelpers:', importError);
      }
      // #endregion
      // Return safe defaults if we can't import helpers
      return {
        user: null,
        profile: null,
        role: 'buyer',
        companyId: null,
        onboardingCompleted: false
      };
    }
  }
  
  // Validate helpers structure
  if (!helpers || !helpers.auth || typeof helpers.auth.me !== 'function') {
    const errorMsg = `Invalid supabaseHelpers structure: helpers=${!!helpers}, auth=${!!helpers?.auth}, me=${typeof helpers?.auth?.me}`;
    console.error('[DEBUG]', errorMsg, helpers);
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:52',message:'Invalid helpers structure',data:{error:errorMsg,helpersKeys:helpers ? Object.keys(helpers) : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    } catch (logErr) {
      console.error('[DEBUG] Invalid helpers structure:', errorMsg);
    }
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:28',message:'Session check',data:{hasSession:!!session,hasError:!!sessionError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:42',message:'getUser result',data:{hasUser:!!authUser,hasError:!!userError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:87',message:'Fetching profile',data:{hasHelpers:!!helpers,helpersType:typeof helpers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch (logErr) {
        console.debug('[DEBUG] Log fetch failed:', logErr);
      }
      // #endregion
      
      // Defensive check: ensure helpers and helpers.auth exist
      if (!helpers || !helpers.auth || typeof helpers.auth.me !== 'function') {
        throw new Error(`Invalid supabaseHelpers: helpers=${!!helpers}, helpers.auth=${!!helpers?.auth}, helpers.auth.me=${typeof helpers?.auth?.me}`);
      }
      
      profile = await helpers.auth.me();
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:97',message:'Profile fetched',data:{hasProfile:!!profile,onboardingCompleted:profile?.onboarding_completed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch (logErr) {
        console.debug('[DEBUG] Log fetch failed:', logErr);
      }
      // #endregion
    } catch (profileError) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authHelpers.jsx:105',message:'Profile fetch error',data:{error:profileError?.message,code:profileError?.code,stack:profileError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch (logErr) {
        console.error('[DEBUG] Profile fetch error (log failed):', profileError);
      }
      // #endregion
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
 * @returns {Promise<{user: Object, profile: Object, role: string, emailVerified: boolean}|null>}
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

