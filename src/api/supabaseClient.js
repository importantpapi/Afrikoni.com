import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create singleton Supabase client to avoid multiple GoTrueClient instances
let supabaseInstance = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'afrikoni-auth'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
})();

// ============================================================================
// CHROME EXTENSION ERROR SUPPRESSION
// ============================================================================
// Suppress "Unchecked runtime.lastError" and "message channel closed" errors
// from Chrome extensions (e.g., Hybr.id, password managers, etc.)
if (typeof window !== 'undefined') {
  // Suppress console errors from extensions
  const originalError = console.error;
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    // Filter out extension-related errors
    if (
      message.includes('runtime.lastError') ||
      message.includes('message channel closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://') ||
      message.includes('safari-extension://')
    ) {
      // Silently ignore extension errors
      return;
    }
    // Log all other errors normally
    originalError.apply(console, args);
  };

  // Suppress unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    if (
      reason.includes('runtime.lastError') ||
      reason.includes('message channel closed') ||
      reason.includes('Extension context invalidated') ||
      reason.includes('chrome-extension://')
    ) {
      event.preventDefault(); // Suppress the error
      return;
    }
  });

  // Suppress runtime.lastError warnings
  if (window.chrome?.runtime) {
    const originalSendMessage = window.chrome.runtime.sendMessage;
    if (originalSendMessage) {
      window.chrome.runtime.sendMessage = function(...args) {
        try {
          return originalSendMessage.apply(this, args);
        } catch (error) {
          // Silently catch extension errors
          if (error?.message?.includes('lastError') || error?.message?.includes('channel closed')) {
            return;
          }
          throw error;
        }
      };
    }
  }
}

// ============================================================================
// SUPABASE ERROR INTERCEPTOR
// ============================================================================
// Global error interceptor for debugging
// This catches ALL Supabase errors that might not be handled in individual queries
if (import.meta.env.DEV) {
  // Intercept fetch requests to Supabase
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('supabase.co')) {
      try {
        const response = await originalFetch.apply(this, args);
        // Log errors in dev mode only
        if (!response.ok && import.meta.env.DEV) {
          console.debug('Supabase request failed:', { url, status: response.status, statusText: response.statusText });
        }
        return response;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Supabase fetch error:', { url, error: error?.message });
        }
        throw error;
      }
    }
    return originalFetch.apply(this, args);
  };
}

// ============================================================================
// AUTH READY HELPER
// ============================================================================
/**
 * Ensure Supabase auth session is ready before making queries
 * Returns true if session is ready, false otherwise
 */
export async function ensureAuthReady() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.debug('Auth session error:', error);
      return false;
    }
    return !!session;
  } catch (error) {
    console.debug('Auth check failed:', error);
    return false;
  }
}

// ============================================================================
// SAFE QUERY HELPER
// ============================================================================
/**
 * Execute a Supabase query with proper error handling and null checks
 * @param {Function} queryFn - Function that returns a Supabase query
 * @param {Object} options - Options: { requireAuth, defaultValue, onError }
 */
export async function safeQuery(queryFn, options = {}) {
  const { requireAuth = true, defaultValue = null, onError = null } = options;
  
  try {
    // Check auth if required
    if (requireAuth) {
      const authReady = await ensureAuthReady();
      if (!authReady) {
        if (onError) onError(new Error('Authentication required'));
        return defaultValue;
      }
    }
    
    // Execute query
    const result = await queryFn();
    
    // Check for Supabase errors
    if (result.error) {
      // Handle specific error codes
      if (result.error.code === '42501') {
        console.debug('RLS policy violation:', result.error.message);
      } else if (result.error.code === '42P01') {
        console.debug('Table does not exist:', result.error.message);
      } else if (result.error.code === 'PGRST116') {
        // No rows found - this is OK
        return defaultValue || [];
      }
      
      if (onError) onError(result.error);
      return defaultValue;
    }
    
    return result.data ?? defaultValue;
  } catch (error) {
    console.error('Query execution error:', error);
    if (onError) onError(error);
    return defaultValue;
  }
}

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

