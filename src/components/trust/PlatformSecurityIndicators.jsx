import React from 'react';
import { Shield, Lock, CheckCircle2, Globe, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Platform Security & Trust Indicators
 * Surfaces institutional credibility signals at key moments
 * Reduces first-time buyer/supplier anxiety
 */

export function PlatformSecurityIndicators({ variant = 'full', className = '' }) {
  const indicators = [
    {
      icon: Shield,
      label: '256-bit SSL',
      description: 'Bank-grade encryption',
      color: 'green'
    },
    {
      icon: CheckCircle2,
      label: 'Manual Verification',
      description: 'All suppliers reviewed by humans',
      color: 'blue'
    },
    {
      icon: Lock,
      label: 'Escrow Protection',
      description: 'Payments held securely',
      color: 'green'
    },
    {
      icon: Globe,
      label: '54 Countries',
      description: 'Pan-African coverage',
      color: 'amber'
    },
    {
      icon: Users,
      label: 'Human Support',
      description: 'Real team behind every trade',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Fair Trade',
      description: 'Transparent pricing & terms',
      color: 'amber'
    }
  ];

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-4 text-xs text-afrikoni-deep/60 ${className}`}>
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-green-600" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-blue-600" />
          <span>Verified Platform</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-amber-600" />
          <span>Human Support</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-3 gap-3 ${className}`}>
        {indicators.slice(0, 3).map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-afrikoni-gold/20">
              <Icon className={`w-4 h-4 text-${item.color}-600 flex-shrink-0`} />
              <div>
                <p className="text-xs font-medium text-afrikoni-chestnut">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={`border-afrikoni-gold/30 bg-gradient-to-br from-white to-amber-50 ${className}`}>
      <CardContent className="p-6">
        <h3 className="font-semibold text-afrikoni-chestnut mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-afrikoni-gold" />
          Why Afrikoni is Trusted
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {indicators.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-${item.color}-100 flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${item.color}-600`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-afrikoni-chestnut">{item.label}</p>
                  <p className="text-xs text-afrikoni-deep/60 mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-afrikoni-deep/50 mt-4 pt-4 border-t border-afrikoni-gold/20 italic">
          Afrikoni is built for institutional-grade B2B trade. Every transaction is reviewed, every supplier is vetted, and every payment is protected.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Footer trust badges (for homepage/public pages)
 */
export function TrustBadgesFooter() {
  return (
    <div className="flex items-center justify-center gap-6 py-6 border-t border-afrikoni-gold/20">
      <div className="flex items-center gap-2 text-xs text-afrikoni-deep/60">
        <Lock className="w-4 h-4 text-green-600" />
        <span className="font-medium">256-bit SSL Encryption</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-afrikoni-deep/60">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="font-medium">Verified Platform</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-afrikoni-deep/60">
        <CheckCircle2 className="w-4 h-4 text-amber-600" />
        <span className="font-medium">ISO Standards</span>
      </div>
    </div>
  );
}

