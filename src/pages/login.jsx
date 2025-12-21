import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Lock, Loader2, Shield, CheckCircle, Send } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';
import { logLoginEvent } from '@/utils/auditLogger';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');
  const intent = searchParams.get('intent');

  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Please enter your email address first.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      toast.success('Confirmation email sent! Please check your inbox.');
      setShowResendConfirmation(false);
    } catch (err) {
      console.error('Resend error:', err);
      toast.error(err.message || 'Failed to resend confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.fillFields'));
      return;
    }

    setIsLoading(true);
    setShowResendConfirmation(false);
    
    try {
      const { data, error } = await supabaseHelpers.auth.signIn(email, password);
      
      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.includes('email') && error.message.includes('confirm')) {
          setShowResendConfirmation(true);
          throw new Error('Please confirm your email before signing in.');
        }
        throw error;
      }

      // Check email verification - MVP Rule: Block login if not confirmed
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const emailVerified = authUser?.email_confirmed_at !== null;

      if (!emailVerified) {
        // MVP Rule: Block login if email not confirmed
        setShowResendConfirmation(true);
        await supabase.auth.signOut(); // Sign out immediately
        throw new Error('Please confirm your email before signing in.');
      }

      toast.success(t('login.success'));

      // Log successful login to audit log
      const { user: userData, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      await logLoginEvent({
        user: userData,
        profile,
        success: true
      });
      
      // MVP Rule: Redirect to homepage (NOT dashboard) after login
      // Dashboard access is protected separately
      if (redirectUrl && redirectUrl !== createPageUrl('Home') && !redirectUrl.includes('/dashboard')) {
        navigate(redirectUrl);
      } else {
        navigate('/', { replace: true }); // Go to homepage
      }
    } catch (error) {
      // Log failed login attempt to audit log
      try {
        await logLoginEvent({
          user: { email },
          profile: null,
          success: false
        });
      } catch (auditError) {
        // Don't break login flow if audit logging fails
        console.warn('Failed to log login attempt:', auditError);
      }
      
      toast.error(error.message || t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the redirect path after OAuth login
  const getOAuthRedirectPath = () => {
    // If user came from a specific page, redirect there
    if (redirectUrl && redirectUrl !== createPageUrl('Home')) {
      return redirectUrl;
    }
    // Otherwise, default to dashboard (will be determined by role in callback)
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
        <Card className="border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo type="full" size="lg" link={true} showTagline={true} />
              </div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">{t('login.welcomeBack')}</h1>
              <p className="text-afrikoni-deep">{t('login.subtitle')}</p>
            </div>

            {intent && (
              <div className="mb-6 p-3 rounded-lg bg-afrikoni-cream border border-afrikoni-gold/40 text-xs sm:text-sm text-afrikoni-deep flex flex-col gap-1">
                {intent === 'rfq' && (
                  <>
                    <span className="font-semibold text-afrikoni-chestnut">
                      {t('login.contextRFQTitle')}
                    </span>
                    <span>{t('login.contextRFQBody')}</span>
                  </>
                )}
                {intent === 'message' && (
                  <>
                    <span className="font-semibold text-afrikoni-chestnut">
                      {t('login.contextMessageTitle')}
                    </span>
                    <span>{t('login.contextMessageBody')}</span>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="mb-2 block font-semibold text-afrikoni-chestnut">{t('login.email')}</Label>
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
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block font-semibold text-afrikoni-chestnut">{t('login.password')}</Label>
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
                  />
                </div>
                <div className="mt-2 text-right">
                  <Link to="#" className="text-sm text-afrikoni-gold hover:text-afrikoni-goldDark font-medium">
                    {t('login.forgotPassword')}
                  </Link>
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
                    {t('login.signingIn')}
                  </>
                ) : (
                  t('login.signIn')
                )}
              </Button>
            </form>

            {/* Resend Confirmation Email */}
            {showResendConfirmation && (
              <div className="mt-4 p-4 bg-afrikoni-cream border border-afrikoni-gold/40 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-semibold text-afrikoni-chestnut mb-1">
                    Email Not Confirmed
                  </p>
                  <p className="text-sm text-afrikoni-deep mb-2">
                    Please check your email and click the confirmation link. If you didn't receive it, click below to resend.
                  </p>
                </div>
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  variant="primary"
                  className="w-full"
                  size="sm"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>
                <p className="text-xs text-afrikoni-deep/70 text-center">
                  Check your spam folder if you don't see the email.
                </p>
              </div>
            )}

            {/* Message from URL params */}
            {searchParams.get('message') === 'confirm-email' && !showResendConfirmation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Account created!</strong> Please check your email to confirm your account.
                </p>
                <Button
                  onClick={() => {
                    setShowResendConfirmation(true);
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resend Confirmation Email
                </Button>
              </div>
            )}

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
                    // Optional: Show success message (redirect happens automatically)
                    toast.success(t('login.success') || 'Redirecting...');
                  }}
                  onError={(error) => {
                    // Error handling is done in the component, but we can add additional logic here if needed
                    setIsLoading(false);
                  }}
                />
                <FacebookSignIn 
                  redirectTo={getOAuthRedirectPath()}
                  onSuccess={() => {
                    toast.success(t('login.success') || 'Redirecting...');
                  }}
                  onError={(error) => {
                    setIsLoading(false);
                  }}
                />
              </div>
            </div>

            {/* Quick Role Hints */}
            <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
              <p className="text-xs text-afrikoni-deep/70 text-center mb-3">{t('login.continueAs')}</p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline" className="text-xs">{t('login.buyer')}</Badge>
                <Badge variant="outline" className="text-xs">{t('login.seller')}</Badge>
                <Badge variant="outline" className="text-xs">{t('login.logistics')}</Badge>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
              <div className="flex items-center justify-center gap-4 text-xs text-afrikoni-deep/70">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>{t('login.sslSecured')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>{t('login.trusted')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-afrikoni-deep">
                {t('login.dontHaveAccount')}{' '}
                <Link
                  to={
                    redirectUrl
                      ? `${createPageUrl('Signup')}?redirect=${encodeURIComponent(redirectUrl)}`
                      : createPageUrl('Signup')
                  }
                  className="text-afrikoni-gold hover:text-afrikoni-goldDark font-semibold"
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
