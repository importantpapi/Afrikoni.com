import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Mail, Lock, Loader2, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/shared/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';
import { logLoginEvent } from '@/utils/auditLogger';
import { isNetworkError, handleNetworkError } from '@/utils/networkErrorHandler';
import { login as authServiceLogin } from '@/services/AuthService';
import { useCapability } from '@/context/CapabilityContext';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔐 AUTH STATE
  const { authReady, hasUser, profile, user } = useAuth();
  
  // ✅ EMERGENCY FIX: Destructure ready FIRST to prevent "ready is not defined" errors
  const { ready, capabilities, refreshCapabilities, kernelError } = useCapability();
  
  // ✅ KERNEL-CENTRIC: Safety check for undefined ready
  if (typeof ready === 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold mx-auto mb-4" />
          <p className="text-afrikoni-deep">Initializing workspace...</p>
        </div>
      </div>
    );
  }
  
  // ✅ KERNEL-CENTRIC: Auto-retry if Kernel hits timeout
  useEffect(() => {
    if (kernelError && !ready) {
      console.log('[Login] Kernel error detected - auto-retrying once');
      const retryTimer = setTimeout(() => {
        refreshCapabilities(true);
      }, 1000); // Wait 1s before retry
      return () => clearTimeout(retryTimer);
    }
  }, [kernelError, ready, refreshCapabilities]);

  // 🔐 FORM STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');
  const intent = searchParams.get('intent');

  // ✅ FULL-STACK SYNC: Identity-First logic - Admin domain detection
  const isAdminEmail = email && (
    email.toLowerCase().includes('@afrikoni.com') ||
    email.toLowerCase().includes('@admin.') ||
    localStorage.getItem('admin-flag') === 'true' ||
    sessionStorage.getItem('admin-flag') === 'true'
  );

  // 🚨 HARD GUARD: LOGGED-IN USERS MUST NEVER SEE /login
  // ✅ KERNEL-CENTRIC: The Redirect Law - navigate based on profile state
  useEffect(() => {
    // Only fire if all prerequisites are met
    if (authReady !== true || ready !== true || !hasUser) return;

    const hasProfile = !!profile;
    
    // ✅ KERNEL-CENTRIC: The Redirect Law
    if (!hasProfile) {
      // No profile -> onboarding
      console.log('[Login] ✅ Redirect Law: No profile - navigating to onboarding');
      navigate('/onboarding/company', { replace: true });
    } else {
      // Has profile -> dashboard
      console.log('[Login] ✅ Redirect Law: Has profile - navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, ready, hasUser, profile, navigate]);
  
  // ✅ KERNEL-CENTRIC: Self-Heal - If ready is true but capabilities are null after 5 seconds, refresh
  useEffect(() => {
    if (!ready) return;
    
    const selfHealTimer = setTimeout(() => {
      // Check if capabilities are null/empty after 5 seconds
      if (!capabilities || (!capabilities.can_buy && !capabilities.can_sell && !capabilities.can_logistics)) {
        console.log('[Login] Self-Heal: Capabilities null after 5s - calling refreshCapabilities()');
        refreshCapabilities();
      }
    }, 5000);
    
    return () => clearTimeout(selfHealTimer);
  }, [ready, capabilities, refreshCapabilities]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('login.fillFields'));
      return;
    }

    setIsLoading(true);

    try {
      // ✅ FULL-STACK SYNC: Use AuthService for atomic login with profile verification
      const { user: authUser, profile: authProfile } = await authServiceLogin(email.trim(), password);

      // ✅ LOGIN SYNCHRONIZATION: Immediately navigate to /auth/post-login the moment data.user is returned
      // Bypass any secondary local checks that are currently hanging
      setIsLoading(false);
      toast.success(t('login.success') || 'Welcome back!');
      
      // ✅ SURGICAL FIX: Navigate immediately after successful login, bypassing Kernel wait
      // PostLoginRouter will handle the final redirect based on capabilities.ready
      console.log('[Login] ✅ Login successful - navigating to /auth/post-login');
      navigate('/auth/post-login', { replace: true });
      
      // ✅ KERNEL COMPLIANCE: Use email from form instead of direct API call
      // Non-blocking audit log - full user object will be available after AuthProvider updates
      try {
        await logLoginEvent({
          user: { email: email.trim() },
          profile: authProfile || null,
          success: true
        });
      } catch (_) {}
      
      return; // Exit early - navigation handled above

    } catch (err) {
      // ✅ FULL-STACK SYNC: Enhanced error handling
      setIsLoading(false);
      
      // Log failed login attempt
      try {
        await logLoginEvent({
          user: { email },
          profile: null,
          success: false
        });
      } catch (_) {}

      // ✅ KERNEL COMPLIANCE: Use standardized network error detection
      if (isNetworkError(err)) {
        const userMessage = handleNetworkError(err);
        toast.error(userMessage);
      } else {
        toast.error(err.message || 'Login failed');
      }
    }
  };

  const getOAuthRedirectPath = () => {
    if (redirectUrl && redirectUrl !== createPageUrl('Home')) {
      return redirectUrl;
    }
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
        <Card className={`border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl ${isAdminEmail ? 'border-afrikoni-gold ring-2 ring-afrikoni-gold/30' : ''}`}>
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                {t('login.welcomeBack')}
              </h1>
              <p className="text-afrikoni-deep">
                {t('login.subtitle')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="mb-2 block font-semibold text-afrikoni-chestnut">
                  {t('login.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block font-semibold text-afrikoni-chestnut">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12">
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <GoogleSignIn redirectTo={getOAuthRedirectPath()} />
              <FacebookSignIn redirectTo={getOAuthRedirectPath()} />
            </div>

            <div className="mt-6 text-center text-sm">
              <p>
                {t('login.dontHaveAccount')}{' '}
                <Link
                  to={`${createPageUrl('Signup')}`}
                  className="text-afrikoni-gold font-semibold"
                >
                  {t('login.createAccount')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
