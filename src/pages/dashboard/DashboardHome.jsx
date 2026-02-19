import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import { useTrades } from '@/hooks/queries/useTrades';
import { useRFQs } from '@/hooks/queries/useRFQs';
import {
  Box, CreditCard, Ship, Sparkles, Lock as LockIcon,
  Globe, ShieldCheck, ChevronRight, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/system/Surface';
import { motion } from 'framer-motion';
import { NBA, Button } from '@/components/shared/ui';
import OnboardingWizard from '@/components/dashboard/OnboardingWizard';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

export default function DashboardHome() {
  const {
    isSystemReady,
    profileCompanyId
  } = useDashboardKernel();
  const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
  const { data: allRFQs = [], isLoading: rfqsLoading } = useRFQs();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Extract first name for personal greeting
  const firstName = profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

  if (!isSystemReady) {
    return <DashboardSkeleton />;
  }

  // 🚀 MASTER AUDIT FIX: If no company, show the Onboarding Wizard instead of an empty dashboard.
  if (!profileCompanyId) {
    return <OnboardingWizard />;
  }


  const isSeller = profile?.can_sell === true;
  const isBuyer = profile?.can_buy === true;

  // Real metrics from actual data only
  const activeDeals = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));
  const completedDeals = activeTrades.filter(t => ['settled', 'closed'].includes(t.status));
  const hasTradeHistory = activeTrades.length > 0;

  // Filter open RFQs
  const openRFQs = allRFQs.filter(r => r.status === 'open' || r.status === 'active');

  // Calculate escrow value from active trades
  const totalEscrowValue = activeDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);
  const totalCompletedValue = completedDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);

  // Determines what user should do next based on their role
  const getNextBestAction = () => {
    if (activeDeals.length > 0) {
      const nextTrade = activeDeals[0];
      return {
        title: t('dashboard.track_shipment_title', { product: nextTrade.productName || 'trade' }),
        description: t('dashboard.shipment_on_way_desc'),
        actionLabel: t('dashboard.view_shipment'),
        onAction: () => navigate(`/${language}/dashboard/trade/${nextTrade.id}`),
        icon: Ship,
        status: t('dashboard.active_deal_status')
      };
    }

    if (isSeller) {
      return {
        title: t('dashboard.find_buyers_title'),
        description: t('dashboard.find_buyers_desc'),
        actionLabel: t('dashboard.browse_requests'),
        onAction: () => navigate(`/${language}/dashboard/rfqs`),
        icon: Sparkles,
        status: t('dashboard.ready_to_trade_status')
      };
    }

    return {
      title: t('dashboard.find_what_need_title'),
      description: t('dashboard.find_what_need_desc'),
      actionLabel: t('dashboard.browse_suppliers'),
      onAction: () => navigate(`/${language}/suppliers`),
      icon: Sparkles,
      status: t('dashboard.ready_to_trade_status')
    };
  };

  const nba = getNextBestAction();

  // Key Metrics
  const stats = [
    {
      label: t('dashboard.active_deals'),
      value: activeDeals.length.toString(),
      sub: "Active now",
      color: "text-gray-900",
    },
    {
      label: "Escrow",
      value: `$${totalEscrowValue.toLocaleString()}`,
      sub: "Protected",
      color: "text-emerald-600",
    },
    {
      label: "Settled",
      value: `$${totalCompletedValue.toLocaleString()}`,
      sub: "Total volume",
      color: "text-gray-900",
    },
    {
      label: "Requests",
      value: openRFQs.length.toString(),
      sub: "Open market",
      color: "text-gray-500",
    }
  ];

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t('dashboard.greeting_morning');
    if (hours < 18) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  };

  return (
    <div className="os-page-layout">
      {/* Warm Greeting - Institutional */}
      <div className="os-header-group">
        <h1 className="text-4xl md:text-5xl font-semibold mb-2 text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-lg text-gray-500">
          {t('dashboard.business_status_subtitle')}
        </p>
      </div>

      {/* Trade Dashboard - Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone 1: Primary Action */}
        <div className="lg:col-span-2">
          <NBA
            title={nba.title}
            description={nba.description}
            actionLabel={nba.actionLabel}
            onAction={nba.onAction}
            icon={nba.icon}
            status={nba.status}
          />
        </div>

        {/* Zone 2: Key Business Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(0, 4).map((stat, i) => (
            <Surface key={i} variant="panel" className="p-5 flex flex-col justify-between border-gray-100 hover:border-gray-200 transition-all group relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.sub}</div>
              </div>
            </Surface>
          ))}
        </div>
      </div>

      {/* Zone 3: Quick Tip */}
      {!hasTradeHistory && (
        <Surface variant="soft" className="flex items-center gap-4 px-5 py-3 border-os-accent/20 bg-os-accent/5">
          <Sparkles className="w-4 h-4 text-os-accent" />
          <p className="text-sm font-medium text-os-accent/80">
            {isSeller ? t('dashboard.seller_tip') : t('dashboard.buyer_tip')}
          </p>
        </Surface>
      )}

      {/* Quick Actions - role-aware */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(isSeller ? [
          { label: t('dashboard.view_buy_requests_label'), sub: t('dashboard.view_buy_requests_sub'), icon: Globe, link: `/${language}/dashboard/rfqs`, color: "text-blue-600", bg: "bg-blue-50" },
          { label: t('dashboard.add_product_label'), sub: t('dashboard.add_product_sub'), icon: Package, link: `/${language}/dashboard/products/new`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: t('dashboard.my_orders_label'), sub: t('dashboard.my_orders_sub'), icon: Ship, link: `/${language}/dashboard/orders`, color: "text-gray-600", bg: "bg-gray-50" },
        ] : [
          { label: t('dashboard.create_rfq_label'), sub: t('dashboard.create_rfq_sub'), icon: Globe, link: `/${language}/dashboard/rfqs/new`, color: "text-blue-600", bg: "bg-blue-50" },
          { label: t('dashboard.browse_suppliers_label'), sub: t('dashboard.browse_suppliers_sub'), icon: Package, link: `/${language}/suppliers`, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: t('dashboard.my_orders_label'), sub: t('dashboard.my_orders_sub'), icon: Ship, link: `/${language}/dashboard/orders`, color: "text-gray-600", bg: "bg-gray-50" },
        ]).map((item, i) => (
          <Surface
            key={i}
            variant="panel"
            hover
            onClick={() => navigate(item.link)}
            className="p-6 text-left group border-2 border-transparent hover:border-gray-200"
          >
            <div className={cn("w-12 h-12 rounded-lg mb-4 flex items-center justify-center transition-transform", item.bg)}>
              <item.icon className={cn("w-6 h-6", item.color)} />
            </div>
            <h3 className="font-semibold text-lg mb-1 text-gray-900">{item.label}</h3>
            <p className="text-sm text-gray-500">{item.sub}</p>
          </Surface>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          {/* A. MY DEALS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.my_active_deals')}</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900">
                {t('dashboard.see_all_deals')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <Surface variant="panel" className="p-2 overflow-hidden border-gray-100">
              {tradesLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-lg" />)}
                </div>
              ) : activeTrades && activeTrades.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {activeTrades.slice(0, 3).map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                      className="group flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <Box className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium text-gray-900">{trade.productName}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-amber-600 font-medium">{trade.status || t('dashboard.pending')}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{trade.corridor?.originCountry || '—'} to {trade.corridor?.destinationCountry || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-semibold text-gray-900 tabular-nums">${(trade.value || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-400 font-medium">{t('dashboard.deal_value')}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{t('dashboard.no_active_deals')}</h3>
                  <p className="text-gray-500 text-base mb-6">
                    {isSeller ? t('dashboard.no_active_deals_desc_seller') : t('dashboard.no_active_deals_desc_buyer')}
                  </p>
                  <Button
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg px-8 h-12 shadow-sm"
                    onClick={() => navigate(`/${language}/dashboard/rfqs`)}
                  >
                    {t('dashboard.browse_buy_requests')}
                  </Button>
                </div>
              )}
            </Surface>
          </div>

          {/* A2. GROUP PURCHASES */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Active Group Purchases</h2>
            </div>

            <Surface variant="panel" className="p-0 overflow-hidden border-blue-100 bg-blue-50/30">
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-blue-500/80 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-900 mb-1">No active group purchases</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Join a group purchase to access better pricing on selected products.</p>
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
                  onClick={() => navigate(`/${language}/marketplace?filter=group-buy`)}
                >
                  Browse Pools <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Surface>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* B. MY MONEY - Earnings Card */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              {t('dashboard.my_money')}
            </h2>
            <Surface variant="panel" className="p-8 group relative overflow-hidden bg-white hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-3xl font-semibold tracking-tight text-gray-900">${totalCompletedValue.toLocaleString()}</div>
                  <div className="text-sm font-medium text-emerald-600">{t('dashboard.balance')}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{t('dashboard.in_escrow')}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">${totalEscrowValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">{t('dashboard.earn_hint')}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">—</span>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/${language}/dashboard/payments`)}
                variant="outline"
                className="w-full mt-8 border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg py-6 text-xs font-semibold uppercase tracking-wide text-gray-900"
              >
                {t('dashboard.view_payments')}
              </Button>
            </Surface>
          </div>

          {/* C. YOU'RE PROTECTED - Trust Panel */}
          <div className="space-y-4">
            <h2 className="text-os-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-os-green" />
              {t('dashboard.you_are_protected')}
            </h2>
            <Surface variant="panel" className="p-6 border-2 border-white/5 bg-white/[0.02]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-os-green mt-0.5 shrink-0" />
                  <div>
                    <p className="text-os-sm font-semibold">{t('dashboard.verified_buyers')}</p>
                    <p className="text-os-xs text-os-text-secondary">{t('dashboard.verified_buyers_desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <LockIcon className="w-5 h-5 text-os-green mt-0.5 shrink-0" />
                  <div>
                    <p className="text-os-sm font-semibold">{t('dashboard.safe_payments')}</p>
                    <p className="text-os-xs text-os-text-secondary">{t('dashboard.safe_payments_desc')}</p>
                  </div>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
