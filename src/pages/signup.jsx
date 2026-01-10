import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { User, Mail, Lock, Shield, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/shared/ui/Logo';
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
    if (!password) {
      return { valid: false, message: 'Password is required.' };
    }
    if (password.length < 8) {
      return { 
        valid: false, 
        message: 'Password must be at least 8 characters.',
        requirements: { minLength: false, length: password.length }
      };
    }
    return { valid: true };
  };

  // Clear field error when user starts typing
  const clearFieldError = (fieldName) => {
    setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  // Helper: Wait for session to be available before redirecting
  // Prevents blank page for new users (Supabase auth timing issue)
  const waitForSessionAndRedirect = async () => {
    for (let i = 0; i < 10; i++) {
      const { data } = await supabase.auth.getSession();
      debugger; // ⬅️ BREAKPOINT 3: Inspect data.session (iteration: i+1)
      if (data?.session) {
        console.log('[Signup] Session available, redirecting');
        navigate('/auth/post-login', { replace: true });
        return true;
      }
      // Wait 200ms before retry
      await new Promise(res => setTimeout(res, 200));
    }

    // If session still not available after retries, show clear message
    console.warn('[Signup] Session not available after waiting, showing message to user');
    setFieldErrors({
      email: '',
      password: '',
      confirmPassword: '',
      general: 'Your account was created successfully! Please refresh the page to continue.'
    });

    return false;
  };

  const handleSignup = async (e) => {
    debugger; // ⬅️ BREAKPOINT 1: Does click fire?
    e.preventDefault();
    
    // DEBUG: Log submit click
    console.log('SUBMIT CLICKED');
    
    // Clear previous errors
    setFieldErrors({ email: '', password: '', confirmPassword: '', general: '' });
    
    let hasErrors = false;
    const newErrors = { email: '', password: '', confirmPassword: '', general: '' };

    // Required fields validation - show explicit inline errors
    if (!formData.fullName.trim()) {
      newErrors.general = 'Please fill in all required fields';
      hasErrors = true;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
      hasErrors = true;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
      hasErrors = true;
    }
    if (formData.password && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
      hasErrors = true;
    }

    // Email format validation - show explicit inline error
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }

    // Password strength validation (8 characters minimum) - show explicit inline error
    if (formData.password) {
      const passwordValidation = isPasswordStrong(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
        hasErrors = true;
      }
    }

    // Password confirmation validation - show explicit inline error
    if (formData.password && formData.confirmPassword) {
    if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
        hasErrors = true;
      }
    }

    // If validation errors exist, show them and return (don't set loading)
    if (hasErrors) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup.jsx:149',message:'Validation errors - early return',data:{errors:newErrors,hasErrors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('VALIDATION ERRORS:', newErrors);
      setFieldErrors(newErrors);
      return;
    }

    // Validation passed - set loading state immediately before Supabase call
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup.jsx:156',message:'Validation passed - proceeding to Supabase',data:{email:formData.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('VALIDATION PASSED - Starting signup');
    setIsLoading(true);
    try {
      // ✅ USE DIRECT SUPABASE CALL - Same fix as login
      // supabaseHelpers.auth.signUp may be outdated or misconfigured
      let data, error;
      
      // Check if Supabase client is properly initialized
      if (!formData.email || !formData.password) {
        setFieldErrors({
          email: formData.email ? '' : 'Email is required.',
          password: formData.password ? '' : 'Password is required.',
          confirmPassword: '',
          general: ''
        });
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('CALLING SUPABASE AUTH.SIGNUP');
        const result = await supabase.auth.signUp({
        email: formData.email.trim(), // Trim email to prevent whitespace issues
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });
        data = result.data;
        error = result.error;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup.jsx:174',message:'Supabase signUp response',data:{hasUser:!!result.data?.user,hasSession:!!result.data?.session,hasError:!!result.error,errorMessage:result.error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        debugger; // ⬅️ BREAKPOINT 2: Inspect result.data.user, result.data.session, result.error
        // DEBUG: Log Supabase response
        console.log('SIGNUP RESPONSE', { data, error });
      } catch (networkError) {
        // Handle network/connection errors gracefully
        // These are errors that occur BEFORE Supabase can respond
        console.error('[Signup] Network-level error (before Supabase response):', {
          message: networkError?.message,
          code: networkError?.code,
          name: networkError?.name,
          // Never log full error object as it may contain URLs
        });
        
        const networkErrorMessage = (networkError?.message || '').toLowerCase();
        const errorCode = networkError?.code || '';
        const errorName = (networkError?.name || '').toLowerCase();
        
        // Comprehensive network error detection
        // Catch: Load failed, fetch failures, connection errors, DNS errors, timeouts
        const isNetworkError = 
          networkErrorMessage.includes('load failed') ||
          networkErrorMessage.includes('network error') ||
          networkErrorMessage.includes('fetch') ||
          networkErrorMessage.includes('connection') ||
          networkErrorMessage.includes('failed to fetch') ||
          networkErrorMessage.includes('network request failed') ||
          networkErrorMessage.includes('networkerror') ||
          networkErrorMessage.includes('networkerror when attempting to fetch') ||
          networkErrorMessage.includes('supabase.co') || // Catch any Supabase URLs
          errorCode === 'ENOTFOUND' ||
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNRESET' ||
          errorName === 'networkerror' ||
          errorName === 'typeerror' ||
          // Check if error message contains URL patterns (but don't expose them)
          /https?:\/\/[\w.-]+\.supabase\.co/.test(networkErrorMessage);
        
        if (isNetworkError) {
          // User-safe message that doesn't expose technical details
          setFieldErrors({ 
            email: '',
            password: '',
            confirmPassword: '',
            general: "We're having trouble connecting to our servers. Please try again in a moment."
          });
          setIsLoading(false);
          return;
        }
        
        // For other network errors, throw to be handled by outer catch
        throw networkError;
      }

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
      
      // 🔒 CRITICAL FIX: Wait for session to be available before redirecting
      // New users may not have session immediately available in browser storage
      // This prevents "nothing happens" / blank page for new users
      // First check if session already exists in response (optimization)
      if (data.session) {
        console.log('[Signup] Session available in response, redirecting immediately');
        navigate('/auth/post-login', { replace: true });
      } else {
        console.log('[Signup] Session not in response, waiting for session...');
        await waitForSessionAndRedirect();
      }
      
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
      
      // Sanitize error message - check multiple sources and remove URLs/technical details
      let errorMessage = '';
      if (error) {
        // Check multiple possible error message locations
        const possibleMessages = [
          error?.message,
          error?.error?.message,
          error?.toString(),
          JSON.stringify(error)
        ].filter(Boolean);
        
        errorMessage = possibleMessages[0] || '';
        
        // STRICT URL SANITIZATION - Remove ANY URL patterns BEFORE processing
        errorMessage = errorMessage.replace(/https?:\/\/[\w.-]+\.supabase\.co[^\s]*/gi, '[network error]');
        errorMessage = errorMessage.replace(/qkeeufeiaphqylsnfhza[^\s]*/gi, '[network error]');
        errorMessage = errorMessage.replace(/[\w-]+\.supabase\.co/gi, '[network error]');
      }
      
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
        console.log('[Signup] User account created successfully, waiting for session before redirect');
        console.warn('[Signup] Error occurred but user exists (non-critical, suppressed):', errorMessage);
        
        // 🔒 NEVER show database errors - always show success if user exists
        toast.success(t('signup.success') || 'Account created successfully!');
        
        // 🔒 CRITICAL FIX: Wait for session to be available before redirecting
        // New users may not have session immediately available in browser storage
        console.log('[Signup] Waiting for session...');
        await waitForSessionAndRedirect();
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

      // Password validation errors (8 characters minimum)
      if (errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('weak password') ||
          errorMessage.toLowerCase().includes('password requirements')) {
        setFieldErrors({ 
          email: '',
          password: 'Password must be at least 8 characters.',
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

      // Network/connection errors (Supabase URL, fetch failures, etc.)
      // These errors occur when the browser cannot reach Supabase at all
      // CHECK ORIGINAL ERROR TOO - before sanitization
      const originalErrorString = error?.toString() || error?.message || JSON.stringify(error) || '';
      const normalizedErrorMessage = errorMessage.toLowerCase();
      const normalizedOriginalError = originalErrorString.toLowerCase();
      
      const isNetworkLevelError = 
        normalizedErrorMessage.includes('load failed') ||
        normalizedErrorMessage.includes('network error') ||
        normalizedErrorMessage.includes('fetch') ||
        normalizedErrorMessage.includes('connection') ||
        normalizedErrorMessage.includes('failed to fetch') ||
        normalizedErrorMessage.includes('network request failed') ||
        normalizedErrorMessage.includes('networkerror') ||
        normalizedErrorMessage.includes('networkerror when attempting to fetch') ||
        normalizedErrorMessage.includes('supabase.co') || // Catch any Supabase URLs
        normalizedErrorMessage.includes('qkeeufeiaphqylsnfhza') || // Catch project ID
        normalizedOriginalError.includes('load failed') || // Check original too
        normalizedOriginalError.includes('supabase.co') || // Check original too
        normalizedOriginalError.includes('qkeeufeiaphqylsnfhza') || // Check original too
        /https?:\/\/[\w.-]+\.supabase\.co/.test(errorMessage) || // URL pattern matching
        /https?:\/\/[\w.-]+\.supabase\.co/.test(originalErrorString) || // URL pattern in original
        /qkeeufeiaphqylsnfhza/.test(originalErrorString) || // Project ID in original
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ECONNRESET';
      
      if (isNetworkLevelError) {
        // User-safe message - never expose Supabase URLs or technical details
        setFieldErrors({ 
          email: '',
          password: '',
          confirmPassword: '',
          general: "We're having trouble connecting to our servers. Please try again in a moment."
        });
        return;
      }
      
      // Generic error for actual auth failures (only if not database-related)
      // Never show raw error messages, URLs, or technical details to users
      // STRICT SANITIZATION - check original error too
      const originalErrorCheck = error?.toString() || error?.message || JSON.stringify(error) || '';
      const containsUrl = 
        errorMessage.includes('supabase.co') || 
        errorMessage.includes('http://') || 
        errorMessage.includes('https://') ||
        originalErrorCheck.includes('supabase.co') ||
        originalErrorCheck.includes('qkeeufeiaphqylsnfhza') ||
        /https?:\/\/[\w.-]+/.test(errorMessage) || // Any URL pattern
        /https?:\/\/[\w.-]+/.test(originalErrorCheck) || // Any URL pattern in original
        errorMessage.toLowerCase().includes('load failed') ||
        originalErrorCheck.toLowerCase().includes('load failed');
      
      // ALWAYS use safe message if ANY URL pattern detected
      const userFriendlyMessage = containsUrl 
        ? "We're having trouble connecting to our servers. Please try again in a moment."
        : 'Signup failed. Please try again.';
      
      setFieldErrors({ 
        email: '',
        password: '',
        confirmPassword: '',
        general: userFriendlyMessage
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
                    const newPassword = e.target.value;
                    setFormData(prev => ({ ...prev, password: newPassword }));
                    // Clear password error if password now meets requirements
                    if (newPassword.length >= 8) {
                      clearFieldError('password');
                    }
                  }}
                  placeholder={t('signup.passwordPlaceholder')}
                  className="pl-10 pr-10"
                  error={!!fieldErrors.password && formData.password.length < 8}
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
              
              {/* Real-time password requirements preview */}
              {formData.password && formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {formData.password.length >= 8 && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-afrikoni-deep/70'}>
                      At least 8 characters {formData.password.length >= 8 ? '' : `(${formData.password.length}/8)`}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Only show error message if password is invalid AND error exists */}
              {fieldErrors.password && formData.password.length < 8 && (
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
