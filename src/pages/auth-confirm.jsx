/**
 * Email Confirmation Page
 * 
 * Handles email verification from Supabase confirmation links.
 * This is the MVP-clean, Amazon-simple confirmation flow.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { sendWelcomeEmail } from '@/services/emailService';
import { logAuthEvent } from '@/lib/supabase-auth-helpers';

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Get token from URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('token') || hashParams.get('access_token') || searchParams.get('token');
        const type = hashParams.get('type') || searchParams.get('type');

        if (!token) {
          // Try to verify from Supabase session (might already be confirmed)
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            // Already confirmed, redirect to success
            setStatus('success');
            setTimeout(() => {
              navigate('/auth/success', { replace: true });
            }, 1500);
            return;
          }
          throw new Error('No confirmation token found. Please check your email for the confirmation link.');
        }

        // Verify email with Supabase
        // Try multiple verification methods for compatibility
        let verificationSuccess = false;
        let verificationError = null;

        // Method 1: Try verifyOtp with token_hash
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type === 'email' ? 'email' : 'signup'
          });
          if (!error) {
            verificationSuccess = true;
          } else {
            verificationError = error;
          }
        } catch (otpError) {
          verificationError = otpError;
        }

        // Method 2: If verifyOtp fails, try with token directly
        if (!verificationSuccess && token) {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token: token,
              type: type === 'email' ? 'email' : 'signup'
            });
            if (!error) {
              verificationSuccess = true;
            } else if (!verificationError) {
              verificationError = error;
            }
          } catch (tokenError) {
            if (!verificationError) {
              verificationError = tokenError;
            }
          }
        }

        // Method 3: Check if already confirmed via session
        if (!verificationSuccess) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            verificationSuccess = true;
          }
        }

        if (!verificationSuccess && verificationError) {
          throw verificationError;
        }

        // Success - email confirmed
        setStatus('success');
        toast.success('Email confirmed successfully!');

        // Fire-and-forget: log auth event + send welcome email (if not already sent)
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await logAuthEvent(user.id, 'email_verified', {});
            await sendWelcomeEmail(user.email, user.user_metadata?.name || user.email?.split('@')[0] || 'there');
          }
        } catch (sideEffectError) {
          console.debug('Post-confirmation side effects failed', sideEffectError);
        }

        // Redirect to success page after brief delay
        setTimeout(() => {
          navigate('/auth/success', { replace: true });
        }, 1500);

      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setErrorMessage(
          err.message || 
          'Unable to confirm your email. The link may have expired or is invalid.'
        );
        toast.error('Confirmation failed');
      }
    };

    handleConfirmation();
  }, [navigate, searchParams]);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      // Get email from URL or try to get from session
      const emailParam = searchParams.get('email');
      
      if (!emailParam) {
        // Try to get email from current session if available
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        
        if (!email) {
          toast.error('Please enter your email address to resend confirmation.');
          navigate('/login?message=resend-confirmation');
          return;
        }

        // Resend confirmation email
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });

        if (error) throw error;

        toast.success('Confirmation email sent! Please check your inbox.');
      } else {
        // Resend with provided email
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: emailParam
        });

        if (error) throw error;

        toast.success('Confirmation email sent! Please check your inbox.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend confirmation email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-8 sm:py-12 px-4">
      <Card className="w-full max-w-md border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl">
        <CardContent className="p-6 sm:p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" link={true} showTagline={false} />
          </div>

          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-afrikoni-gold" />
              <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                Confirming your email...
              </h1>
              <p className="text-afrikoni-deep text-sm sm:text-base">
                Please wait while we verify your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                Email Confirmed! ✅
              </h1>
              <p className="text-afrikoni-deep text-sm sm:text-base mb-6">
                Your Afrikoni account is now active. Redirecting...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                Confirmation Failed
              </h1>
              <p className="text-afrikoni-deep text-sm sm:text-base mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  variant="primary"
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
                      Resend Confirmation Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

