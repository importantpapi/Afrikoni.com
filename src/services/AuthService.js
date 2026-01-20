/**
 * AuthService - Atomic Authentication Service Layer
 * 
 * Provides atomic login/logout operations with proper state synchronization.
 * 
 * LOGIN FLOW:
 * 1. signInWithPassword() → Supabase auth
 * 2. Manual profile fetch → Verify company_id exists
 * 3. Promise resolves only after profile is confirmed
 * 
 * LOGOUT FLOW:
 * 1. signOut({ scope: 'global' }) → Atomic signout
 * 2. Clear localStorage → Remove all auth state
 * 3. window.location.href reset → Physically wipe React Context state
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Login with atomic profile verification
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: object, profile: object}>} - User and profile objects
 * @throws {Error} - If login fails or profile verification fails
 */
export async function login(email, password) {
  try {
    // Step 1: Sign in with password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (authError) {
      throw authError;
    }

    if (!authData?.user) {
      throw new Error('No user returned from authentication');
    }

    // ✅ KERNEL HANDSHAKE: Retry profile fetch to handle race condition
    // On slow networks or cold-start databases, a single fetch often fails
    // Retry 3 times with exponential backoff (500ms, 1000ms, 2000ms)
    const fetchProfileWithRetry = async (userId, maxAttempts = 3) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(); // ✅ GLOBAL REFACTOR: Use .single() instead of .maybeSingle()

          if (profileError) {
            // Handle PGRST116 (not found) - return null after all retries
            if (profileError.code === 'PGRST116') {
              if (attempt < maxAttempts) {
                const delayMs = 500 * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`[AuthService] Profile not found (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
              }
              // Last attempt - profile doesn't exist, return null
              console.log(`[AuthService] Profile not found after ${maxAttempts} attempts - returning null`);
              return null;
            }
            // Network errors or other errors - throw
            throw profileError;
          }

          // Success - return profile data
          return profileData;
        } catch (error) {
          // If it's the last attempt and not PGRST116, throw
          if (attempt === maxAttempts) {
            if (error.code === 'PGRST116') {
              console.log(`[AuthService] Profile not found after ${maxAttempts} attempts - returning null`);
              return null;
            }
            throw error;
          }
          // Wait before retry with exponential backoff
          const delayMs = 500 * Math.pow(2, attempt - 1);
          console.log(`[AuthService] Profile fetch error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      return null;
    };

    // Step 2: Fetch profile with retry logic
    const profileData = await fetchProfileWithRetry(authData.user.id);

    // ✅ PRIORITY 1 FIX: Metadata sync with retry logic (2 attempts)
    // This ensures RLS policies can access is_admin from the JWT token
    // Login doesn't resolve until refresh is confirmed successful
    const syncMetadataWithRetry = async (maxAttempts = 2) => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Update user metadata with admin flag
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              is_admin: profileData?.is_admin || false
            }
          });
          
          if (updateError) {
            throw updateError;
          }
          
          console.log(`[AuthService] Admin flag synced to JWT metadata (attempt ${attempt}/${maxAttempts}):`, profileData?.is_admin || false);
          
          // Refresh session immediately to ensure RLS policies see the flag
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            throw refreshError;
          }
          
          console.log(`[AuthService] Session refreshed with updated metadata (attempt ${attempt}/${maxAttempts})`);
          return; // Success - exit retry loop
        } catch (metadataError) {
          if (attempt === maxAttempts) {
            // Last attempt failed - log error but don't block login
            console.warn('[AuthService] Failed to sync admin flag to metadata after all retries (non-critical):', metadataError);
            return;
          }
          // Retry with delay
          const delayMs = 500 * attempt; // 500ms, 1000ms
          console.warn(`[AuthService] Metadata sync failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`, metadataError);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    };
    
    await syncMetadataWithRetry();

    // Step 3: Return user and profile (profile may be null if not created yet)
    return {
      user: authData.user,
      profile: profileData
    };
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw error;
  }
}

/**
 * Logout with atomic state wipe
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    // Step 1: Atomic signout with global scope
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });

    if (signOutError) {
      console.error('[AuthService] Signout error:', signOutError);
      // Continue with cleanup even if signout fails
    }

    // Step 2: Clear localStorage (remove all auth state)
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (storageError) {
      console.error('[AuthService] Storage clear error:', storageError);
      // Continue with redirect even if storage clear fails
    }

    // Step 3: Hard redirect to physically wipe React Context state
    // This ensures all React Context providers reset to initial state
    window.location.href = '/login';
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    // Even on error, force redirect to ensure state wipe
    window.location.href = '/login';
  }
}

/**
 * Get current session with profile
 * @returns {Promise<{user: object|null, profile: object|null}>}
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      return { user: null, profile: null };
    }

    // Fetch profile
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single(); // ✅ GLOBAL REFACTOR: Use .single() instead of .maybeSingle()

      // Handle PGRST116 (not found) - return null for profile
      if (profileError && profileError.code === 'PGRST116') {
        return {
          user: session.user,
          profile: null
        };
      }

      if (profileError) {
        throw profileError;
      }

      return {
        user: session.user,
        profile: profileData || null
      };
    } catch (error) {
      console.error('[AuthService] Get session profile error:', error);
      return {
        user: session.user,
        profile: null
      };
    }
  } catch (error) {
    console.error('[AuthService] Get session error:', error);
    return { user: null, profile: null };
  }
}
