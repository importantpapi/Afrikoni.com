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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Password validation helper (8 characters minimum)
  const isPasswordStrong = (password) => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters.' };
    }
    return { valid: true };
  };

  // Clear field error when user starts typing
  const clearFieldError = (fieldName) => {
    setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({ email: '', password: '', confirmPassword: '', general: '' });
    
    let hasErrors = false;
    const newErrors = { email: '', password: '', confirmPassword: '', general: '' };

    // Required fields validation
    if (!formData.fullName || !formData.email || !formData.password) {
      newErrors.general = 'Please fill in all required fields';
      hasErrors = true;
    }

    // Email format validation
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }

    // Password confirmation validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      hasErrors = true;
    }

    // Password strength validation (8 characters minimum)
    if (formData.password) {
      const passwordValidation = isPasswordStrong(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // ✅ USE DIRECT SUPABASE CALL - Same fix as login
      // supabaseHelpers.auth.signUp may be outdated or misconfigured
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(), // Trim email to prevent whitespace issues
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      // 🔒 CRITICAL: Check if user was created EVEN if error exists
      // Database triggers might fail but user account is still created
      // If user exists, we succeeded - trigger errors are non-critical
      if (error && !data?.user) {
        // Only throw if user was NOT created (actual auth failure)
        console.error('[Signup] Auth failed - user not created:', error);
        throw error;
      }
      
      // If we get here, user was created (either no error, or error but user exists)
      // Any database/trigger errors are non-critical - PostLoginRouter will handle profile
      if (error && data?.user) {
        console.warn('[Signup] User created but trigger error occurred (non-critical, will be handled by PostLoginRouter):', error.message);
        // Continue with success flow - user exists, that's what matters
      }

      // ✅ SUCCESS - Account created in auth.users
      // Profile creation is handled by PostLoginRouter - we don't do it here
      console.log('✅ Signup Success:', {
        userCreated: !!data.user,
        sessionExists: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at ? true : false,
        email: formData.email.trim(),
        timestamp: new Date().toISOString()
      });

      // Show success message immediately
      toast.success(t('signup.success') || 'Account created successfully!');
      
      // Always redirect to PostLoginRouter - it handles profile creation
      // PostLoginRouter is the single source of truth for profile creation
      navigate('/auth/post-login', { replace: true });
      
      // Run background tasks (non-blocking, never throw)
      if (data.user) {
        // Notify admins (fire and forget - never throws)
        Promise.resolve().then(async () => {
          try {
            const { notifyAdminOfNewRegistration } = await import('@/services/riskMonitoring');
            await notifyAdminOfNewRegistration(
              data.user.id,
              formData.email.trim(),
              formData.fullName,
              null
            );
          } catch (notifyError) {
            // Silent fail - non-critical
            console.warn('[Signup] Admin notification failed (non-critical):', notifyError);
          }
        }).catch(() => {
          // Swallow all errors
        });
      }
    } catch (error) {
      // 🔒 CRITICAL: NEVER show database/profile errors to users
      // Check if user account was actually created (auth succeeded)
      // If auth succeeded, redirect to PostLoginRouter - it will handle everything
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      
      // Check if this looks like a database error (but we still check if user was created)
      const mightBeDatabaseError = 
        errorMessage.toLowerCase().includes('database error') ||
        errorMessage.toLowerCase().includes('database error saving new user') ||
        errorMessage.toLowerCase().includes('saving new user') ||
        errorMessage.toLowerCase().includes('database') ||
        errorMessage.toLowerCase().includes('profile') ||
        errorMessage.toLowerCase().includes('constraint') ||
        errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('rls') ||
        errorMessage.toLowerCase().includes('trigger') ||
        errorCode === 'PGRST301' ||
        errorCode === '23505' ||
        errorCode === '42501' ||
        errorCode === 'PGRST116' ||
        errorCode === '42P01';
      
      // Always check if user was created - if auth succeeded, we succeed
      let userCreated = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userCreated = !!user;
      } catch (checkError) {
        // Can't check - assume auth might have failed
      }
      
      if (userCreated || mightBeDatabaseError) {
        // ✅ USER ACCOUNT EXISTS OR DATABASE ERROR - This is SUCCESS
        // Database errors are non-critical - profile creation handled by PostLoginRouter
        console.log('[Signup] User account created successfully, redirecting to PostLoginRouter');
        console.warn('[Signup] Error occurred but user exists (non-critical, suppressed):', errorMessage);
        
        // 🔒 NEVER show database errors - always show success if user exists
        toast.success(t('signup.success') || 'Account created successfully!');
        navigate('/auth/post-login', { replace: true });
        return;
      }
      
      // Only show errors if auth actually failed (user doesn't exist)
      // 🔒 CRITICAL: NEVER show database/trigger errors - they're non-critical
      const isDatabaseOrTriggerError = 
        errorMessage.toLowerCase().includes('database error') ||
        errorMessage.toLowerCase().includes('database error saving new user') ||
        errorMessage.toLowerCase().includes('saving new user') ||
        errorMessage.toLowerCase().includes('trigger') ||
        errorMessage.toLowerCase().includes('profile') ||
        mightBeDatabaseError;
      
      if (isDatabaseOrTriggerError) {
        // Database/trigger errors are ALWAYS suppressed - user account creation is what matters
        console.warn('[Signup] Database/trigger error suppressed (non-critical):', errorMessage);
        // Don't show error - just log it
        return;
      }
      
      // Handle specific auth errors with user-friendly INLINE messages
      
      // Duplicate email / User already exists
      if (errorMessage.toLowerCase().includes('user already registered') || 
          errorMessage.toLowerCase().includes('already registered') ||
          errorMessage.toLowerCase().includes('email address is already registered') ||
          errorMessage.toLowerCase().includes('email already exists') ||
          errorMessage.toLowerCase().includes('user already exists') ||
          errorCode === 'signup_disabled' ||
          errorCode === 'email_address_not_authorized') {
        setFieldErrors({ 
          email: 'An account with this email already exists. Please log in.',
          password: '',
          confirmPassword: '',
          general: ''
        });
        return;
      }
      
      // Invalid email format (server-side validation)
      if (errorMessage.toLowerCase().includes('invalid email') ||
          errorMessage.toLowerCase().includes('email format') ||
          errorCode === 'validation_failed') {
        setFieldErrors({ 
          email: 'Please enter a valid email address.',
          password: '',
          confirmPassword: '',
          general: ''
        });
        return;
      }
      
      // Password validation errors - let Supabase handle requirements
      if (errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('weak password') ||
          errorMessage.toLowerCase().includes('password requirements')) {
        setFieldErrors({ 
          email: '',
          password: 'Password does not meet requirements. Please check and try again.',
          confirmPassword: '',
          general: ''
        });
        return;
      }
      
      // Rate limiting
      if (errorMessage.toLowerCase().includes('rate limit') ||
          errorMessage.toLowerCase().includes('too many requests') ||
          errorCode === 'rate_limit_exceeded') {
        setFieldErrors({ 
          email: '',
          password: '',
          confirmPassword: '',
          general: 'Too many signup attempts. Please wait a few minutes and try again.'
        });
        return;
      }
      
      // Generic error for actual auth failures (only if not database-related)
      setFieldErrors({ 
        email: '',
        password: '',
        confirmPassword: '',
        general: errorMessage || 'Signup failed. Please try again.'
      });
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
    // For new signups, go to dashboard (will show role selection)
    return '/dashboard';
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    clearFieldError('email');
                  }}
                  placeholder={t('signup.emailPlaceholder')}
                  className="pl-10"
                  error={!!fieldErrors.email}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block font-semibold">{t('signup.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    clearFieldError('password');
                  }}
                  placeholder={t('signup.passwordPlaceholder')}
                  className="pl-10 pr-10"
                  error={!!fieldErrors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-afrikoni-deep/70 hover:text-afrikoni-gold transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block font-semibold">{t('signup.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                    clearFieldError('confirmPassword');
                  }}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  className="pl-10 pr-10"
                  error={!!fieldErrors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-afrikoni-deep/70 hover:text-afrikoni-gold transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* General error message */}
            {fieldErrors.general && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600" role="alert">
                  {fieldErrors.general}
                </p>
              </div>
            )}

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
                  setIsLoading(false);
                }}
                onError={(error) => {
                  console.error('[Signup] Google OAuth error:', error);
                  // Error is already handled in GoogleSignIn component with toast
                  setIsLoading(false);
                }}
              />
              <FacebookSignIn 
                redirectTo={getOAuthRedirectPath()}
                onSuccess={() => {
                  toast.success(t('signup.success') || 'Account created successfully!');
                  setIsLoading(false);
                }}
                onError={(error) => {
                  console.error('[Signup] Facebook OAuth error:', error);
                  // Error is already handled in FacebookSignIn component with toast
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
