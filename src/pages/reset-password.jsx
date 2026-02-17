import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Loader2, Eye, EyeOff, Lock as LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      navigate('/login');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Your new password must be different from previously used passwords"
    >
      <form onSubmit={handleResetPassword} className="space-y-6">
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
              minLength={8}
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

        <div className="space-y-2.5">
          <label className="text-[13px] font-medium text-gray-700 block">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-[13px] py-3.5 px-4 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all"
              placeholder="Re-enter your password"
              required
              disabled={isLoading}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
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
              Updating password...
            </>
          ) : (
            'Reset password'
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
