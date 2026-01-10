/**
 * Buyer Protection Fee Option Component
 * Shows +2% premium option for quality inspection guarantee
 */

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

export default function BuyerProtectionOption({ 
  orderAmount, 
  currency = 'USD',
  onToggle,
  isEnabled = false 
}) {
  const protectionFeePercent = 2;
  const protectionFee = (orderAmount * protectionFeePercent) / 100;
  const totalWithProtection = orderAmount + protectionFee;

  return (
    <Card className={`border-2 transition-all ${
      isEnabled 
        ? 'border-afrikoni-gold bg-afrikoni-gold/5' 
        : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-5 h-5 ${isEnabled ? 'text-afrikoni-gold' : 'text-afrikoni-text-dark/60'}`} />
              <h4 className="font-semibold text-afrikoni-text-dark">
                Afrikoni Trade Inspection
              </h4>
              {isEnabled && (
                <Badge className="bg-afrikoni-green text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
            <p className="text-sm text-afrikoni-text-dark/70 mb-3">
              Add quality inspection guarantee for extra protection. Afrikoni will verify product quality before delivery.
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-afrikoni-text-dark/80">
                <CheckCircle className="w-4 h-4 text-afrikoni-green" />
                <span>Pre-shipment quality inspection</span>
              </div>
              <div className="flex items-center gap-2 text-afrikoni-text-dark/80">
                <CheckCircle className="w-4 h-4 text-afrikoni-green" />
                <span>Verified product specifications</span>
              </div>
              <div className="flex items-center gap-2 text-afrikoni-text-dark/80">
                <CheckCircle className="w-4 h-4 text-afrikoni-green" />
                <span>Guaranteed quality assurance</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-xs text-afrikoni-text-dark/70">Additional Fee</p>
              <p className="text-lg font-bold text-afrikoni-gold">
                +{currency} {protectionFee.toFixed(2)}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60">
                ({protectionFeePercent}% of order value)
              </p>
            </div>
            <Button
              onClick={() => onToggle(!isEnabled)}
              variant={isEnabled ? "outline" : "default"}
              size="sm"
              className={isEnabled 
                ? "border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
                : "bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
              }
            >
              {isEnabled ? 'Remove' : 'Add Protection'}
            </Button>
          </div>
        </div>
        {isEnabled && (
          <div className="mt-4 pt-4 border-t border-afrikoni-gold/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-afrikoni-text-dark">Total with Protection:</span>
              <span className="text-xl font-bold text-afrikoni-green">
                {currency} {totalWithProtection.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

