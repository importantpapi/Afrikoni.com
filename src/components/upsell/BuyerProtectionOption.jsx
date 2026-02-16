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
        ? 'border-os-accent bg-os-accent/5' 
        : 'border-os-accent/20 hover:border-os-accent/40'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-5 h-5 ${isEnabled ? 'text-os-accent' : 'text-afrikoni-text-dark/60'}`} />
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
            <p className="text-os-sm text-afrikoni-text-dark/70 mb-3">
              Add quality inspection guarantee for extra protection. Afrikoni will verify product quality before delivery.
            </p>
            <div className="space-y-1 text-os-sm">
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
              <p className="text-os-xs text-afrikoni-text-dark/70">Additional Fee</p>
              <p className="text-os-lg font-bold text-os-accent">
                +{currency} {protectionFee.toFixed(2)}
              </p>
              <p className="text-os-xs text-afrikoni-text-dark/60">
                ({protectionFeePercent}% of order value)
              </p>
            </div>
            <Button
              onClick={() => onToggle(!isEnabled)}
              variant={isEnabled ? "outline" : "default"}
              size="sm"
              className={isEnabled 
                ? "border-os-accent text-os-accent hover:bg-os-accent/10"
                : "bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut"
              }
            >
              {isEnabled ? 'Remove' : 'Add Protection'}
            </Button>
          </div>
        </div>
        {isEnabled && (
          <div className="mt-4 pt-4 border-t border-os-accent/20">
            <div className="flex justify-between items-center">
              <span className="text-os-sm font-semibold text-afrikoni-text-dark">Total with Protection:</span>
              <span className="text-os-xl font-bold text-afrikoni-green">
                {currency} {totalWithProtection.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

