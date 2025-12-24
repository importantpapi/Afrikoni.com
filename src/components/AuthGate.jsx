/**
 * AuthGate - Simple Authentication Check
 * 
 * Only checks if user is authenticated.
 * Delegates all routing logic to PostLoginRouter.
 * 
 * ❌ NO role logic
 * ❌ NO onboarding logic
 * ❌ NO redirects except to /login
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import PostLoginRouter from '@/auth/PostLoginRouter';

export default function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data?.session?.user) {
        setAuthenticated(false);
        setChecking(false);
      } else {
        setAuthenticated(true);
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!authenticated) {
    return <>{children}</>;
  }

  // If authenticated, let PostLoginRouter handle routing
  return <PostLoginRouter />;
}

