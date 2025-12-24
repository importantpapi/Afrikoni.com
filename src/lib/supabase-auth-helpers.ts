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

// Check login attempts (rate limiting)
export async function checkLoginAttempts(email: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', fiveMinutesAgo);

  if (error) {
    // If table missing or RLS issues, fail open but log to console
    console.debug('checkLoginAttempts error', error);
    return 0;
  }

  return data?.length || 0;
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


