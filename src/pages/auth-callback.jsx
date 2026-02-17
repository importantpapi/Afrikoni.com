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
        // Use local variable for immediate checks (state updates are async)
        const isEmailVerify = tokenType === 'signup' || tokenType === 'email_change';
        if (isEmailVerify) {
          setIsEmailVerification(true); // For UI display
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
        // Use local variable isEmailVerify (state hasn't updated yet in same render)
        if (isEmailVerify) {
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
  // Note: isEmailVerification intentionally NOT in deps - it's set inside the effect
  }, [navigate, searchParams, t, authReady, user, profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-os-bg via-os-bg to-os-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[460px] text-center">
        <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] p-12 border border-black/[0.08]">
          <div className="flex justify-center mb-10">
            <Logo type="symbol" size="md" />
          </div>
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-os-accent" />
              <h2 className="text-[20px] font-semibold text-gray-900 mb-2">
                {isEmailVerification ? 'Verifying your email' : 'Signing you in'}
              </h2>
              <p className="text-[14px] text-gray-600">
                Please wait a moment...
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 text-red-600 font-bold text-2xl">!</div>
              </div>
              <h2 className="text-[20px] font-semibold text-gray-900 mb-2">
                Authentication error
              </h2>
              <p className="text-[14px] text-gray-600 mb-4">{error}</p>
              <p className="text-[13px] text-gray-500">Redirecting to login...</p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-os-accent" />
              <p className="text-[14px] text-gray-600">Redirecting...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

