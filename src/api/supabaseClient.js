import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions to match Base44 API patterns for easier migration
export const supabaseHelpers = {
  // Auth helpers
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;
      
      // Try profiles table first (as per new structure)
      let profile = null;
      let profileError = null;
      
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profilesErr && profilesErr.code !== 'PGRST116') {
        // If profiles table doesn't exist, fall back to auth user metadata only.
        // Do NOT query the private users table from the client (it is not exposed via RLS).
        if (profilesErr.code === '42P01') {
          profile = null;
        } else {
          profileError = profilesErr;
        }
      } else {
        profile = profilesData;
      }
      
      if (profileError) throw profileError;
      
      return {
        id: user.id,
        email: user.email,
        ...profile,
        // Support both 'role' and 'user_role' field names
        user_role: profile?.user_role || profile?.role,
        role: profile?.role || profile?.user_role
      };
    },
    
    signUp: async (email, password, metadata = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
      return data;
    },
    
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },
    
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    
    updateMe: async (updates) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');
      
      // Update auth metadata
      if (updates.email) {
        const { error } = await supabase.auth.updateUser({ email: updates.email });
        if (error) throw error;
      }
      
      // Try to update profiles table first
      let result = null;
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (profilesErr && profilesErr.code !== '42P01') {
        // If profiles table doesn't exist or other errors, surface the error
        if (profilesErr.code === '42P01' || profilesErr.code === 'PGRST116') {
          // Silently ignore profiles table missing; use auth metadata only
          result = null;
        } else {
          throw profilesErr;
        }
      } else {
        result = profilesData;
      }
      
      return result;
    },
    
    redirectToLogin: (redirectUrl) => {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    },
    
    signInWithOAuth: async (provider, options = {}) => {
      const redirectUrl = options.queryParams?.redirect_to || window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectUrl)}`,
          ...options
        }
      });
      if (error) throw error;
      return data;
    }
  },
  
  // Storage helpers
  storage: {
    uploadFile: async (file, bucket = 'files', path = null) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = path || `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Clean filename to remove special characters
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9._/-]/g, '_');
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(cleanFileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('Storage upload error:', error);
          throw new Error(error.message || 'Failed to upload file');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        
        return { file_url: publicUrl, path: data.path };
      } catch (error) {
        console.error('Upload file error:', error);
        throw error;
      }
    }
  },
  
  // Email helper (Note: Supabase doesn't have built-in email, you'll need to use a service like Resend, SendGrid, etc.)
  // For now, we'll create a placeholder that you can replace with your email service
  email: {
    send: async ({ to, subject, body }) => {
      // TODO: Implement email sending with your preferred service
      // Email sending placeholder - implement with Supabase Edge Functions or external service
      // You can use Supabase Edge Functions or an external service
      return { success: true };
    }
  }
};

export default supabase;

