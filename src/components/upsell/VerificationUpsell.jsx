/**
 * Verification Upsell Component
 * Prompts suppliers to get verified
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

export default function VerificationUpsell({
  isVerified = false,
  variant = 'card' // 'card', 'banner'
}) {
  if (isVerified) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 border border-afrikoni-gold/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-afrikoni-gold" />
            <div>
              <h4 className="font-bold text-afrikoni-text-dark">
                Become a Verified Supplier
              </h4>
              <p className="text-sm text-afrikoni-text-dark/70">
                Get verified and unlock more buyers. Fast-track available for $99.
              </p>
            </div>
          </div>
          <Link to="/dashboard/verification-marketplace">
            <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
              Get Verified
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-afrikoni-gold" />
            <h3 className="text-lg font-bold text-afrikoni-text-dark">
              Get Verified Today
            </h3>
          </div>
          <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">
            $99 Fast-Track
          </Badge>
        </div>

        <p className="text-sm text-afrikoni-text-dark/70 mb-4">
          Verified suppliers get 3x more buyer inquiries and appear first in search results.
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/80">
            <CheckCircle className="w-4 h-4 text-afrikoni-green" />
            <span>Higher visibility in search</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/80">
            <CheckCircle className="w-4 h-4 text-afrikoni-green" />
            <span>Trust badge on profile</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-afrikoni-text-dark/80">
            <CheckCircle className="w-4 h-4 text-afrikoni-green" />
            <span>Priority buyer matching</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/dashboard/verification-marketplace" className="flex-1">
            <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
              Fast-Track ($99)
            </Button>
          </Link>
          <Link to="/dashboard/verification-center" className="flex-1">
            <Button variant="outline" className="w-full border-afrikoni-gold/30 text-afrikoni-gold">
              Free Option
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

