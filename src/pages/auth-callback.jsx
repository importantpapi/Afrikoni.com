import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';

export default function AuthCallback() {
  const { t } = useLanguage();
  const { authReady, user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmailVerification, setIsEmailVerification] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash which contains the OAuth/verification tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const tokenType = hashParams.get('type'); // 'signup', 'recovery', 'magiclink', etc.

        // ✅ EMAIL VERIFICATION: Detect if this is email verification callback
        if (tokenType === 'signup' || tokenType === 'email_change') {
          setIsEmailVerification(true);
          console.log('[AuthCallback] Email verification callback detected, type:', tokenType);
        }

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // ✅ KERNEL COMPLIANCE: OAuth tokens are processed by Supabase automatically
        // AuthProvider's onAuthStateChange listener will detect SIGNED_IN event
        // Wait for AuthProvider to process the OAuth session
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait
        
        while (attempts < maxAttempts) {
          // Wait for authReady and user to be available
          if (authReady && user) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!authReady) {
          throw new Error('Authentication timeout. Please try signing in again.');
        }
        
        if (!user) {
          throw new Error('No session found. Please try signing in again.');
        }

        // ✅ ALIBABA FLOW: Read intended_role from URL (passed from OAuth signup)
        const intendedRole = searchParams.get('intended_role');
        if (intendedRole && user) {
          console.log('[AuthCallback] OAuth signup with intended_role:', intendedRole);

          // Update the user's profile with the intended role
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: intendedRole })
              .eq('id', user.id);

            if (updateError) {
              console.warn('[AuthCallback] Failed to update profile role:', updateError);
            } else {
              console.log('[AuthCallback] Profile role updated to:', intendedRole);
            }
          } catch (roleError) {
            console.warn('[AuthCallback] Role update error (non-critical):', roleError);
          }
        }

        // ✅ KERNEL COMPLIANCE: Use user and profile from AuthProvider
        // Profile creation is handled by PostLoginRouter if needed
        // We don't need to create profile here - AuthProvider and PostLoginRouter handle it

        // Check if profile exists (from AuthProvider)
        if (!profile) {
          // Profile will be created by PostLoginRouter if needed
          // Just log for debugging
          console.log('[AuthCallback] Profile not yet available, PostLoginRouter will handle creation');
        }

        // ✅ EMAIL VERIFICATION: Show appropriate success message
        if (isEmailVerification) {
          toast.success('Email verified successfully! Welcome to Afrikoni.');
        } else {
          toast.success(t('login.success') || 'Logged in successfully!');
        }

        // Check email verification (using user from AuthProvider)
        const emailVerified = user?.email_confirmed_at !== null;
        if (!emailVerified) {
          // Warn but don't block - in production you might redirect to verification page
          console.warn('Email not verified');
        }

        // Always redirect to PostLoginRouter - single source of truth for routing
        // PostLoginRouter will handle profile creation, role checking, and redirects
        const redirectUrl = searchParams.get('redirect_to') || searchParams.get('redirect');

        if (redirectUrl && redirectUrl !== window.location.origin && !redirectUrl.includes('/dashboard') && !redirectUrl.includes('/auth/')) {
          navigate(redirectUrl);
        } else {
          navigate('/auth/post-login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast.error(err.message || 'Authentication failed');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    // ✅ KERNEL COMPLIANCE: Only run callback when authReady is true
    if (authReady) {
      handleAuthCallback();
    }
  }, [navigate, searchParams, t, authReady, user, profile, isEmailVerification]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo type="full" size="lg" link={true} showTagline={false} />
        </div>
        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-afrikoni-gold" />
            <p className="text-afrikoni-deep">
              {isEmailVerification ? 'Verifying your email...' : 'Completing sign in...'}
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Authentication Error</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <p className="text-afrikoni-deep text-sm">Redirecting to login...</p>
          </>
        ) : (
          <p className="text-afrikoni-deep">Redirecting...</p>
        )}
      </div>
    </div>
  );
}

