import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, Loader2, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('login.fillFields') || 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check email verification first
        if (!data.user.email_confirmed_at) {
          toast.success(t('login.success') || 'Logged in successfully!');
          navigate('/verify-email', { replace: true });
          return;
        }

        // Fetch user profile to check onboarding status
        try {
          const { user, profile, onboardingCompleted, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
          
          toast.success(t('login.success') || 'Logged in successfully!');
          
          // Check onboarding completion
          if (!onboardingCompleted || !companyId) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (roleError) {
          console.error('Error fetching user role:', roleError);
          // Fallback - redirect to onboarding to ensure complete setup
          toast.success(t('login.success') || 'Logged in successfully!');
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    if (redirectUrl && redirectUrl !== createPageUrl('Home')) {
      return redirectUrl;
    }
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-8 sm:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-2xl rounded-xl">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">{t('login.welcomeBack')}</h1>
              <p className="text-afrikoni-deep">{t('login.subtitle')}</p>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mb-6 text-xs text-afrikoni-deep/70">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span>{t('login.sslSecured')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>{t('login.trusted')}</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-2 block font-semibold">{t('login.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block font-semibold">{t('login.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to={createPageUrl('ForgotPassword')}
                  className="text-sm text-afrikoni-gold hover:text-afrikoni-goldDark font-medium"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full h-12 min-h-[44px] text-sm sm:text-base touch-manipulation"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('login.signingIn')}
                  </>
                ) : (
                  t('login.signIn')
                )}
              </Button>
            </form>

            {/* OAuth Buttons */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-afrikoni-gold/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-afrikoni-offwhite px-2 text-afrikoni-deep/70">{t('login.continueWith')}</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <GoogleSignIn 
                  redirectTo={getOAuthRedirectPath()}
                  onSuccess={() => {
                    toast.success(t('login.success') || 'Logged in successfully!');
                  }}
                  onError={(error) => {
                    setIsLoading(false);
                  }}
                />
                <FacebookSignIn 
                  redirectTo={getOAuthRedirectPath()}
                  onSuccess={() => {
                    toast.success(t('login.success') || 'Logged in successfully!');
                  }}
                  onError={(error) => {
                    setIsLoading(false);
                  }}
                />
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-afrikoni-deep">
                {t('login.dontHaveAccount')}{' '}
                <a
                  href={
                    redirectUrl
                      ? `${createPageUrl('Signup')}?redirect=${encodeURIComponent(redirectUrl)}`
                      : createPageUrl('Signup')
                  }
                  className="text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold"
                >
                  {t('login.signUp')}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
