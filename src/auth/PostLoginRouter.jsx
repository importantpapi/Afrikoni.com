import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';

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
        const { error: profileError } = await supabase
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
        }
        
        // Newly created profile won't have company_id, so redirect to onboarding
        navigate('/onboarding/company', { replace: true });
        return;
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