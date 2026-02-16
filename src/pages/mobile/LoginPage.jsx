/**
 * MOBILE LOGIN (LUXURY AUTH)
 * Apple ID + Private Banking Standard
 * 
 * Calm, minimal, trustworthy
 * No drama, pure function
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import CalmAuthLayout, { AuthInput, AuthButton } from '@/components/mobile/CalmAuthLayout';
import { toast } from 'sonner';

export default function MobileLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    if (!email || !password) {
      setErrors({
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : ''
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Login failed. Please try again.'
      });
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalmAuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your trade journey"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {/* Email */}
        <AuthInput
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        {/* Password */}
        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-os-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">
              {errors.general}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-os-accent/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-afrikoni-deep/50">
              or
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <AuthButton
          type="button"
          variant="secondary"
          onClick={() => {
            // Google OAuth
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth-callback`
              }
            });
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </div>
        </AuthButton>

        {/* Sign Up Link */}
        <div className="text-center pt-6">
          <p className="text-sm text-afrikoni-deep/60">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-os-accent hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </form>
    </CalmAuthLayout>
  );
}
