import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';

export default function VerifyEmail() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailStatus();
    
    // Poll for email verification every 3 seconds
    const interval = setInterval(() => {
      checkEmailStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const checkEmailStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      setEmail(user.email || '');

      if (user.email_confirmed_at) {
        setIsVerified(true);
        setIsLoading(false);
        // Redirect to onboarding after a short delay
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 1500);
      } else {
        setIsVerified(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking email status:', error);
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        toast.error(error.message || 'Failed to resend verification email');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

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
              
              {isVerified ? (
                <>
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                      Email Verified!
                    </h1>
                    <p className="text-afrikoni-deep">
                      Your email has been verified. Redirecting to onboarding...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-afrikoni-gold/10 rounded-full flex items-center justify-center mb-4">
                      <Mail className="w-10 h-10 text-afrikoni-gold" />
                    </div>
                    <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                      Verify Your Email
                    </h1>
                    <p className="text-afrikoni-deep mb-4">
                      We've sent a verification link to:
                    </p>
                    <p className="text-lg font-semibold text-afrikoni-gold mb-6">
                      {email}
                    </p>
                    <p className="text-sm text-afrikoni-deep/70 mb-6">
                      Please check your inbox and click the verification link to continue.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      variant="outline"
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={checkEmailStatus}
                      variant="ghost"
                      className="w-full"
                    >
                      I've verified my email
                    </Button>

                    <div className="pt-4 border-t border-afrikoni-gold/20">
                      <p className="text-xs text-afrikoni-deep/70 text-center">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                          onClick={handleResendEmail}
                          className="text-afrikoni-gold hover:underline font-medium"
                        >
                          resend
                        </button>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

