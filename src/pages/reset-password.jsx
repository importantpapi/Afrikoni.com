import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Loader2, CheckCircle, Eye, EyeOff, Lock as LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  // Supabase processes the recovery token from the URL hash automatically.
  // We listen for the PASSWORD_RECOVERY or SIGNED_IN event before showing the form.
  useEffect(() => {
    // Check for error in the URL hash (e.g. expired link)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description') || 'This link has expired or is invalid.';
      setTokenError(errorDesc.replace(/\+/g, ' '));
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
      }
    });

    // Also check if there is already an active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // Fallback: if the recovery event never fires (bad link, no hash token),
    // wait 4 seconds then surface the error
    const fallback = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) {
          setTokenError('This password reset link has expired or already been used. Please request a new one.');
        }
        return prev;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  const getStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return 'weak';
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'fair';
    return 'strong';
  };

  const strength = getStrength(password);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsDone(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate(`/${language}/login`, { replace: true }), 3000);
    } catch (error) {
      console.error('[ResetPassword]', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your new password has been saved"
        footerText={
          <Link to={`/${language}/login`} className="text-os-accent hover:text-os-accent-dark font-medium transition-colors">
            Sign in now
          </Link>
        }
      >
        <div className="text-center py-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Redirecting you to sign in...</p>
        </div>
      </AuthLayout>
    );
  }

  // ── INVALID / EXPIRED LINK ───────────────────────────────────────────────────
  if (tokenError) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This password reset link is no longer valid"
        footerText={
          <>
            <Link to={`/${language}/forgot-password`} className="text-os-accent hover:text-os-accent-dark font-medium transition-colors">
              Request a new link
            </Link>
            {' · '}
            <Link to={`/${language}/login`} className="text-gray-500 hover:text-gray-700 font-medium transition-colors">
              Back to sign in
            </Link>
          </>
        }
      >
        <div className="text-center py-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-red-500 font-bold text-2xl">!</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{tokenError}</p>
        </div>
      </AuthLayout>
    );
  }

  // ── WAITING FOR SUPABASE TOKEN PROCESSING ───────────────────────────────────
  if (!sessionReady) {
    return (
      <AuthLayout title="Verifying link..." subtitle="Please wait a moment">
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 text-os-accent animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  // ── MAIN FORM ────────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a strong password to protect your account"
      footerText={
        <>
          Remember your password?{' '}
          <Link to={`/${language}/login`} className="text-os-accent hover:text-os-accent-dark font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleReset} className="space-y-6">
        {/* New password */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-gray-700 block">New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
              placeholder="Minimum 8 characters"
              required
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
          {strength && (
            <div className="space-y-1.5">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    strength === 'weak' ? 'bg-red-500 w-1/4' :
                    strength === 'fair' ? 'bg-yellow-500 w-3/5' :
                    'bg-green-500 w-full'
                  }`}
                />
              </div>
              <p className={`text-[12px] font-medium ${
                strength === 'weak' ? 'text-red-600' :
                strength === 'fair' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {strength === 'weak' ? 'Too short' :
                 strength === 'fair' ? 'Fair — add numbers or capitals' :
                 'Strong password'}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-gray-700 block">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-white border rounded-[13px] py-3.5 px-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-os-accent/20 focus:border-os-accent'
              }`}
              placeholder="Repeat your password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-[12px] font-medium text-red-600">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
          className="w-full h-[52px] bg-os-accent hover:bg-os-accent-dark text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              Updating password...
            </>
          ) : (
            'Update password'
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[13px] text-gray-500 pt-2">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Your information is encrypted and protected</span>
        </div>
      </form>
    </AuthLayout>
  );
}
