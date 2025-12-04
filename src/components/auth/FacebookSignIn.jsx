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

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      const errorMessage = error.message || 'Failed to sign in with Facebook. Please try again.';
      toast.error(errorMessage);
      
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

