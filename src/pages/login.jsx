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

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔐 AUTH STATE
  const { authReady, hasUser, profile } = useAuth();

  // 🔐 FORM STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');
  const intent = searchParams.get('intent');

  // 🚨 HARD GUARD: LOGGED-IN USERS MUST NEVER SEE /login
  useEffect(() => {
    if (!authReady) return;

    if (hasUser) {
      // 🚨 CRITICAL: Dashboard requires company_id
      // If company_id is missing, redirect to company onboarding
      if (!profile || !profile.company_id) {
        navigate('/onboarding/company', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authReady, hasUser, profile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('login.fillFields'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        toast.error(error.message || 'Invalid credentials');
        setIsLoading(false);

        try {
          await logLoginEvent({
            user: { email },
            profile: null,
            success: false
          });
        } catch (_) {}

        return;
      }

      toast.success(t('login.success') || 'Welcome back!');
      navigate('/auth/post-login', { replace: true });

      // Non-blocking audit log
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle();

        await logLoginEvent({
          user,
          profile: profileData,
          success: true
        });
      } catch (_) {}

    } catch (err) {
      toast.error(err.message || 'Login failed');
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
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl">
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                {t('login.welcomeBack')}
              </h1>
              <p className="text-afrikoni-deep">{t('login.subtitle')}</p>
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
