import { supabase } from '@/api/supabaseClient';

/**
 * Simple post-login redirect logic
 * 1. Check if user has a role
 * 2. If no role → /choose-service
 * 3. If role exists → /{role}/dashboard
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return '/choose-service';
    }

    const validRoles = ['buyer', 'seller', 'hybrid', 'logistics'];
    const hasRole = profile?.role && validRoles.includes(profile.role);

    if (!hasRole) {
      return '/choose-service';
    }

    return `/${profile.role}/dashboard`;
  } catch (error) {
    console.warn('Post-login redirect error, defaulting to choose-service:', error);
    return '/choose-service';
  }
}
