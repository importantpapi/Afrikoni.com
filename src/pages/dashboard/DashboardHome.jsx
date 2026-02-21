import React from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import { useViewPermissions } from '@/hooks/useViewPermissions';
import { SourcingDashboard } from './SourcingDashboard';
import { DistributionDashboard } from './DistributionDashboard';
import OnboardingWizard from '@/components/dashboard/OnboardingWizard';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

export default function DashboardHome() {
  const {
    isSystemReady,
    profileCompanyId
  } = useDashboardKernel();
  const { isSourcing } = useViewPermissions();
  const { profile } = useAuth();
  const { t } = useLanguage();

  // Extract first name for personal greeting
  const firstName = profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

  if (!isSystemReady) {
    return <DashboardSkeleton />;
  }

  // 🚀 MASTER AUDIT FIX: If no company, show the Onboarding Wizard instead of an empty dashboard.
  if (!profileCompanyId) {
    return <OnboardingWizard />;
  }

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t('dashboard.greeting_morning');
    if (hours < 18) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  };

  return (
    <div className="os-page-layout">
      {/* ✅ WARM GREETING - WhatsApp/Stripe style */}
      <div className="os-header-group">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-os-lg text-os-text-secondary">
          {isSourcing ? "Welcome to your Sourcing Hub" : "Welcome to your Distribution Hub"}
        </p>
      </div>

      {/* WORKSPACE SWITCHER: The Unified Trader Lens */}
      <div className="mt-8 transition-all duration-500">
        {isSourcing ? (
          <SourcingDashboard />
        ) : (
          <DistributionDashboard />
        )}
      </div>
    </div>
  );
}
