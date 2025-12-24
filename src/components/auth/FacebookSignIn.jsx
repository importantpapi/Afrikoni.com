import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { FaFacebook } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * FacebookSignIn Component
 * 
 * A reusable component for Facebook OAuth sign-in using Supabase.
 * Handles authentication flow and redirects to dashboard on success.
 * 
 * @param {Object} props - Component props
 * @param {string} props.redirectTo - URL to redirect after successful sign-in (default: '/dashboard')
 * @param {string} props.variant - Button variant ('primary' | 'outline') (default: 'outline')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onSuccess - Callback function called on successful sign-in
 * @param {Function} props.onError - Callback function called on error
 */
export default function FacebookSignIn({ 
  redirectTo = '/dashboard',
  variant = 'outline',
  className = '',
  onSuccess,
  onError
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles Facebook OAuth sign-in flow
   */
  const handleFacebookSignIn = async () => {
    try {
      setIsLoading(true);

      // Ensure we have a valid redirect URL
      const baseUrl = window.location.origin;
      const fullRedirectUrl = redirectTo.startsWith('http') 
        ? redirectTo 
        : `${baseUrl}${redirectTo}`;

      // Build callback URL - ensure it works on mobile
      const callbackUrl = `${baseUrl}/auth/callback?redirect_to=${encodeURIComponent(fullRedirectUrl)}`;

      // Use skipBrowserRedirect for better mobile handling
      // This prevents domain issues and works better cross-platform
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: callbackUrl,
          scopes: 'email',
          skipBrowserRedirect: false, // Allow redirect for proper OAuth flow
        }
      });

      if (error) {
        throw error;
      }

      // Note: On mobile, the redirect happens automatically
      // The onSuccess callback may not fire if redirect happens immediately
      if (onSuccess && data) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in with Facebook. Please try again.';
      
      if (error.message) {
        if (error.message.includes('domain') || error.message.includes('URL') || error.message.includes('app')) {
          errorMessage = 'Facebook sign-in is temporarily unavailable. Please use email/password sign-in or contact support.';
        } else if (error.message.includes('popup')) {
          errorMessage = 'Please allow popups or try using email/password sign-in.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('cancelled') || error.message.includes('denied')) {
          errorMessage = 'Facebook sign-in was cancelled. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Show user-friendly error message
      toast.error(errorMessage, {
        duration: 5000,
        description: 'You can sign in with email/password instead.',
      });
      
      if (onError) {
        onError(error);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleFacebookSignIn}
      disabled={isLoading}
      className={`w-full h-12 min-h-[44px] flex items-center justify-center gap-2 border-afrikoni-gold/30 hover:bg-afrikoni-cream touch-manipulation ${className}`}
      aria-label={t('login.signInWithFacebook') || 'Sign in with Facebook'}
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
          <FaFacebook className="w-5 h-5 text-blue-600" />
          <span className="hidden sm:inline">
            {t('login.signInWithFacebook') || 'Sign in with Facebook'}
          </span>
          <span className="sm:hidden">Facebook</span>
        </>
      )}
    </Button>
  );
}

/**
 * Standalone Facebook Sign-In Function
 */
export async function signInWithFacebook(redirectTo = '/dashboard') {
  try {
    const fullRedirectUrl = redirectTo.startsWith('http') 
      ? redirectTo 
      : `${window.location.origin}${redirectTo}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(fullRedirectUrl)}`,
        scopes: 'email'
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    throw error;
  }
}

