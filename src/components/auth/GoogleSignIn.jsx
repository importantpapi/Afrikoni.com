import React, { useState } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * GoogleSignIn Component
 * 
 * A reusable component for Google OAuth sign-in using Supabase.
 * Handles authentication flow and redirects to dashboard on success.
 * 
 * @param {Object} props - Component props
 * @param {string} props.redirectTo - URL to redirect after successful sign-in (default: '/dashboard')
 * @param {string} props.variant - Button variant ('primary' | 'outline') (default: 'outline')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onSuccess - Callback function called on successful sign-in
 * @param {Function} props.onError - Callback function called on error
 */
export default function GoogleSignIn({ 
  redirectTo = '/dashboard',
  variant = 'outline',
  className = '',
  onSuccess,
  onError
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles Google OAuth sign-in flow
   * 
   * This function:
   * 1. Initiates OAuth flow with Google provider
   * 2. Redirects user to Google authentication page
   * 3. After user approves, Supabase handles the callback
   * 4. User is redirected back to the specified redirectTo URL
   */
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Get the full redirect URL
      const fullRedirectUrl = redirectTo.startsWith('http') 
        ? redirectTo 
        : `${window.location.origin}${redirectTo}`;

      // Initiate OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(fullRedirectUrl)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      // If we get a URL, the OAuth flow will redirect automatically
      // The callback handler will complete the authentication
      if (data?.url) {
        // Optional: Call success callback before redirect
        if (onSuccess) {
          onSuccess(data);
        }
        // The redirect happens automatically via Supabase
        // No need to manually redirect here
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to sign in with Google. Please try again.';
      toast.error(errorMessage);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      setIsLoading(false);
    }
    // Note: We don't set isLoading to false on success because
    // the page will redirect, so the component will unmount
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={signInWithGoogle}
      disabled={isLoading}
      className={`w-full h-12 min-h-[44px] flex items-center justify-center gap-2 border-afrikoni-gold/30 hover:bg-afrikoni-cream touch-manipulation ${className}`}
      aria-label={t('login.signInWithGoogle') || 'Sign in with Google'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="hidden sm:inline">
            {t('login.signingIn') || 'Signing in...'}
          </span>
          <span className="sm:hidden">Loading...</span>
        </>
      ) : (
        <>
          <FcGoogle className="w-5 h-5" />
          <span className="hidden sm:inline">
            {t('login.signInWithGoogle') || 'Sign in with Google'}
          </span>
          <span className="sm:hidden">Google</span>
        </>
      )}
    </Button>
  );
}

/**
 * Standalone Google Sign-In Function
 * 
 * If you need to call Google sign-in programmatically (not via button),
 * you can use this function directly.
 * 
 * @param {string} redirectTo - URL to redirect after successful sign-in
 * @returns {Promise<void>}
 */
export async function signInWithGoogle(redirectTo = '/dashboard') {
  try {
    const fullRedirectUrl = redirectTo.startsWith('http') 
      ? redirectTo 
      : `${window.location.origin}${redirectTo}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(fullRedirectUrl)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

