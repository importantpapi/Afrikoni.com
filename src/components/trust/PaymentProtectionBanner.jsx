import React from 'react';
import { Shield, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Payment Protection Banner
 * Surfaces escrow protection at key decision moments
 * Reduces buyer hesitation and increases deal confidence
 */

export function PaymentProtectionBanner({ 
  variant = 'default', // 'default' | 'compact' | 'inline'
  showCTA = true,
  className = ''
}) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 ${className}`}>
        <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-green-800">
            Escrow-protected transaction
          </p>
          <p className="text-xs text-green-700">
            Payment held securely until delivery confirmed
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-2 text-xs text-afrikoni-deep/70 ${className}`}>
        <Shield className="w-4 h-4 text-afrikoni-gold flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-afrikoni-chestnut">Afrikoni Trade Shield:</strong> Payment held in escrow until you confirm delivery. 
          {' '}<Link to="/escrow-policy" className="text-afrikoni-gold hover:underline">Learn more</Link>
        </p>
      </div>
    );
  }

  return (
    <Card className={`border-green-200 bg-gradient-to-br from-green-50 to-white ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-green-100">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-afrikoni-chestnut mb-2 flex items-center gap-2">
              Protected by Afrikoni Trade Shield
              <Lock className="w-4 h-4 text-green-600" />
            </h3>
            <p className="text-sm text-afrikoni-deep/80 mb-4">
              Your payment is held securely in escrow and only released to the supplier after you confirm delivery and quality. If there's an issue, our dispute resolution team ensures fair outcomes.
            </p>
            
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-afrikoni-chestnut">Secure Escrow</p>
                  <p className="text-xs text-afrikoni-deep/60">Funds held safely</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-afrikoni-chestnut">Delivery Confirmation</p>
                  <p className="text-xs text-afrikoni-deep/60">You control release</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-afrikoni-chestnut">Dispute Resolution</p>
                  <p className="text-xs text-afrikoni-deep/60">Fair mediation</p>
                </div>
              </div>
            </div>

            {showCTA && (
              <Link to="/escrow-policy">
                <Button variant="outline" size="sm" className="text-xs">
                  How Payment Protection Works
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mini version for product cards and quotes
 */
export function PaymentProtectionBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
      <Shield className="w-3 h-3" />
      <span>Escrow Protected</span>
    </div>
  );
}

