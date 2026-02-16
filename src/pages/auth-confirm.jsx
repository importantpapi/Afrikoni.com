/**
 * Email Confirmation Page
 * Handles email verification from Supabase confirmation links
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';
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

  if (status === 'loading') {
    return (
      <AuthLayout
        title="Confirming your email"
        subtitle="Please wait while we verify your account"
      >
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-[#D4A937]" />
          <p className="text-[14px] text-gray-600">This will only take a moment...</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Email confirmed"
        subtitle="Your Afrikoni account is now active"
      >
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-[14px] text-gray-600">Redirecting you to your dashboard...</p>
          <Loader2 className="w-6 h-6 animate-spin text-[#D4A937] mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout
        title="Confirmation failed"
        subtitle={errorMessage}
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              The confirmation link may have expired or is invalid. Try requesting a new one.
            </p>
          </div>

          <Button
            onClick={handleResendConfirmation}
            disabled={isResending}
            className="w-full h-[52px] bg-[#D4A937] hover:bg-[#C29931] active:bg-[#B38A2C] text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-[18px] h-[18px] mr-2" />
                Resend confirmation email
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate('/login')}
            className="w-full h-[52px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 rounded-[14px] font-medium text-[15px] transition-all shadow-sm hover:shadow-md active:shadow-sm"
          >
            Go to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return null;
}

