import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Logo } from '@/components/shared/ui/Logo';
import { Button } from '@/components/shared/ui/button';
import { MailCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

      // ✅ EMAIL VERIFICATION FIX: Include redirect URL to auth-callback
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
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo type="full" size="lg" link={true} showTagline={true} />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg border border-afrikoni-gold/20 space-y-4">
          <div className="flex justify-center mb-2">
            <MailCheck className="w-14 h-14 text-afrikoni-gold" />
          </div>
          <h2 className="text-2xl font-bold text-afrikoni-chestnut">Confirm your email to continue</h2>
          <p className="text-afrikoni-deep">
            We’ve sent a secure link to your email. Please confirm your email address to access your Afrikoni dashboard.
          </p>
          <p className="text-sm text-afrikoni-deep/80">
            If you don’t see the email, check your spam or promotions folder, or resend the verification email below.
          </p>
          <Button
            className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold mt-4"
            onClick={handleResend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending verification email...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 mt-2"
            onClick={() => navigate('/login')}
          >
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}


