/**
 * Serious Mode Gate Component
 *
 * Gates premium actions (RFQ creation, messaging) behind Serious Mode subscription.
 * This ensures only committed users access value-creating features.
 *
 * Philosophy: "We only win when you win" - but we need to ensure users are serious
 * about trading to prevent spam, fraud, and platform abuse.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  Shield,
  CheckCircle,
  Zap,
  MessageSquare,
  FileText,
  TrendingUp,
  Lock,
  Star,
  Users
} from 'lucide-react';

// Serious Mode plans - matches pricing.js
const SERIOUS_MODE_PLANS = {
  FREE: {
    name: 'Afrikoni Free',
    price: 0,
    rfqLimit: 3,
    messageLimit: 10,
    features: [
      '3 RFQs per month',
      '10 messages per month',
      'Browse verified suppliers',
      'Basic protection'
    ]
  },
  PRO: {
    name: 'Afrikoni Pro',
    price: 29,
    rfqLimit: null, // unlimited
    messageLimit: null, // unlimited
    features: [
      'Unlimited RFQs',
      'Unlimited messaging',
      'Priority supplier matching',
      'Price intelligence'
    ],
    popular: true
  },
  BUSINESS: {
    name: 'Afrikoni Business',
    price: 99,
    rfqLimit: null,
    messageLimit: null,
    features: [
      'Everything in Pro',
      'Bulk RFQ management',
      'Dedicated account manager',
      'API access'
    ]
  }
};

/**
 * Check if user has Serious Mode active
 * TODO: Replace with actual subscription check once payment is integrated
 */
export function useSeriousModeStatus(userId, companyId) {
  // For now, return beta access for all users
  // This will be replaced with actual subscription check
  const [status, setStatus] = React.useState({
    isActive: true, // Beta: Allow all users
    tier: 'FREE',
    rfqQuota: 3,
    rfqUsed: 0,
    messageQuota: 10,
    messagesUsed: 0,
    isBetaAccess: true // Flag to show this is beta access
  });

  // TODO: Implement actual subscription check
  // React.useEffect(() => {
  //   if (!userId || !companyId) return;
  //
  //   const checkSubscription = async () => {
  //     const { data, error } = await supabase
  //       .from('serious_mode_subscriptions')
  //       .select('*')
  //       .eq('company_id', companyId)
  //       .eq('status', 'active')
  //       .single();
  //
  //     if (data) {
  //       setStatus({
  //         isActive: true,
  //         tier: data.tier,
  //         rfqQuota: data.rfq_quota,
  //         rfqUsed: data.rfq_used,
  //         messageQuota: data.message_quota,
  //         messagesUsed: data.messages_used,
  //         isBetaAccess: false
  //       });
  //     }
  //   };
  //
  //   checkSubscription();
  // }, [userId, companyId]);

  return status;
}

/**
 * Serious Mode Gate Component
 * Shows upgrade prompt when user doesn't have required access
 */
export default function SeriousModeGate({
  children,
  requiredAction = 'rfq', // 'rfq' | 'message' | 'contact'
  userId,
  companyId,
  onBypass // Optional callback for beta bypass
}) {
  const status = useSeriousModeStatus(userId, companyId);

  // If user has active Serious Mode, show the content
  if (status.isActive) {
    // Show beta notice if applicable
    if (status.isBetaAccess) {
      return (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-purple/10 border border-afrikoni-gold/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-afrikoni-gold" />
                <span className="text-sm text-afrikoni-chestnut font-medium">
                  Beta Access: You have free access during our launch period
                </span>
              </div>
              <Badge className="bg-afrikoni-gold/20 text-afrikoni-chestnut text-xs">
                {status.tier === 'FREE' ? `${status.rfqQuota - status.rfqUsed} RFQs left` : 'Unlimited'}
              </Badge>
            </div>
          </motion.div>
          {children}
        </>
      );
    }
    return children;
  }

  // Show upgrade prompt
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto py-8"
    >
      <Card className="border-2 border-afrikoni-gold/30 shadow-xl overflow-hidden">
        {/* Decorative Header */}
        <div className="bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-chestnut to-afrikoni-deep p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Serious Mode Required</h2>
              <p className="text-afrikoni-cream/80 text-sm">
                Unlock this feature to start trading
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Why We Gate */}
          <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                  Why do we require this?
                </h3>
                <p className="text-sm text-afrikoni-deep/80">
                  Serious Mode ensures our marketplace stays spam-free and trustworthy.
                  It helps us match you with verified suppliers who are ready to do business.
                  Your small investment shows suppliers you're a committed buyer.
                </p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <h3 className="font-bold text-afrikoni-chestnut mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-afrikoni-gold" />
            Choose Your Plan
          </h3>

          <div className="space-y-3 mb-6">
            {Object.entries(SERIOUS_MODE_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  plan.popular
                    ? 'border-afrikoni-gold bg-afrikoni-gold/5'
                    : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-afrikoni-chestnut">{plan.name}</span>
                    {plan.popular && (
                      <Badge className="bg-afrikoni-gold text-white text-xs">
                        Best Value
                      </Badge>
                    )}
                  </div>
                  <span className="text-xl font-bold text-afrikoni-chestnut">
                    {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1 text-sm text-afrikoni-deep/80">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link to="/pricing?plan=pro" className="block">
              <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white font-bold py-6">
                <Zap className="w-5 h-5 mr-2" />
                Unlock Serious Mode — Start at $29/month
              </Button>
            </Link>

            <Link to="/pricing" className="block">
              <Button
                variant="outline"
                className="w-full border-afrikoni-gold/40 hover:bg-afrikoni-gold/10"
              >
                Compare All Plans
              </Button>
            </Link>
          </div>

          {/* Trust Message */}
          <div className="mt-6 pt-6 border-t border-afrikoni-gold/20 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-afrikoni-deep/70">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                Secure Payment
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Cancel Anytime
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-green-600" />
                1000+ Active Traders
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Higher-order component to wrap pages with Serious Mode gate
 */
export function withSeriousModeGate(Component, requiredAction = 'rfq') {
  return function SeriousModeGatedComponent(props) {
    return (
      <SeriousModeGate
        requiredAction={requiredAction}
        userId={props.userId}
        companyId={props.companyId}
      >
        <Component {...props} />
      </SeriousModeGate>
    );
  };
}
