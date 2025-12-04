import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Lock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';


export default function Signup() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error(t('signup.fillRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('signup.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('signup.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabaseHelpers.auth.signUp(
        formData.email,
        formData.password,
        { 
          name: formData.fullName
        }
      );

      if (error) throw error;

      // Wait for session to be established
      if (data?.session) {
        // Create profile in profiles table using UPSERT
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            role: 'buyer', // Default role - will be set in onboarding
            onboarding_completed: false // Must complete onboarding
          }, { onConflict: 'id' });

        if (profileError) {
          // Error logged (removed for production)
          // Don't fail signup if profile creation fails - user can still proceed
        }

        toast.success(t('signup.success'));
        // Always redirect to onboarding step 1 (role selection)
        navigate('/onboarding?step=1');
      } else {
        // Email confirmation required
        toast.success(t('signup.checkEmail'));
        navigate('/login?message=check-email');
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error(error.message || t('signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the redirect path after OAuth signup
  const getOAuthRedirectPath = () => {
    // If user came from a specific page, redirect there
    if (redirectUrl && redirectUrl !== createPageUrl('Home')) {
      return redirectUrl;
    }
    // For new signups, go to onboarding first
    return '/onboarding';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite shadow-2xl rounded-xl">
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">{t('signup.joinAfrikoni')}</h1>
              <p className="text-afrikoni-deep">{t('signup.subtitle')}</p>
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

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="mb-2 block font-semibold">{t('signup.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={t('signup.fullNamePlaceholder')}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block font-semibold">{t('signup.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('signup.emailPlaceholder')}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block font-semibold">{t('signup.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('signup.passwordPlaceholder')}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block font-semibold">{t('signup.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  className="pl-10"
                  required
                />
              </div>
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
                  {t('signup.creatingAccount')}
                </>
              ) : (
                t('signup.createAccount')
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
                <span className="bg-afrikoni-offwhite px-2 text-afrikoni-deep/70">{t('signup.continueWith')}</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <GoogleSignIn 
                redirectTo={getOAuthRedirectPath()}
                onSuccess={() => {
                  toast.success(t('signup.success') || 'Account created successfully!');
                }}
                onError={(error) => {
                  setIsLoading(false);
                }}
              />
              <FacebookSignIn 
                redirectTo={getOAuthRedirectPath()}
                onSuccess={() => {
                  toast.success(t('signup.success') || 'Account created successfully!');
                }}
                onError={(error) => {
                  setIsLoading(false);
                }}
              />
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-afrikoni-deep">
              {t('signup.alreadyHaveAccount')}{' '}
              <a
                href={
                  redirectUrl
                    ? `${createPageUrl('Login')}?redirect=${encodeURIComponent(redirectUrl)}`
                    : createPageUrl('Login')
                }
                className="text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold"
              >
                {t('signup.signIn')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
