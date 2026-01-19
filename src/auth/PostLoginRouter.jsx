import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function PostLoginRouter() {
  const { user, profile, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePostLogin = async () => {
      if (!authReady) return;

      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Create profile if doesn't exist
      if (!profile) {
        try {
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
            })
            .select()
            .single();
          
          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error('[PostLoginRouter] Profile creation error:', profileError);
            toast.error('Failed to create your profile. Please try again or contact support.');
            navigate('/login', { replace: true });
            return;
          }
          
          // If profile created successfully, continue to onboarding
          if (newProfile) {
            navigate('/onboarding/company', { replace: true });
          } else {
            // Profile creation returned no data but no error - redirect to login
            toast.error('Account setup incomplete. Please try logging in again.');
            navigate('/login', { replace: true });
          }
          return;
        } catch (error) {
          console.error('[PostLoginRouter] Unexpected error during profile creation:', error);
          toast.error('An unexpected error occurred. Please try again or contact support.');
          navigate('/login', { replace: true });
          return;
        }
      }

      // PHASE 4: Removed role-based routing
      // Navigate based on company_id only (no role checks)
      if (profile.company_id) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding/company', { replace: true });
      }
    };

    handlePostLogin();
  }, [user, profile, authReady, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-afrikoni-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-afrikoni-deep">Setting up your account...</p>
      </div>
    </div>
  );
}