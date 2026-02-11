import React, { useEffect, useState } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import BuyerDashboard from '@/components/dashboard/roles/BuyerDashboard';
import SellerDashboard from '@/components/dashboard/roles/SellerDashboard';
import LogisticsDashboard from '@/components/dashboard/roles/LogisticsDashboard';
import { supabase } from '@/api/supabaseClient';

export default function DashboardHome() {
  const { user, capabilities, isSystemReady } = useDashboardKernel();
  const [preferences, setPreferences] = useState(null);
  const [prefLoading, setPrefLoading] = useState(true);

  // Load User Preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setPrefLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

        if (data) setPreferences(data);
      } catch (e) {
        console.error('[DashboardRouter] Error loading preferences:', e);
      } finally {
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

  if (!isSystemReady || prefLoading) {
    return <DashboardSkeleton />;
  }

  return getDashboardComponent();
}

