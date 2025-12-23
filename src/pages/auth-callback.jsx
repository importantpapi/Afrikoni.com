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
        // Wait for Supabase to process the session
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('No session found. Please try signing in again.');
        }

        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not found');

        // Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.user_metadata?.display_name ||
                          user.email?.split('@')[0] || 
                          'User';

          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: fullName,
              email: user.email,
              onboarding_completed: false,
              // No role - selected during onboarding
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            }, { onConflict: 'id' });
        }

        // Check email verification (OAuth providers usually verify emails automatically)
        // But we check to be safe
        if (!user.email_confirmed_at) {
          toast.success(t('login.success') || 'Logged in successfully!');
          navigate('/verify-email', { replace: true });
          return;
        }

        // Fetch user profile to check onboarding status
        const { user: userData, profile, onboardingCompleted, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        toast.success(t('login.success') || 'Logged in successfully!');
        
        // Check onboarding completion
        if (!onboardingCompleted || !companyId) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err.message || 'Authentication failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
