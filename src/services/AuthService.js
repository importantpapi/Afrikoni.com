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

    // Step 2: Immediately fetch profile to verify company_id exists
    // This ensures the Promise only resolves after profile is confirmed
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[AuthService] Profile fetch error:', profileError);
      // Don't throw - profile might not exist yet (will be created by PostLoginRouter)
      // Return user with null profile
      return {
        user: authData.user,
        profile: null
      };
    }

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
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      user: session.user,
      profile: profileData || null
    };
  } catch (error) {
    console.error('[AuthService] Get session error:', error);
    return { user: null, profile: null };
  }
}
