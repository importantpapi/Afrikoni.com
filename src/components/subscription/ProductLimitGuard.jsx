/**
 * Product Limit Guard Component
 * Shows upgrade prompt when product limit is reached
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { X, Crown, Zap, ArrowRight, Package, CheckCircle } from 'lucide-react';
import { checkProductLimit } from '@/utils/subscriptionLimits';
import { SUBSCRIPTION_PLANS } from '@/services/subscriptionService';
import { toast } from 'sonner';

export default function ProductLimitGuard({ companyId, onUpgrade, variant = 'modal' }) {
  const navigate = useNavigate();
  const [limitInfo, setLimitInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadLimitInfo();
  }, [companyId]);

  const loadLimitInfo = async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      const info = await checkProductLimit(companyId);
      setLimitInfo(info);
      
      // Auto-show if limit reached
      if (!info.canAdd && info.needsUpgrade) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error loading limit info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !limitInfo) {
    return null;
  }

  // Don't show if they can add products
  if (limitInfo.canAdd) {
    return null;
  }

  // Don't show if closed
  if (!isOpen) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[limitInfo.planType] || SUBSCRIPTION_PLANS.free;
  const upgradePlan = limitInfo.planType === 'free' ? SUBSCRIPTION_PLANS.growth : SUBSCRIPTION_PLANS.elite;
  const upgradePrice = limitInfo.planType === 'free' ? 49 : 199;

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-afrikoni-chestnut mb-1">
                      Product Limit Reached
                    </h3>
                    <p className="text-sm text-afrikoni-text-dark/80">
                      You've used all {limitInfo.limit} products on your {plan.name} plan. Upgrade to {upgradePlan.name} for unlimited products.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {upgradePlan.features.slice(0, 3).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white/50 border-afrikoni-gold/30 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (onUpgrade) {
                      onUpgrade();
                    } else {
                      navigate('/dashboard/subscriptions');
                    }
                  }}
                  className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg px-6"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to {upgradePlan.name}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Modal variant (default)
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-2 border-afrikoni-gold shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-afrikoni-gold to-afrikoni-purple rounded-2xl flex items-center justify-center shadow-lg">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-1">
                        Product Limit Reached
                      </h2>
                      <p className="text-afrikoni-text-dark/70">
                        Upgrade to add more products
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mb-6 p-4 bg-afrikoni-cream/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-afrikoni-text-dark">Current Usage</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {limitInfo.currentCount} / {limitInfo.limit === Infinity ? '∞' : limitInfo.limit} products
                    </Badge>
                  </div>
                  <div className="w-full bg-afrikoni-sand/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-afrikoni-gold h-full transition-all"
                      style={{ width: `${Math.min(100, (limitInfo.currentCount / (limitInfo.limit || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 border border-afrikoni-gold/20 rounded-xl bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-afrikoni-gold" />
                      <h3 className="font-semibold text-afrikoni-chestnut">Current Plan: {plan.name}</h3>
                    </div>
                    <ul className="text-sm text-afrikoni-text-dark/70 space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 border-2 border-afrikoni-gold rounded-xl bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-purple/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-afrikoni-gold" />
                      <h3 className="font-semibold text-afrikoni-chestnut">Upgrade to {upgradePlan.name}</h3>
                    </div>
                    <ul className="text-sm text-afrikoni-text-dark/80 space-y-1 mb-3">
                      {upgradePlan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-afrikoni-gold" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="text-2xl font-bold text-afrikoni-chestnut">
                      ${upgradePrice}<span className="text-sm font-normal text-afrikoni-text-dark/70">/month</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link to="/dashboard/subscriptions" className="flex-1">
                    <Button
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg h-12 text-base font-semibold"
                      onClick={() => {
                        if (onUpgrade) onUpgrade();
                      }}
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Upgrade Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="px-6"
                  >
                    Maybe Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

