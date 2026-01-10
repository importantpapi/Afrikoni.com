import { supabase } from '@/api/supabaseClient';

/**
 * PHASE 4: Capability-based post-login redirect (removed role-based routing)
 * 1. Check if user has company_id
 * 2. If no company_id → /onboarding/company
 * 3. If company_id exists → /dashboard
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return '/onboarding/company';
    }

    // PHASE 4: Navigate based on company_id, not role
    if (profile?.company_id) {
      return '/dashboard';
    }

    return '/onboarding/company';
  } catch (error) {
    console.warn('Post-login redirect error, defaulting to onboarding:', error);
    return '/onboarding/company';
  }
}
