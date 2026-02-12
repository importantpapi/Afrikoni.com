import React, { useEffect, useState } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import BuyerDashboard from '@/components/dashboard/roles/BuyerDashboard';
import SellerDashboard from '@/components/dashboard/roles/SellerDashboard';
import LogisticsDashboard from '@/components/dashboard/roles/LogisticsDashboard';
import { supabase } from '@/api/supabaseClient';
import { OnboardingTour } from '@/components/dashboard/OnboardingTour';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DashboardHome() {
  const { user, capabilities, isSystemReady, profile } = useDashboardKernel();
  const [preferences, setPreferences] = useState(null);
  const [prefLoading, setPrefLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Role Switching Logic (URL Param)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('switch') === 'true' && preferences) {
      // Toggle role logic if requested via URL
      console.log('[DashboardHome] Manual role switch requested');
    }
  }, [location, preferences]);

  // Load User Preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setPrefLoading(false);
        return;
      }

      // Check LocalStorage first for high-speed fallback
      const localOnboarding = localStorage.getItem(`afrikoni_onboarding_${user.id}`);
      if (localOnboarding === 'true') {
        setPrefLoading(false);
        return; // Already completed, no need to show tour or wait for DB for this specific flag
      }

      // SAFETY TIMEOUT: Force prefLoading to false after 3 seconds
      const safetyTimeout = setTimeout(() => {
        if (prefLoading) {
          console.warn('[DashboardHome] Preferences fetch timeout - bypassing skeleton');
          setPrefLoading(false);
        }
      }, 3000);

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setPreferences(data);
          // Show tour if not completed and not in local storage
          if (!data.onboarding_completed) {
            setShowTour(true);
          } else {
            // Sync local storage if DB says it's done
            localStorage.setItem(`afrikoni_onboarding_${user.id}`, 'true');
          }
        } else if (user) {
          // If no preferences, first time user -> show tour
          setShowTour(true);
        }
      } catch (e) {
        console.error('[DashboardRouter] Error loading preferences:', e);
      } finally {
        clearTimeout(safetyTimeout);
        setPrefLoading(false);
      }
    }

    if (user) {
      loadPreferences();
    }
  }, [user]);

  // Determine Dashboard to Render
  const getDashboardComponent = () => {
    // 1. User Preference (Highest Priority)
    if (preferences?.default_mode) {
      switch (preferences.default_mode) {
        case 'buyer': return <BuyerDashboard />;
        case 'seller': return <SellerDashboard />;
        case 'logistics': return <LogisticsDashboard />;
        case 'operator': return <BuyerDashboard />; // Default to buyer view for now
        default: return <BuyerDashboard />;
      }
    }

    // 2. Capabilities (Auto-detect) - DISABLED per user request ("Everyone is a buyer")
    // if (capabilities?.can_logistics) return <LogisticsDashboard />;
    // if (capabilities?.can_sell && capabilities?.sell_status === 'approved') return <SellerDashboard />;

    // 3. Default Fallback (Universal Buyer View)
    return <BuyerDashboard />;
  };

  const currentRole = preferences?.default_mode || 'buyer';

  const handleTourComplete = async () => {
    setShowTour(false);
    if (user) {
      // 1. Immediate Local Persistence
      localStorage.setItem(`afrikoni_onboarding_${user.id}`, 'true');

      // 2. Database Sync
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            default_mode: currentRole
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('[DashboardHome] Failed to sync onboarding preference:', err);
      }
    }
  };

  if (!isSystemReady || prefLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {showTour && (
        <OnboardingTour
          role={currentRole}
          onComplete={handleTourComplete}
        />
      )}
      {getDashboardComponent()}
    </>
  );
}

