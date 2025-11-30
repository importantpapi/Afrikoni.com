import React from 'react';
import { Badge } from '../badge';
import { Shield, CheckCircle, Star, Zap, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Trust Badges Component
 * Displays verification, trust score, and other trust indicators
 */
export const TrustBadges = React.memo(function TrustBadges({
  verified = false,
  trustScore = null,
  fastResponse = false,
  readyToShip = false,
  premium = false,
  className = ''
}) {
  const badges = [];

  if (verified) {
    badges.push({
      key: 'verified',
      label: 'Verified',
      icon: Shield,
      variant: 'verified',
      className: 'bg-green-600 text-white'
    });
  }

  if (trustScore && trustScore > 0) {
    badges.push({
      key: 'trust',
      label: `Trust: ${trustScore}%`,
      icon: Star,
      variant: 'outline',
      className: 'bg-afrikoni-cream text-afrikoni-deep'
    });
  }

  if (fastResponse) {
    badges.push({
      key: 'fast',
      label: 'Fast Response',
      icon: Zap,
      variant: 'outline',
      className: 'bg-afrikoni-gold/20 text-afrikoni-gold'
    });
  }

  if (readyToShip) {
    badges.push({
      key: 'ready',
      label: 'Ready to Ship',
      icon: Truck,
      variant: 'outline',
      className: 'bg-afrikoni-gold/20 text-afrikoni-gold'
    });
  }

  if (premium) {
    badges.push({
      key: 'premium',
      label: 'Premium',
      icon: CheckCircle,
      variant: 'premium',
      className: 'bg-afrikoni-gold text-afrikoni-chestnut'
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <Badge
            key={badge.key}
            variant={badge.variant}
            className={cn('flex items-center gap-1 text-xs', badge.className)}
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
});

TrustBadges.displayName = 'TrustBadges';

