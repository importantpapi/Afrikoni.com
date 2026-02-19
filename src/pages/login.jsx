import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock as LockIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { login as authServiceLogin } from '@/services/AuthService';
import { isNetworkError, handleNetworkError } from '@/utils/networkErrorHandler';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/contexts/CapabilityContext';
import { Button } from '@/components/shared/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';

export default function Login() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auth state
  const { authReady, hasUser, profile } = useAuth();
  const { ready } = useCapability();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home', language);

  // Redirect logged-in users
  useEffect(() => {
    if (authReady !== true || ready !== true || !hasUser) return;

    if (!profile) {
      navigate(`/${language}/onboarding/company`, { replace: true });
    } else {
      navigate(`/${language}/dashboard`, { replace: true });
    }
  }, [authReady, ready, hasUser, profile, navigate, language]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      await authServiceLogin(email.trim(), password);
      toast.success('Welcome back to Afrikoni');
      navigate(`/${language}/auth/post-login`, { replace: true });
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error(handleNetworkError(err));
      } else {
        toast.error(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    return redirectUrl && redirectUrl !== createPageUrl('Home', language) ? redirectUrl : `/${language}/dashboard`;
  };

  // Loading state - removed to prevent deadlock
  // if (typeof ready === 'undefined') {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-os-bg via-os-bg to-os-bg flex flex-col items-center justify-center p-6">
  //       <div className="w-12 h-12 border-3 border-gray-200 border-t-os-accent rounded-full animate-spin mb-4" />
  //       <p className="text-sm text-gray-500 font-medium">Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access Afrikoni's private trade network"
      footerText={
        <>
          Don't have an account?{' '}
          <Link to={`/${language}/signup`} className="text-os-accent hover:text-os-accent-dark font-medium transition-colors">
            Create account
          </Link>
        </>
      }
    >
      {/* Google Sign In */}
      <div className="mb-8">
        <GoogleSignIn
          redirectTo={getOAuthRedirectPath()}
          className="w-full h-[52px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 rounded-[14px] font-medium text-[15px] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:shadow-sm"
        />
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-[13px] font-medium text-gray-500">
          <span className="bg-white px-4">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-gray-700 block">Work email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
              placeholder="name@company.com"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-gray-700 block">Password</label>
            <Link
              to={`/${language}/forgot-password`}
              className="text-[13px] font-medium text-os-accent hover:text-os-accent-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] bg-os-accent hover:bg-os-accent-dark active:bg-os-accent-dark text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
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
