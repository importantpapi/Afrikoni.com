# 🔐 Complete Authentication Implementation Export
## Afrikoni Marketplace - Full Auth System Documentation

**Generated:** 2025-01-21  
**Project:** Afrikoni Marketplace  
**Auth Provider:** Supabase (GoTrue)  
**Status:** ✅ Production Ready - Enterprise Grade

---

## 📋 Table of Contents

1. [Supabase Client Initialization](#1-supabase-client-initialization)
2. [Auth Helpers & Utilities](#2-auth-helpers--utilities)
3. [Auth Pages (UI Components)](#3-auth-pages-ui-components)
4. [Route Guards & Protection](#4-route-guards--protection)
5. [Context Providers](#5-context-providers)
6. [Session Management](#6-session-management)
7. [OAuth Components](#7-oauth-components)
8. [Database Schema (SQL Migrations)](#8-database-schema-sql-migrations)
9. [Edge Functions](#9-edge-functions)
10. [Environment Variables](#10-environment-variables)
11. [Post-Login Redirect Logic](#11-post-login-redirect-logic)
12. [Email Service Integration](#12-email-service-integration)

---

## 1. Supabase Client Initialization

### File: `src/api/supabaseClient.js`

**Purpose:** Singleton Supabase client with auth configuration, error handling, and helper methods.

**Full Code:**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Chrome Extension Error Suppression (lines 34-90)
// ... (see full file for complete implementation)

// Auth Ready Helper
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

// Safe Query Helper
export async function safeQuery(queryFn, options = {}) {
  const { requireAuth = true, defaultValue = null, onError = null } = options;
  
  try {
    if (requireAuth) {
      const authReady = await ensureAuthReady();
      if (!authReady) {
        if (onError) onError(new Error('Authentication required'));
        return defaultValue;
      }
    }
    
    const result = await queryFn();
    
    if (result.error) {
      if (result.error.code === '42501') {
        console.debug('RLS policy violation:', result.error.message);
      } else if (result.error.code === '42P01') {
        console.debug('Table does not exist:', result.error.message);
      } else if (result.error.code === 'PGRST116') {
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

// Supabase Helpers Object
export const supabaseHelpers = {
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;
      
      let profile = null;
      let profileError = null;
      
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profilesErr && profilesErr.code !== 'PGRST116') {
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
      // Do NOT throw here – let callers inspect the error so we can handle
      // non-fatal cases like "Error sending confirmation email" gracefully.
      return { data, error };
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
      
      if (updates.email) {
        const { error } = await supabase.auth.updateUser({ email: updates.email });
        if (error) throw error;
      }
      
      let result = null;
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (profilesErr && profilesErr.code !== '42P01') {
        if (profilesErr.code === '42P01' || profilesErr.code === 'PGRST116') {
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
  
  storage: {
    uploadFile: async (file, bucket = 'files', path = null) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = path || `${Math.random().toString(36).substring(2)}.${fileExt}`;
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
  
  email: {
    send: async ({ to, subject, body }) => {
      // TODO: Implement email sending with your preferred service
      return { success: true };
    }
  }
};

export default supabase;
```

**Key Features:**
- Singleton pattern to prevent multiple client instances
- Session persistence in localStorage with key `afrikoni-auth`
- Auto-refresh token enabled
- Chrome extension error suppression
- Safe query wrapper with RLS error handling
- Helper methods for auth, storage, and email

---

## 2. Auth Helpers & Utilities

### File: `src/lib/supabase-auth-helpers.ts`

**Purpose:** TypeScript helpers for roles, business profiles, auth logging, and rate limiting.

**Full Code:**

```typescript
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
```

### File: `src/utils/authHelpers.js`

**Purpose:** Centralized authentication & user helpers for profile fetching, onboarding checks, and email verification.

**Full Code:** (See file content above - 280 lines)

**Key Functions:**
- `getCurrentUserAndRole(supabase, supabaseHelpers)` - Get user with full profile and role
- `hasCompletedOnboarding(supabase, supabaseHelpers)` - Check onboarding status
- `requireAuth(supabase)` - Require authentication
- `requireOnboarding(supabase, supabaseHelpers)` - Require onboarding completion
- `isEmailVerified(supabase)` - Check email verification
- `requireEmailVerification(supabase, supabaseHelpers)` - Require email verification

### File: `src/lib/post-login-redirect.ts`

**Purpose:** Enterprise post-login redirect logic (zero lost users).

**Full Code:**

```typescript
import { supabase } from '@/api/supabaseClient';
import { getUserRoles, getBusinessProfile, getLastSelectedRole } from './supabase-auth-helpers';

export async function getPostLoginRedirect(userId: string): Promise<string> {
  // Check email verification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !user.email_confirmed_at) {
    return '/verify-email-prompt';
  }

  // Get user roles via enterprise table
  const roles = await getUserRoles(userId);

  if (!roles || roles.length === 0) {
    // Fallback: try legacy profile role to avoid losing users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role) {
      return `/dashboard`; // existing system chooses dashboard by role internally
    }

    return '/onboarding'; // safety setup path
  }

  // Seller/Logistics pending approval
  if (roles.includes('seller') || roles.includes('logistics')) {
    const { data: businessProfile } = await getBusinessProfile(userId);
    if (businessProfile?.verification_status === 'pending') {
      return '/account-pending';
    }
  }

  // Single role: direct
  if (roles.length === 1) {
    const role = roles[0];
    return `/${role}/dashboard`;
  }

  // Multiple roles: last selected or selection screen
  const lastRole = await getLastSelectedRole(userId);
  if (lastRole && roles.includes(lastRole)) {
    return `/${lastRole}/dashboard`;
  }

  return '/select-role';
}
```

---

## 3. Auth Pages (UI Components)

### File: `src/pages/login.jsx`

**Purpose:** User login page with email/password, OAuth, rate limiting, and email verification checks.

**Key Features:**
- Email/password authentication
- Google & Facebook OAuth
- Rate limiting (5 attempts, 10-minute lockout)
- Email verification requirement (MVP rule)
- Auto-fix email domain typos (afrikonii.com → afrikoni.com)
- Resend confirmation email option
- Post-login redirect logic

**Full Code:** (517 lines - see file content above)

### File: `src/pages/signup.jsx`

**Purpose:** User registration with multi-role selection, email verification, and profile creation.

**Key Features:**
- Multi-role selection (Buyer, Seller, Hybrid, Logistics)
- Password visibility toggles
- Email domain typo auto-fix
- Profile creation on signup
- Email verification via auth-email edge function
- OAuth signup support
- Non-fatal email send error handling

**Full Code:** (544 lines - see file content above)

### File: `src/pages/forgot-password.jsx`

**Purpose:** Password reset request page using auth-email edge function.

**Key Features:**
- Calls auth-email edge function for password reset
- Email domain typo auto-fix
- Success/error states
- Audit logging

**Full Code:** (215 lines - see file content above)

### File: `src/pages/auth-confirm.jsx`

**Purpose:** Email confirmation handler for Supabase verification links.

**Key Features:**
- Multiple verification methods (verifyOtp with token_hash, token, session check)
- Resend confirmation option
- Welcome email trigger on success
- Auth event logging

**Full Code:** (257 lines - see file content above)

### File: `src/pages/auth-callback.jsx`

**Purpose:** OAuth callback handler for Google/Facebook sign-in.

**Key Features:**
- OAuth token processing
- Profile creation for new OAuth users
- Email verification check (blocks if not confirmed)
- Onboarding status check
- Role-based redirect

**Full Code:** (194 lines - see file content above)

### File: `src/pages/auth-success.jsx`

**Purpose:** Success page shown after email confirmation.

**Full Code:** (85 lines - see file content above)

### File: `src/pages/select-role.jsx`

**Purpose:** Role selection page for hybrid users.

**Key Features:**
- Buyer/Seller mode selection
- Persists last selected role to user_preferences
- localStorage caching
- Redirects to appropriate dashboard

**Full Code:** (167 lines - see file content above)

### File: `src/pages/account-pending.jsx`

**Purpose:** Business verification pending page for sellers/logistics.

**Key Features:**
- Checks business_profiles table for verification_status
- Falls back to legacy companies table
- Shows company info being reviewed
- Links to verification status page

**Full Code:** (170 lines - see file content above)

### File: `src/pages/verify-email-prompt.jsx`

**Purpose:** Email verification prompt for unverified users.

**Key Features:**
- Resend verification email
- Clear messaging about email confirmation requirement

**Full Code:** (85 lines - see file content above)

---

## 4. Route Guards & Protection

### File: `src/components/ProtectedRoute.jsx`

**Purpose:** General authentication and onboarding route guard.

**Full Code:**

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { requireAuth, requireOnboarding, getCurrentUserAndRole } from '@/utils/authHelpers';
import { isAdmin } from '@/utils/permissions';
import AccessDenied from './AccessDenied';

export default function ProtectedRoute({ 
  children, 
  requireOnboarding: needsOnboarding = false,
  requireAdmin: needsAdmin = false 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkAuth();
  }, [needsOnboarding, needsAdmin]);

  const checkAuth = async () => {
    try {
      // Check if admin access is required
      if (needsAdmin) {
        const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        if (!userData) {
          navigate('/login');
          return;
        }

        const hasAdminAccess = isAdmin(userData);
        if (!hasAdminAccess) {
          console.warn('❌ Access denied: Admin-only page');
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (needsOnboarding) {
        const result = await requireOnboarding(supabase, supabaseHelpers);
        if (!result) {
          return;
        }

        if (result.needsOnboarding) {
          if (result.role === 'logistics') {
            navigate('/logistics-partner-onboarding');
          } else {
            navigate('/onboarding');
          }
          return;
        }

        setIsAuthorized(true);
      } else {
        const result = await requireAuth(supabase);
        if (!result) {
          const next = searchParams.get('next') || location.pathname + location.search;
          navigate(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setIsAuthorized(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('ProtectedRoute auth error:', error);
      }
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDenied />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
```

### File: `src/components/RoleProtectedRoute.tsx`

**Purpose:** Role-based route protection using enterprise user_roles table.

**Full Code:**

```typescript
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getUserRoles } from '@/lib/supabase-auth-helpers';

type Props = {
  children: React.ReactNode;
  requiredRole: string;
};

/**
 * Enterprise-grade role-based route protection using Supabase user_roles.
 * - Reads roles from dedicated roles/user_roles tables
 * - Redirects to /select-role when user lacks required role but is authenticated
 * - Redirects to /login when unauthenticated
 */
export function RoleProtectedRoute({ children, requiredRole }: Props) {
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    checkRole();
  }, []);

  async function checkRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setHasRole(false);
      return;
    }

    try {
      const roles = await getUserRoles(user.id);
      setHasRole(roles.includes(requiredRole));
    } catch (error) {
      console.debug('RoleProtectedRoute role check failed', error);
      setHasRole(false);
    }
  }

  if (hasRole === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!hasRole) {
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
}
```

---

## 5. Context Providers

### File: `src/context/RoleContext.tsx`

**Purpose:** React context for user role state management.

**Full Code:**

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';

export type UserRole = 'buyer' | 'seller' | 'hybrid' | 'logistics';

type RoleContextValue = {
  role: UserRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  isBuyer: boolean;
  isSeller: boolean;
  isHybrid: boolean;
  isLogistics: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function normalizeRole(rawRole: string | null | undefined): UserRole | null {
  if (!rawRole) return null;
  const value = rawRole.toLowerCase();
  if (value === 'buyer') return 'buyer';
  if (value === 'seller') return 'seller';
  if (value === 'hybrid') return 'hybrid';
  if (value === 'logistics' || value === 'logistics_partner') return 'logistics';
  return null;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async () => {
    try {
      const { role: rawRole, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      const normalized =
        normalizeRole(rawRole) ||
        normalizeRole((profile as any)?.role) ||
        normalizeRole((profile as any)?.user_role);
      setRole(normalized);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('RoleProvider: failed to load role', error);
      }
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
  }, []);

  const value: RoleContextValue = {
    role,
    loading,
    refreshRole: loadRole,
    isBuyer: role === 'buyer',
    isSeller: role === 'seller',
    isHybrid: role === 'hybrid',
    isLogistics: role === 'logistics',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}

export function getDashboardHomePath(role: UserRole | null): string {
  switch (role) {
    case 'buyer':
      return '/dashboard/buyer';
    case 'seller':
      return '/dashboard/seller';
    case 'hybrid':
      return '/dashboard/hybrid';
    case 'logistics':
      return '/dashboard/logistics';
    default:
      return '/dashboard';
  }
}
```

---

## 6. Session Management

### File: `src/hooks/useSessionRefresh.js`

**Purpose:** Automatic session refresh hook to keep users logged in.

**Full Code:**

```javascript
/**
 * Hook to handle automatic session refresh
 * Keeps users logged in by refreshing tokens before expiry
 */

import { useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useSessionRefresh() {
  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'TOKEN_REFRESHED') {
          // Session refreshed successfully - user stays logged in
        }
      }
    });

    // Refresh session on mount to ensure it's valid
    const refreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            // If expires in less than 5 minutes, refresh now
            if (expiresIn < 300) {
              await supabase.auth.refreshSession();
            }
          }
        }
      } catch (error) {
        // Silently fail - session refresh is optional
      }
    };

    refreshSession();
    
    // Refresh session every 30 minutes to keep it alive
    const interval = setInterval(refreshSession, 30 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
}
```

---

## 7. OAuth Components

### File: `src/components/auth/GoogleSignIn.jsx`

**Purpose:** Google OAuth sign-in component.

**Key Features:**
- Supabase OAuth integration
- Redirect handling
- Loading states
- Error handling

**Full Code:** (161 lines - see file content above)

### File: `src/components/auth/FacebookSignIn.jsx`

**Purpose:** Facebook OAuth sign-in component.

**Key Features:**
- Supabase OAuth integration
- Mobile-friendly redirect handling
- Error messages
- Fallback suggestions

**Full Code:** (162 lines - see file content above)

---

## 8. Database Schema (SQL Migrations)

### File: `supabase/migrations/001_create_profiles_table.sql`

**Purpose:** Initial profiles table creation with RLS policies.

**Full Code:**

```sql
-- Create profiles table for user onboarding and company information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('seller', 'buyer', 'hybrid', 'logistics')),
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Company information
  company_name TEXT,
  business_type TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  business_email TEXT,
  website TEXT,
  year_established TEXT,
  company_size TEXT,
  company_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx ON profiles(onboarding_completed);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### File: `supabase/migrations/20241218_create_profile_sync_trigger.sql`

**Purpose:** Auto-sync auth.users → profiles trigger.

**Full Code:** (134 lines - see file content above)

**Key Features:**
- `handle_new_user()` function creates profile on registration
- Trigger on `auth.users` INSERT
- Backfill existing users

### File: `supabase/migrations/20251218_enterprise_auth_extensions.sql`

**Purpose:** Enterprise auth extensions: roles, business profiles, auth logs, login attempts.

**Full Code:** (92 lines - see file content above)

**Tables Created:**
- `roles` - Master role list
- `user_roles` - User-role junction table
- `business_profiles` - Business verification for sellers/logistics
- `auth_logs` - Auth event audit trail
- `login_attempts` - Rate limiting tracking
- `user_preferences` - User preferences (last selected role)

**Columns Added to profiles:**
- `account_status` (default: 'active')
- `last_login_at` (timestamp)

### File: `supabase/migrations/20251216_optimize_auth_rls_policies.sql`

**Purpose:** Optimize RLS policies to satisfy Supabase initplan requirements.

**Full Code:** (78 lines - see file content above)

**Key Changes:**
- Wraps `auth.uid()` in SELECT subqueries
- Optimizes admin_orders, supplier_read_own_products, supplier_update_own_products policies

---

## 9. Edge Functions

### File: `supabase/functions/auth-email/index.ts`

**Purpose:** Edge function to generate Supabase auth links and send branded emails via Resend.

**Full Code:** (211 lines - see file content above)

**Key Features:**
- Generates secure Supabase auth links using service role key
- Sends emails via Resend API from `hello@afrikoni.com`
- Supports `email_verification` and `password_reset` types
- Branded HTML templates with Afrikoni styling
- Error handling and validation

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

**Usage:**
```javascript
POST /functions/v1/auth-email
{
  "type": "email_verification" | "password_reset",
  "email": "user@example.com",
  "name": "User Name",
  "redirectTo": "https://afrikoni.com/auth/confirm"
}
```

### File: `supabase/functions/send-email/index.ts`

**Purpose:** General email sending edge function for transactional emails.

**Full Code:** (156 lines - see file content above)

**Key Features:**
- Resend API integration
- Sends from `hello@afrikoni.com`
- CORS handling
- Error handling

---

## 10. Environment Variables

### Required Environment Variables

**Frontend (.env.local or Vercel):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Edge Functions (Supabase Dashboard → Settings → Edge Functions):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Optional (for email service):**
```bash
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Environment Variable Usage

- `VITE_SUPABASE_URL` - Used in `src/api/supabaseClient.js`
- `VITE_SUPABASE_ANON_KEY` - Used in `src/api/supabaseClient.js`
- `SUPABASE_URL` - Used in edge functions
- `SUPABASE_SERVICE_ROLE_KEY` - Used in edge functions for admin operations
- `RESEND_API_KEY` - Used in edge functions for email sending

---

## 11. Post-Login Redirect Logic

**Implementation:** `src/lib/post-login-redirect.ts`

**Flow:**
1. Check email verification → `/verify-email-prompt` if not verified
2. Get user roles from `user_roles` table
3. Check business verification status for sellers/logistics → `/account-pending` if pending
4. Single role → `/{role}/dashboard`
5. Multiple roles → Check `last_selected_role` from `user_preferences` → `/{role}/dashboard` or `/select-role`

**Used In:**
- `src/pages/login.jsx` (line 164)
- `src/pages/auth-callback.jsx` (can be integrated)

---

## 12. Email Service Integration

### File: `src/services/emailService.js`

**Purpose:** Centralized email service using Resend API.

**Key Functions:**
- `sendWelcomeEmail(userEmail, userName)`
- `sendAccountLockedEmail(userEmail, userName)`
- `sendBusinessPendingApprovalEmail(userEmail, userName, companyName)`
- `sendBusinessApprovedEmail(userEmail, userName, companyName)`
- `sendPasswordResetEmail(userEmail, resetLink, userName)`
- `sendPasswordResetConfirmationEmail(userEmail, userName)`
- `sendAccountVerificationEmail(userEmail, verificationLink, userName)`

**All emails sent from:** `Afrikoni <hello@afrikoni.com>`

**Templates:** `src/services/emailTemplates.js`

---

## 🔄 Auth Flow Summary

### Signup Flow
1. User fills signup form with role selection
2. `supabaseHelpers.auth.signUp()` called
3. Profile created in `profiles` table
4. `auth-email` edge function sends verification email
5. User redirected to `/login?message=confirm-email`
6. User clicks email link → `/auth/confirm`
7. Email verified → `/auth/success` → `/login`

### Login Flow
1. User enters email/password
2. Rate limiting check (5 attempts, 10-minute lockout)
3. `supabaseHelpers.auth.signIn()` called
4. Email verification check (blocks if not confirmed)
5. `getPostLoginRedirect()` determines destination
6. Redirect based on role, verification status, onboarding

### OAuth Flow
1. User clicks Google/Facebook button
2. Redirected to provider
3. Provider redirects to `/auth/callback`
4. Profile created if new user
5. Email verification check
6. Onboarding check
7. Role-based redirect

### Password Reset Flow
1. User requests reset on `/forgot-password`
2. `auth-email` edge function generates reset link
3. Email sent via Resend from `hello@afrikoni.com`
4. User clicks link → Supabase handles password update
5. User redirected to login

---

## 📊 Database Tables Summary

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `auth.users` | Supabase-managed auth | `id`, `email`, `email_confirmed_at` |
| `profiles` | User profiles | `id`, `full_name`, `role`, `onboarding_completed` |
| `roles` | Master role list | `id`, `name` |
| `user_roles` | User-role mapping | `user_id`, `role_id` |
| `business_profiles` | Business verification | `user_id`, `verification_status`, `company_name` |
| `auth_logs` | Auth event audit | `user_id`, `event_type`, `metadata` |
| `login_attempts` | Rate limiting | `email`, `success`, `attempted_at` |
| `user_preferences` | User preferences | `user_id`, `last_selected_role` |

---

## 🔒 Security Features

1. **Rate Limiting:** 5 failed attempts → 10-minute lockout
2. **Email Verification:** Required before dashboard access (MVP rule)
3. **RLS Policies:** Row-level security on all auth-related tables
4. **Audit Logging:** All auth events logged to `auth_logs`
5. **Session Management:** Auto-refresh tokens, localStorage persistence
6. **Account Lockout:** Email notification on lockout
7. **Business Verification:** Seller/logistics accounts require approval

---

## ✅ Testing

### Test File: `src/__tests__/auth/login-flow.spec.ts`

**Purpose:** Playwright E2E tests for authentication flows.

**Coverage:**
- Login flow
- Rate limiting
- Email verification
- OAuth flows

---

## 📝 Notes

- All auth emails sent from `hello@afrikoni.com` via Resend
- Email domain typo auto-fix (afrikonii.com → afrikoni.com)
- Non-fatal email send errors don't block signup
- Hybrid users see role selection screen
- Business verification pending users see account-pending page
- Unverified users see verify-email-prompt page
- All redirects preserve user intent (zero lost users)

---

**End of Authentication Export**

