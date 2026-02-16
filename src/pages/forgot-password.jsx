import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Loader2, CheckCircle, Lock as LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={
          <>
            We sent a password reset link to<br />
            <strong>{email}</strong>
          </>
        }
        footerText={
          <>
            Remember your password?{' '}
            <Link to={createPageUrl('Login')} className="text-[#D4A937] hover:text-[#C29931] font-medium transition-colors">
              Sign in
            </Link>
          </>
        }
      >
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full h-[52px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 border border-gray-300 rounded-[14px] font-medium text-[15px] transition-all shadow-sm"
            >
              Send another email
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footerText={
        <>
          Remember your password?{' '}
          <Link to={createPageUrl('Login')} className="text-[#D4A937] hover:text-[#C29931] font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-gray-700 block">Work email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A937]/20 focus:border-[#D4A937] transition-all"
              placeholder="name@company.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] bg-[#D4A937] hover:bg-[#C29931] active:bg-[#B38A2C] text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-2 text-[13px] text-gray-500 pt-2">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Your information is encrypted and protected</span>
        </div>
      </form>
    </AuthLayout>
  );
}
