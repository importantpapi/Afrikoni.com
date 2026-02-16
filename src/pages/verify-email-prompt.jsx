import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';

export default function VerifyEmailPrompt() {
  const navigate = useNavigate();
  const [isSending, setIsSending] = React.useState(false);

  const handleResend = async () => {
    setIsSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('You need to be logged in to resend verification email.');
        navigate('/login');
        return;
      }

      const emailRedirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: emailRedirectUrl,
        },
      });

      if (error) throw error;
      toast.success('Verification email sent. Please check your inbox.');
    } catch (err) {
      console.error('Resend verification error:', err);
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout
      title="Confirm your email"
      subtitle="We've sent a verification link to your email. Please confirm to continue."
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#D4A937]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#D4A937]" />
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Check your inbox and spam folder for the verification email. Click the link to activate your account.
          </p>
        </div>

        <Button
          onClick={handleResend}
          disabled={isSending}
          className="w-full h-[52px] bg-[#D4A937] hover:bg-[#C29931] active:bg-[#B38A2C] text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend verification email'
          )}
        </Button>

        <Button
          onClick={() => navigate('/login')}
          className="w-full h-[52px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 rounded-[14px] font-medium text-[15px] transition-all shadow-sm hover:shadow-md active:shadow-sm"
        >
          Back to login
        </Button>
      </div>
    </AuthLayout>
  );
}


