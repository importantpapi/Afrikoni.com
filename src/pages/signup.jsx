import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/shared/ui/button';
import { Mail, Lock, Loader2, User, ShoppingCart, Package, RefreshCw, Truck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import FacebookSignIn from '@/components/auth/FacebookSignIn';
import { isNetworkError, handleNetworkError } from '@/utils/networkErrorHandler';
import { Surface } from '@/components/system/Surface';

export default function Signup() {
  const { t, language } = useLanguage();
  const { authReady, hasUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  // ✅ STRIPE FLOW: Role is optional, collected later
  const [selectedRole, setSelectedRole] = useState('buyer'); // Default to buyer
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', general: '' });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home', language);

  // 🚨 REDIRECT LAW: Logged-in users are sent to Post-Login Router
  useEffect(() => {
    if (!authReady) return;
    if (hasUser) {
      navigate(`/${language}/auth/post-login`, { replace: true });
    }
  }, [authReady, hasUser, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setFieldErrors({ email: '', password: '', general: '' });

    setIsLoading(true);
    try {
      // ✅ STRIPE FLOW: Auto-confirm email, no verification wall
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            intended_role: selectedRole,
          },
          emailRedirectTo: `${window.location.origin}/${language}/auth/callback`,
        },
      });

      if (error) throw error;

      // Handle different signup outcomes
      if (data.session) {
        // Immediate session (e.g. auto-confirm enabled)
        toast.success('Account created! Redirecting...');
        navigate(`/${language}/auth/post-login`, { replace: true });
      } else if (data.user) {
        // User created but no session (email confirmation required)
        // Redirect to the verify-email page — shows clear instructions + resend button
        navigate(`/${language}/verify-email?email=${encodeURIComponent(formData.email.trim())}`, { replace: true });
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setFieldErrors(prev => ({ ...prev, general: handleNetworkError(error) }));
      } else {
        setFieldErrors(prev => ({ ...prev, general: error.message || 'Signup failed. Please try again.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getOAuthRedirectPath = () => {
    return redirectUrl && redirectUrl !== createPageUrl('Home', language) ? redirectUrl : `/${language}/dashboard`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-os-bg via-os-bg to-os-bg flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Subtle depth - calm, not dramatic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,169,55,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,169,55,0.02),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] z-10"
      >
        <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] p-12 border border-black/[0.08]">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-10">
              <Logo type="symbol" size="md" />
            </div>
            <h1 className="text-[26px] font-semibold text-gray-900 mb-3 tracking-[-0.02em] leading-tight">
              Create your account
            </h1>
            <p className="text-sm text-gray-600 font-normal leading-relaxed">
              Access Afrikoni's private network of verified<br />African producers and suppliers
            </p>
          </div>

          {/* Google Sign In */}
          <div className="mb-8">
            <GoogleSignIn
              redirectTo={getOAuthRedirectPath()}
              intendedRole={selectedRole}
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

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[13px] font-medium text-gray-700 block">Full name</label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
                  placeholder="Ama Mensah"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-medium text-gray-700 block">Work email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-medium text-gray-700 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {fieldErrors.general && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                {fieldErrors.general}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-os-accent hover:bg-os-accent-dark active:bg-os-accent-dark text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-2 text-[13px] text-gray-500 pt-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Your information is encrypted and protected</span>
            </div>
          </form>

          <div className="text-center text-sm text-gray-600 mt-10 pt-8 border-t border-gray-100">
            <p>
              Already have an account?{' '}
              <Link to={`/${language}/login`} className="text-os-accent hover:text-os-accent-dark font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[13px] text-gray-400 leading-relaxed">
          © 2026 Afrikoni · <a href={`/${language}/legal/terms`} className="hover:text-gray-600 transition-colors">Terms</a> · <a href={`/${language}/legal/privacy`} className="hover:text-gray-600 transition-colors">Privacy</a>
        </p>
      </motion.div>
    </div>
  );
}
