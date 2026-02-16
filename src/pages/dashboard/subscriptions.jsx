/**
 * Subscription Plans Page
 * Allows suppliers to view and upgrade their subscription
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, ArrowRight } from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { 
  getCompanySubscription, 
  createSubscription, 
  SUBSCRIPTION_PLANS,
  getPlanDetails 
} from '@/services/subscriptionService';
import RequireCapability from '@/guards/RequireCapability';
import { Surface } from '@/components/system/Surface';

function SubscriptionsPageInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const abortControllerRef = useRef(null);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading subscriptions..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    toast.error('Please log in to continue');
    return null;
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate (first line)
    if (!canLoadData || !profileCompanyId) {
      return;
    }

    loadSubscription();

    // ✅ KERNEL MANIFESTO: Finally Law - Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [canLoadData, profileCompanyId]);

  const loadSubscription = async () => {
    // ✅ KERNEL MANIFESTO: Rule 4 - Zombie Protection (AbortController)
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;
    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    try {
      setIsLoading(true);
      setError(null);
      
      if (abortSignal.aborted) return;
      
      // ✅ KERNEL MIGRATION: Use profileCompanyId directly from Kernel
      const subscription = await getCompanySubscription(profileCompanyId);
      
      if (abortSignal.aborted) return;
      setCurrentSubscription(subscription);
    } catch (error) {
      if (abortSignal.aborted) return;
      console.error('Error loading subscription:', error);
      setError(error.message || 'Failed to load subscription');
      toast.error('Failed to load subscription');
    } finally {
      // ✅ KERNEL MANIFESTO: Finally Law
      clearTimeout(timeoutId);
      if (!abortSignal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleUpgrade = async (planType) => {
    if (!profileCompanyId) {
      toast.error('Company not found');
      return;
    }

    if (planType === 'free') {
      toast.info('You are already on the Free plan');
      return;
    }

    setIsUpgrading(true);
    try {
      // In production, this would integrate with Stripe/PayPal
      // For now, we'll simulate the payment
      const paymentData = {
        method: 'stripe',
        paymentId: `mock_${Date.now()}`
      };

      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      await createSubscription(profileCompanyId, planType, paymentData);
      toast.success(`Successfully upgraded to ${SUBSCRIPTION_PLANS[planType].name}!`);
      await loadSubscription();
    } catch (err) {
      console.error('[SubscriptionsPage] Error upgrading subscription:', err);
      toast.error('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentPlan = currentSubscription?.plan_type || 'free';
  const planDetails = getPlanDetails(currentPlan);

  // ✅ KERNEL MANIFESTO: Rule 5 - Three-State UI (Error BEFORE Loading)
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          loadSubscription();
        }}
      />
    );
  }

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  return (
    <div className="os-page os-stagger space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[var(--os-text-primary)] mb-2">
          Subscription Plans
        </h1>
        <p className="text-[var(--os-text-secondary)]">
          Choose a plan that fits your business needs and boost your visibility
        </p>
      </div>

      {/* Current Plan Badge */}
      {currentSubscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Surface variant="soft" className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-os-sm text-[var(--os-text-secondary)]">Current Plan</p>
                <p className="text-os-xl font-semibold text-[var(--os-text-primary)]">
                  {planDetails.name} Plan
                </p>
                {currentSubscription.current_period_end && (
                  <p className="text-os-xs text-[var(--os-text-secondary)] mt-1">
                    Renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge className="">
                Active
              </Badge>
            </div>
          </Surface>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isUpgrade = plan.monthlyPrice > (planDetails.monthlyPrice || 0);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Surface className={`h-full flex flex-col p-5 ${
                  plan.id === 'elite' 
                    ? 'border-2 border-os-accent shadow-os-md' 
                    : 'border border-white/10'
                }`}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-os-xl font-semibold text-[var(--os-text-primary)]">{plan.name}</h3>
                      {plan.id === 'elite' && (
                        <Crown className="w-6 h-6" />
                      )}
                      {plan.id === 'growth' && (
                        <Sparkles className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold text-[var(--os-text-primary)]">
                        ${plan.monthlyPrice}
                      </span>
                      <span className="text-[var(--os-text-secondary)]">/month</span>
                    </div>
                    {plan.visibilityBoost > 0 && (
                      <p className="text-os-sm mt-2">
                        <Zap className="w-4 h-4 inline mr-1" />
                        {plan.visibilityBoost === 1.5 ? '50%' : '200%'} visibility boost
                      </p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span className="text-os-sm text-[var(--os-text-secondary)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan || isUpgrading}
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-os-accent/20 text-afrikoni-text-dark cursor-not-allowed'
                          : plan.id === 'elite'
                          ? 'bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut'
                          : 'bg-afrikoni-purple hover:bg-afrikoni-purple/90 text-white'
                      }`}
                    >
                      {isCurrentPlan ? (
                        'Current Plan'
                      ) : isUpgrade ? (
                        <>
                          Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Select Plan'
                      )}
                    </Button>
                  </div>
                </Surface>
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade Benefits */}
        {currentPlan === 'free' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Surface variant="soft" className="p-6 bg-gradient-to-r border">
              <h3 className="text-os-lg font-semibold text-[var(--os-text-primary)] mb-3">
              🚀 Upgrade to Increase Your Visibility
              </h3>
              <p className="text-[var(--os-text-secondary)] mb-4">
              Premium plans help your products rank higher in search results, get more RFQ matches, and close more deals.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--os-text-primary)]">AI-Powered Ranking</p>
                    <p className="text-os-sm text-[var(--os-text-secondary)]">Get matched with more relevant buyers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--os-text-primary)]">Featured Placement</p>
                    <p className="text-os-sm text-[var(--os-text-secondary)]">Appear at the top of search results</p>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>
        )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <>
      {/* PHASE 5B: Subscriptions requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <SubscriptionsPageInner />
      </RequireCapability>
    </>
  );
}
