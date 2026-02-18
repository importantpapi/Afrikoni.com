import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import { useTrades } from '@/hooks/queries/useTrades';
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
  const { profile } = useAuth();
  const navigate = useNavigate();
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


  const isSeller = profile?.can_sell === true;
  const isBuyer = profile?.can_buy === true;

  // Determines what user should do next based on their role
  const getNextBestAction = () => {
    if (activeDeals.length > 0) {
      const nextTrade = activeDeals[0];
      return {
        title: t('dashboard.track_shipment_title', { product: nextTrade.productName || 'trade' }),
        description: t('dashboard.shipment_on_way_desc'),
        actionLabel: t('dashboard.view_shipment'),
        onAction: () => navigate(`/dashboard/trade/${nextTrade.id}`),
        icon: Ship,
        status: t('dashboard.active_deal_status')
      };
    }

    if (isSeller) {
      return {
        title: t('dashboard.find_buyers_title'),
        description: t('dashboard.find_buyers_desc'),
        actionLabel: t('dashboard.browse_requests'),
        onAction: () => navigate('/dashboard/rfqs'),
        icon: Sparkles,
        status: t('dashboard.ready_to_trade_status')
      };
    }

    return {
      title: t('dashboard.find_what_need_title'),
      description: t('dashboard.find_what_need_desc'),
      actionLabel: t('dashboard.browse_suppliers'),
      onAction: () => navigate('/suppliers'),
      icon: Sparkles,
      status: t('dashboard.ready_to_trade_status')
    };
  };

  // Real metrics from actual data only
  const activeDeals = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));
  const completedDeals = activeTrades.filter(t => ['settled', 'closed'].includes(t.status));
  const hasTradeHistory = activeTrades.length > 0;

  const stats = hasTradeHistory ? [
    { label: t('dashboard.active_deals'), value: activeDeals.length.toString(), sub: t('dashboard.active_deals_sub'), color: "text-os-accent", trend: activeDeals.length > 0 ? "Active" : "None" },
    { label: t('dashboard.completed'), value: completedDeals.length.toString(), sub: t('dashboard.completed_sub'), color: "text-os-green", trend: completedDeals.length > 0 ? "Done" : "—" },
    { label: t('dashboard.total_trades'), value: activeTrades.length.toString(), sub: t('dashboard.total_trades_sub'), color: "text-os-blue", trend: "Total" },
    { label: t('dashboard.open_rfqs'), value: "—", sub: t('dashboard.open_rfqs_sub'), color: "text-purple-400", trend: "—" },
  ] : [
    { label: t('dashboard.active_deals'), value: "0", sub: t('dashboard.active_deals_sub'), color: "text-os-accent", trend: "Get started" },
    { label: t('dashboard.completed'), value: "0", sub: t('dashboard.completed_sub'), color: "text-os-green", trend: "—" },
    { label: t('dashboard.products'), value: "0", sub: t('dashboard.add_product_sub'), color: "text-os-blue", trend: "Add one" },
    { label: "Trust Score", value: "—", sub: "Complete a trade to earn", color: "text-purple-400", trend: "—" },
  ];

  const nba = getNextBestAction();

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
          {t('dashboard.business_status_subtitle')}
        </p>
      </div>

      {/* 🏛️ OPERATIONAL COCKPIT: Horizon 2026 High-Density Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone 1: The Golden Path (Primary Action) */}
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

        {/* Zone 2: Intelligence Grid (Key Metrics) */}
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(0, 4).map((stat, i) => (
            <Surface key={i} variant="glass" className="p-4 flex flex-col justify-between border-os-stroke/40 hover:border-os-accent/30 transition-all group overflow-hidden relative">
              <div className="os-ambient-orb" style={{ top: '-50%', right: '-50%', opacity: 0.1 }} />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="os-label">{stat.label}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5", stat.color)}>{stat.trend}</span>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-black font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                <div className="text-[10px] font-medium text-os-text-secondary/40 uppercase tracking-tighter mt-1">{stat.sub}</div>
              </div>
            </Surface>
          ))}
        </div>
      </div>

      {/* Zone 3: Quick Tip */}
      {!hasTradeHistory && (
        <Surface variant="soft" className="flex items-center gap-4 px-5 py-3 border-os-accent/20 bg-os-accent/5">
          <Sparkles className="w-4 h-4 text-os-accent" />
          <p className="text-os-xs font-semibold text-os-accent/80 tracking-tight">
            {isSeller ? t('dashboard.seller_tip') : t('dashboard.buyer_tip')}
          </p>
        </Surface>
      )}

      {/* Quick Actions - role-aware */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(isSeller ? [
          { label: t('dashboard.view_buy_requests_label'), sub: t('dashboard.view_buy_requests_sub'), icon: Globe, link: "/dashboard/rfqs", color: "text-os-blue", bg: "bg-os-blue/10" },
          { label: t('dashboard.add_product_label'), sub: t('dashboard.add_product_sub'), icon: Package, link: "/dashboard/products/new", color: "text-os-green", bg: "bg-os-green/10" },
          { label: t('dashboard.my_orders_label'), sub: t('dashboard.my_orders_sub'), icon: Ship, link: "/dashboard/orders", color: "text-purple-500", bg: "bg-purple-500/10" },
        ] : [
          { label: t('dashboard.create_rfq_label'), sub: t('dashboard.create_rfq_sub'), icon: Globe, link: "/dashboard/rfqs/new", color: "text-os-blue", bg: "bg-os-blue/10" },
          { label: t('dashboard.browse_suppliers_label'), sub: t('dashboard.browse_suppliers_sub'), icon: Package, link: "/suppliers", color: "text-os-green", bg: "bg-os-green/10" },
          { label: t('dashboard.my_orders_label'), sub: t('dashboard.my_orders_sub'), icon: Ship, link: "/dashboard/orders", color: "text-purple-500", bg: "bg-purple-500/10" },
        ]).map((item, i) => (
          <Surface
            key={i}
            variant="panel"
            hover
            onClick={() => navigate(item.link)}
            className="p-6 text-left group border-2 border-transparent hover:border-os-accent/30"
          >
            <div className={cn("w-12 h-12 rounded-os-sm mb-4 flex items-center justify-center group-hover:scale-105 transition-transform", item.bg)}>
              <item.icon className={cn("w-6 h-6", item.color)} />
            </div>
            <h3 className="font-bold text-os-lg mb-1">{item.label}</h3>
            <p className="text-os-sm text-os-text-secondary">{item.sub}</p>
          </Surface>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          {/* A. MY DEALS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-os-xl font-bold">{t('dashboard.my_active_deals')}</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-os-accent font-medium hover:bg-transparent">
                {t('dashboard.see_all_deals')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <Surface variant="panel" className="p-2 overflow-hidden">
              {tradesLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-os-stroke animate-pulse rounded-os-md" />)}
                </div>
              ) : activeTrades && activeTrades.length > 0 ? (
                <div className="divide-y divide-os-stroke">
                  {activeTrades.slice(0, 3).map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                      className="group flex items-center justify-between p-6 hover:bg-os-surface transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-os-md bg-os-bg border border-os-stroke flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Box className="w-7 h-7 text-os-text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-os-lg font-semibold">{trade.productName}</h3>
                          <div className="flex items-center gap-2 text-os-sm text-os-text-secondary">
                            <span className="text-amber-500 font-medium">{trade.status || t('dashboard.pending')}</span>
                            <span className="w-1 h-1 rounded-full bg-os-stroke" />
                            <span>{trade.corridor?.originCountry || '—'} to {trade.corridor?.destinationCountry || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-os-sm font-black tabular-nums font-mono">${(trade.value || 0).toLocaleString()}</div>
                          <div className="text-os-xs text-os-muted uppercase font-bold tracking-widest">{t('dashboard.deal_value')}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-os-text-secondary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Box className="w-16 h-16 text-os-text-secondary mx-auto mb-4" />
                  <h3 className="text-os-2xl font-bold mb-2">{t('dashboard.no_active_deals')}</h3>
                  <p className="text-gray-400 text-os-base mb-6">
                    {isSeller ? t('dashboard.no_active_deals_desc_seller') : t('dashboard.no_active_deals_desc_buyer')}
                  </p>
                  <Button
                    className="bg-os-accent hover:bg-os-accent/90 text-black font-bold rounded-os-sm px-8 h-12"
                    onClick={() => navigate('/dashboard/rfqs')}
                  >
                    {t('dashboard.browse_buy_requests')}
                  </Button>
                </div>
              )}
            </Surface>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* B. MY MONEY - Earnings Card */}
          <div className="space-y-6">
            <h2 className="text-os-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              {t('dashboard.my_money')}
            </h2>
            <Surface variant="glass" className="p-8 group relative overflow-hidden bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-3xl font-black font-mono">$0.00</div>
                  <div className="text-os-xs font-bold uppercase tracking-widest text-emerald-500">{t('dashboard.balance')}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-os-xs pb-3 border-b border-os-stroke">
                  <span className="text-os-text-secondary font-bold uppercase tracking-widest">{t('dashboard.in_escrow')}</span>
                  <span className="font-black text-os-text-primary tabular-nums font-mono">$0.00</span>
                </div>
                <div className="flex justify-between text-os-xs">
                  <span className="text-os-text-secondary font-bold uppercase tracking-widest">{t('dashboard.earn_hint')}</span>
                  <span className="font-black text-os-text-primary tabular-nums font-mono">—</span>
                </div>
              </div>
              <Button
                onClick={() => navigate('/dashboard/payments')}
                variant="outline"
                className="w-full mt-8 border-white/10 bg-white/5 hover:bg-white/10 rounded-os-md py-6 text-os-xs font-black uppercase tracking-widest"
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
