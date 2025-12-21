import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';

export default function AuthCallback() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash which contains the OAuth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (errorParam) {
          const friendlyError = errorDescription || errorParam;
          if (friendlyError.includes('access_denied') || friendlyError.includes('user_cancelled')) {
            throw new Error('Sign-in was cancelled. Please try again.');
          }
          throw new Error(friendlyError);
        }

        // Wait a moment for Supabase to process the session (longer on mobile)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to get session from Supabase first
        let session = null;
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && existingSession) {
          session = existingSession;
        }

        // If no session and we have tokens in URL, wait a bit more for Supabase to process
        if (!session && accessToken) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession) {
            session = newSession;
          }
        }

        if (!session) {
          throw new Error('No session found. Please try signing in again.');
        }

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not found');

        // Check if profile exists, create if it doesn't
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create profile from OAuth data
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.user_metadata?.display_name ||
                          user.email?.split('@')[0] || 
                          'User';

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: fullName,
              email: user.email,
              role: 'buyer', // Default role
              onboarding_completed: false,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the auth flow if profile creation fails
          }

          // Send welcome email for new OAuth users
          try {
            const { sendWelcomeEmail } = await import('@/services/emailService');
            await sendWelcomeEmail(user.email, fullName);
          } catch (emailError) {
            console.log('Welcome email not sent:', emailError);
          }
        }

        toast.success(t('login.success') || 'Logged in successfully!');

        // Check email verification
        const emailVerified = user.email_confirmed_at !== null;
        if (!emailVerified) {
          // Warn but don't block - in production you might redirect to verification page
          console.warn('Email not verified');
        }

        // Check onboarding status and redirect
        const userRoleData = await getCurrentUserAndRole(supabase, supabaseHelpers);
        const { onboardingCompleted, role } = userRoleData;
        
        // Get redirect URL from query params or use default
        const redirectUrl = searchParams.get('redirect_to') || searchParams.get('redirect');

        if (!onboardingCompleted) {
          navigate('/onboarding?step=1', { replace: true });
        } else {
          const { getDashboardPathForRole } = await import('@/utils/roleHelpers');
          const dashboardPath = getDashboardPathForRole(role);
          
          // For hybrid users, use unified dashboard
          const finalPath = role === 'hybrid' ? '/dashboard/hybrid' : dashboardPath;
          if (redirectUrl && redirectUrl !== window.location.origin && !redirectUrl.includes('/dashboard')) {
            navigate(redirectUrl);
          } else {
            navigate(finalPath);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err.message || 'Authentication failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // On mobile, redirect faster
        const redirectDelay = window.innerWidth < 768 ? 2000 : 3000;
        setTimeout(() => {
          navigate('/login');
        }, redirectDelay);
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo type="full" size="lg" link={true} showTagline={false} />
        </div>
        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-afrikoni-gold" />
            <p className="text-afrikoni-deep text-base sm:text-lg">Completing sign in...</p>
            <p className="text-afrikoni-deep/70 text-sm mt-2">Please wait...</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-semibold text-base sm:text-lg mb-2">Authentication Error</p>
              <p className="text-sm sm:text-base mt-2 break-words">{error}</p>
            </div>
            <p className="text-afrikoni-deep text-sm sm:text-base">Redirecting to login...</p>
          </>
        ) : (
          <>
            <p className="text-afrikoni-deep text-base sm:text-lg">Redirecting...</p>
            <p className="text-afrikoni-deep/70 text-sm mt-2">Setting up your account...</p>
          </>
        )}
      </div>
    </div>
  );
}

