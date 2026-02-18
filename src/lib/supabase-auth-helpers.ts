import { supabase } from '../api/supabaseClient';

// Get user roles
export async function getUserRoles(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((r: any) => r.roles?.name).filter(Boolean);
}

// Add role to user
export async function addUserRole(userId: string, roleName: string) {
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleError || !role) throw new Error('Role not found');

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: role.id });

  if (error) throw error;
}

// Get business profile
export async function getBusinessProfile(userId: string) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

// Create business profile
export async function createBusinessProfile(userId: string, profile: any) {
  const { data, error } = await supabase
    .from('business_profiles')
    .insert({
      user_id: userId,
      ...profile
    })
    .select()
    .single();

  return { data, error };
}

// Log auth event
export async function logAuthEvent(
  userId: string | null,
  eventType: string,
  metadata?: any
) {
  await supabase.from('auth_logs').insert({
    user_id: userId,
    event_type: eventType,
    metadata
  });
}

// Maximum failed login attempts before lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Check login attempts and enforce lockout
export async function checkLoginAttempts(email: string): Promise<{ allowed: boolean; attempts: number; retryAfterMs: number }> {
  const fiveMinutesAgo = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from('login_attempts')
    .select('attempted_at')
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', fiveMinutesAgo)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.debug('checkLoginAttempts error', error);
    return { allowed: true, attempts: 0, retryAfterMs: 0 };
  }

  const attempts = data?.length || 0;

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const oldestAttempt = data[data.length - 1]?.attempted_at;
    const retryAfterMs = oldestAttempt
      ? LOCKOUT_WINDOW_MS - (Date.now() - new Date(oldestAttempt).getTime())
      : LOCKOUT_WINDOW_MS;
    return { allowed: false, attempts, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { allowed: true, attempts, retryAfterMs: 0 };
}

// Record login attempt
export async function recordLoginAttempt(email: string, success: boolean) {
  await supabase.from('login_attempts').insert({
    email,
    success,
    attempted_at: new Date().toISOString()
  });
}

// Get/Set last selected role
export async function getLastSelectedRole(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('last_selected_role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.debug('getLastSelectedRole error', error);
    return null;
  }

  return data?.last_selected_role ?? null;
}

export async function setLastSelectedRole(userId: string, role: string) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      last_selected_role: role,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.debug('setLastSelectedRole error', error);
  }
}


