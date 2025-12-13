/**
 * Subscription Plans Page
 * Allows suppliers to view and upgrade their subscription
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { 
  getCompanySubscription, 
  createSubscription, 
  SUBSCRIPTION_PLANS,
  getPlanDetails 
} from '@/services/subscriptionService';

export default function SubscriptionsPage() {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!cid) {
        toast.error('Company not found');
        return;
      }
      
      setCompanyId(cid);
      const subscription = await getCompanySubscription(cid);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planType) => {
    if (!companyId) {
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

      await createSubscription(companyId, planType, paymentData);
      toast.success(`Successfully upgraded to ${SUBSCRIPTION_PLANS[planType].name}!`);
      await loadSubscription();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentPlan = currentSubscription?.plan_type || 'free';
  const planDetails = getPlanDetails(currentPlan);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
            Subscription Plans
          </h1>
          <p className="text-afrikoni-text-dark/70">
            Choose a plan that fits your business needs and boost your visibility
          </p>
        </div>

        {/* Current Plan Badge */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-afrikoni-text-dark/70">Current Plan</p>
                <p className="text-xl font-bold text-afrikoni-text-dark">
                  {planDetails.name} Plan
                </p>
                {currentSubscription.current_period_end && (
                  <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                    Renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">
                Active
              </Badge>
            </div>
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
                <Card className={`h-full flex flex-col ${
                  plan.id === 'elite' 
                    ? 'border-2 border-afrikoni-gold shadow-lg' 
                    : 'border-afrikoni-gold/20'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {plan.id === 'elite' && (
                        <Crown className="w-6 h-6 text-afrikoni-gold" />
                      )}
                      {plan.id === 'growth' && (
                        <Sparkles className="w-6 h-6 text-afrikoni-purple" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-afrikoni-text-dark">
                        ${plan.monthlyPrice}
                      </span>
                      <span className="text-afrikoni-text-dark/70">/month</span>
                    </div>
                    {plan.visibilityBoost > 0 && (
                      <p className="text-sm text-afrikoni-gold mt-2">
                        <Zap className="w-4 h-4 inline mr-1" />
                        {plan.visibilityBoost === 1.5 ? '50%' : '200%'} visibility boost
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-afrikoni-green flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-afrikoni-text-dark/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan || isUpgrading}
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-afrikoni-gold/20 text-afrikoni-text-dark cursor-not-allowed'
                          : plan.id === 'elite'
                          ? 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut'
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
                  </CardContent>
                </Card>
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
            className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 border border-afrikoni-gold/30 rounded-lg p-6"
          >
            <h3 className="text-lg font-bold text-afrikoni-text-dark mb-3">
              🚀 Upgrade to Increase Your Visibility
            </h3>
            <p className="text-afrikoni-text-dark/80 mb-4">
              Premium plans help your products rank higher in search results, get more RFQ matches, and close more deals.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-afrikoni-text-dark">AI-Powered Ranking</p>
                  <p className="text-sm text-afrikoni-text-dark/70">Get matched with more relevant buyers</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-afrikoni-text-dark">Featured Placement</p>
                  <p className="text-sm text-afrikoni-text-dark/70">Appear at the top of search results</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

