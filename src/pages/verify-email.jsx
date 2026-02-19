import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import AuthLayout from '@/components/auth/AuthLayout';

export default function VerifyEmail() {
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

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
        navigate(`/${language}/login`, { replace: true });
        return;
      }

      setEmail(user.email || '');

      if (user.email_confirmed_at) {
        setIsVerified(true);
        setIsLoading(false);
        // Redirect to PostLoginRouter after a short delay
        setTimeout(() => {
          navigate(`/${language}/auth/post-login`, { replace: true });
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
      const emailRedirectUrl = `${window.location.origin}/${language}/auth/callback`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: emailRedirectUrl,
        },
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
      <div className="min-h-screen bg-gradient-to-br from-os-bg via-os-bg to-os-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
      </div>
    );
  }

  if (isVerified) {
    return (
      <AuthLayout
        title="Email verified"
        subtitle="Redirecting you to your dashboard..."
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-os-accent mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          We sent a verification link to<br />
          <strong className="text-gray-900">{email}</strong>
        </>
      }
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-os-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-os-accent" />
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Please check your inbox and click the verification link to continue.
          </p>
        </div>

        <Button
          onClick={handleResendEmail}
          disabled={isResending}
          className="w-full h-[52px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 rounded-[14px] font-medium text-[15px] transition-all shadow-sm hover:shadow-md active:shadow-sm"
        >
          {isResending ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-[18px] h-[18px] mr-2" />
              Resend verification email
            </>
          )}
        </Button>

        <Button
          onClick={checkEmailStatus}
          className="w-full h-[52px] bg-os-accent hover:bg-os-accent-dark active:bg-os-accent-dark text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        >
          I've verified my email
        </Button>

        <p className="text-[13px] text-gray-500 text-center pt-4">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={handleResendEmail}
            className="text-os-accent hover:text-os-accent-dark font-medium transition-colors"
          >
            resend
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

