import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Lock, Shield, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            // No role selection at signup - handled in onboarding
          },
        },
      });

      // Enhanced error logging for debugging
      if (error) {
        console.error('❌ Signup Error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          email: formData.email.trim(),
          timestamp: new Date().toISOString()
        });
        
        // Check if it's an email-related error
        const isEmailError = error.message?.toLowerCase().includes('email') || 
                            error.message?.toLowerCase().includes('confirmation') ||
                            error.message?.toLowerCase().includes('smtp');
        
        if (isEmailError) {
          console.error('📧 Email Configuration Issue Detected');
          console.error('This error indicates Supabase Auth email service is not configured.');
          console.error('Fix: Go to Supabase Dashboard → Authentication → Settings → Email Templates');
          console.error('Option 1: Disable "Enable email confirmations" (for MVP/testing)');
          console.error('Option 2: Configure SMTP in Supabase Dashboard → Project Settings → Auth → SMTP Settings');
        }
        
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      // Enhanced success logging
      console.log('✅ Signup Success:', {
        userCreated: !!data.user,
        sessionExists: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at ? true : false,
        email: formData.email.trim(),
        timestamp: new Date().toISOString()
      });

      // Create profile with onboarding_completed: false (user must complete onboarding)
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            onboarding_completed: false
            // No role - selected during onboarding
          }, { onConflict: 'id' });
        console.log('✅ Profile created successfully');
      } catch (profileError) {
        console.error('⚠️ Profile creation failed:', profileError);
        toast.error('Account created but profile setup failed. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Check if email is verified
      if (data.user?.email_confirmed_at) {
        // Email already verified → redirect to onboarding
        toast.success('Account created! Complete your profile setup.');
        navigate('/onboarding', { replace: true });
      } else {
        // Email not verified → redirect to verify email page
        toast.success('Account created! Please verify your email to continue.');
        navigate('/verify-email', { replace: true });
      }
    } catch (err) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    if (redirectUrl && redirectUrl !== createPageUrl('Home')) {
      return redirectUrl;
    }
    // OAuth users will be checked for email verification and onboarding
    return '/verify-email';
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
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block font-semibold">{t('signup.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="password"
                    type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('signup.passwordPlaceholder')}
                    className="pl-10 pr-10"
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-afrikoni-deep/70 hover:text-afrikoni-chestnut focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block font-semibold">{t('signup.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                    className="pl-10 pr-10"
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-afrikoni-deep/70 hover:text-afrikoni-chestnut focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    Creating account…
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
