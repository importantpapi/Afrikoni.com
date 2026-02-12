/**
 * Escrow Funding Panel
 * State: ESCROW_REQUIRED → ESCROW_FUNDED
 * 
 * ⚠️ STUBBED: Payment gateway integration pending
 * Shows placeholder UI until payment integration is funded
 * Allows bypass for testing purposes
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Lock, AlertTriangle } from 'lucide-react';
import { TRADE_STATE } from '@/services/tradeKernel';

export default function EscrowFundingPanel({ trade, onNextStep, isTransitioning, capabilities, profile }) {
  // SURGICAL FIX: Stub payment flows until gateway is integrated
  const [showPlaceholder] = useState(true);

  if (showPlaceholder) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-afrikoni-gold/50" />
            <h3 className="text-xl font-semibold mb-2">Payment Integration Coming Soon</h3>
            <p className="text-sm text-afrikoni-deep/70 mb-6 max-w-md mx-auto">
              Secure escrow payments will be available once our payment gateway integration is complete. 
              In the meantime, you can continue coordinating with the seller directly.
            </p>
            
            <div className="bg-afrikoni-gold/10 p-4 rounded-lg mb-6">
              <p className="text-xs font-medium mb-2 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alternative Payment Options:
              </p>
              <ul className="text-xs text-left space-y-1 max-w-xs mx-auto">
                <li>• Bank transfer (coordinate with seller)</li>
                <li>• Letter of Credit (for large orders)</li>
                <li>• Cash on Delivery (if applicable)</li>
                <li>• Direct payment to seller account</li>
              </ul>
            </div>
            
            {/* Bypass button for testing/demo mode */}
            <Button
              onClick={() => onNextStep(TRADE_STATE.ESCROW_FUNDED, { 
                escrow_bypassed: true,
                bypass_reason: 'payment_gateway_pending',
                timestamp: new Date().toISOString()
              })}
              variant="outline"
              className="mt-4 hover:bg-afrikoni-gold/10"
              disabled={!capabilities?.can_buy || isTransitioning}
            >
              Continue Without Payment (Demo Mode)
            </Button>
            
            <p className="text-xs text-afrikoni-deep/50 mt-4">
              Payment processing will be enabled once gateway integration is complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original escrow panel code removed (payment gateway not funded)
  return null;
}
