import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardHome from './DashboardHome';

export default function Dashboard() {
  const [currentRole, setCurrentRole] = useState('buyer');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadRole();
  }, []);

  const checkAuthAndLoadRole = async () => {
    try {
      // Check if user has a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        navigate('/login');
        return;
      }

      // Get user profile - try profiles table first, then users table
      let userData = null;
      
      // Try profiles table first
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profilesErr) {
        // If profiles table error (not found or other), try users table
        if (profilesErr.code === 'PGRST116' || profilesErr.code === '42P01') {
          const { data: usersData, error: usersErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (usersErr && usersErr.code !== 'PGRST116') {
            // Error logged (removed for production)
            navigate('/login');
            return;
          }
          
          userData = usersData;
        } else {
          // Error logged (removed for production)
          navigate('/login');
          return;
        }
      } else {
        userData = profilesData;
      }

      // If no user data found, create a basic profile with default role
      if (!userData) {
        // Create basic profile
        await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            role: 'buyer'
          }, { onConflict: 'id' });
        
        setCurrentRole('buyer');
        setIsLoading(false);
        return;
      }

      // Get role from user data, default to 'buyer'
      const role = userData.role || userData.user_role || 'buyer';
      const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;
      
      setCurrentRole(normalizedRole);
    } catch (error) {
      // Error logged (removed for production)
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDashboardContent = () => {
    // Use the new enterprise dashboard home
    return <DashboardHome currentRole={currentRole} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      {renderDashboardContent()}
    </DashboardLayout>
  );
}

