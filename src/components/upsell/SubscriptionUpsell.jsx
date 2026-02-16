/**
 * Subscription Upsell Component
 * Shows upgrade prompts throughout the platform
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Crown, ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

export default function SubscriptionUpsell({ 
  currentPlan = 'free',
  variant = 'card', // 'card', 'banner', 'inline'
  placement = 'products' // 'products', 'rfqs', 'analytics'
}) {
  const isFree = currentPlan === 'free';
  const isGrowth = currentPlan === 'growth';

  if (!isFree && !isGrowth) {
    return null; // Already on Elite
  }

  const upgradeTarget = isFree ? 'growth' : 'elite';
  const upgradePrice = isFree ? 49 : 199;
  const upgradeName = isFree ? 'Growth' : 'Elite';

  const benefits = isFree 
    ? [
        'AI Boost in search results',
        'Unlimited products',
        'Priority RFQ matching',
        'Advanced analytics'
      ]
    : [
        'Featured listing placement',
        'Top supplier badge',
        'Priority support',
        'Custom branding'
      ];

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-os-accent/10 to-afrikoni-purple/10 border border-os-accent/30 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-os-accent" />
            <div>
              <h4 className="font-bold text-afrikoni-text-dark">
                Upgrade to {upgradeName} Plan
              </h4>
              <p className="text-os-sm text-afrikoni-text-dark/70">
                {isFree ? 'Boost your visibility' : 'Get featured placement'} and close more deals
              </p>
            </div>
          </div>
          <Link to="/dashboard/subscriptions">
            <Button size="sm" className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut">
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="text-center py-4 border-t border-os-accent/20 mt-4">
        <p className="text-os-sm text-afrikoni-text-dark/70 mb-2">
          <Zap className="w-4 h-4 inline mr-1 text-os-accent" />
          Upgrade to {upgradeName} for better visibility
        </p>
        <Link to="/dashboard/subscriptions">
          <Button variant="outline" size="sm" className="border-os-accent/30 text-os-accent">
            View Plans
          </Button>
        </Link>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className="border-2 border-os-accent/30 bg-gradient-to-br from-os-accent/5 to-afrikoni-purple/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isGrowth ? (
                <Crown className="w-6 h-6 text-os-accent" />
              ) : (
                <Sparkles className="w-6 h-6 text-os-accent" />
              )}
              <h3 className="text-os-lg font-bold text-afrikoni-text-dark">
                Upgrade to {upgradeName}
              </h3>
            </div>
            <p className="text-os-sm text-afrikoni-text-dark/70">
              {isFree 
                ? 'Increase your visibility and get more buyer inquiries'
                : 'Get featured placement and unlock premium features'
              }
            </p>
          </div>
          <Badge className="bg-os-accent text-afrikoni-chestnut">
            ${upgradePrice}/mo
          </Badge>
        </div>
        
        <ul className="space-y-2 mb-4">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center gap-2 text-os-sm text-afrikoni-text-dark/80">
              <Zap className="w-4 h-4 text-os-accent" />
              {benefit}
            </li>
          ))}
        </ul>
        
        <Link to="/dashboard/subscriptions">
          <Button className="w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut">
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

