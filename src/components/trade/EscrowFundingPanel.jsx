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
    if (!escrow || !paymentIntentId) return;

    setProcessing(true);
    setError(null);

    try {
      // In real implementation with Stripe.js loaded,
      // we would call stripe.confirmCardPayment here
      // For now, we simulate successful payment and call webhook manually

      // In production: For demo purposes, manually trigger the success flow
      // Real flow: Stripe.js handles payment confirmation and webhook triggers
      const result = await fundEscrow({
        escrowId: escrow.id,
        stripePaymentIntentId: paymentIntentId,
        paymentMethod: 'stripe'
      });

      if (result.success) {
        setEscrow(result.escrow);
        // Transition to next state
        await onNextStep(TRADE_STATE.ESCROW_FUNDED, {
          escrowId: escrow.id
        });
      } else {
        setError(result.error || 'Payment confirmation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-sm mt-2">Loading escrow details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!escrow) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6">
          <p className="font-semibold">Escrow not initialized</p>
          <p className="text-sm mt-1">Contact support if this persists.</p>
        </CardContent>
      </Card>
    );
  }

  const isFunded = escrow.status === 'funded';
  const complianceBlocked = compliance && compliance.compliant === false;

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {isFunded ? 'Escrow Funded' : 'Fund Escrow'}
          </h2>
          <p className="text-sm mt-1">
            {isFunded
              ? 'Escrow is secured. Supplier can now begin production.'
              : 'Secure payment to lock in the trade and allow production to begin.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Payment Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isFunded ? (
          <>
            {/* Compliance Gate */}
            <div className={`mb-6 p-4 rounded-xl border ${complianceBlocked ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <p className={`text-sm font-semibold ${complianceBlocked ? 'text-red-100' : 'text-emerald-100'}`}>
                Compliance Gate
              </p>
              {complianceLoading ? (
                <p className="text-xs mt-1">Validating required documents...</p>
              ) : complianceBlocked ? (
                <div className="text-xs mt-2">
                  <p>Missing required documents. Escrow is locked until completion.</p>
                  {Array.isArray(compliance?.missingDocuments) && compliance.missingDocuments.length > 0 && (
                    <ul className="mt-2 list-disc list-inside">
                      {compliance.missingDocuments.slice(0, 4).map((doc) => (
                        <li key={doc}>{doc.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-xs mt-1">Compliance verified. Escrow can be funded.</p>
              )}
            </div>

            {/* Escrow Amount Display */}
            <div className="border rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Escrow Amount</p>
                  <p className="text-3xl font-bold mt-1">
                    {escrow.currency} {escrow.amount?.toLocaleString()}
                  </p>
                </div>
                <Lock className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-xs mt-3">
                This amount will be held in escrow until all delivery conditions are met.
              </p>
            </div>

            {/* Security Promises */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-semibold">
                Your money is protected:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="">✓</span>
                  <span className="">Only released after delivery confirmation</span>
                </li>
                <li className="flex gap-2">
                  <span className="">✓</span>
                  <span className="">Full refund if you reject delivery</span>
                </li>
                <li className="flex gap-2">
                  <span className="">✓</span>
                  <span className="">Dispute resolution available</span>
                </li>
              </ul>
            </div>

            {!paymentShown ? (
              <>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">
                    Payment Method
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: 'card', label: 'Credit Card', description: 'Visa, Mastercard, Amex' },
                      { id: 'bank', label: 'Bank Transfer', description: 'Direct bank payment' },
                      { id: 'crypto', label: 'Cryptocurrency', description: 'USDC, USDT' }
                    ].map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-white/5">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {method.label}
                          </p>
                          <p className="text-xs">{method.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fund Button */}
                <Button
                  onClick={handleInitiatePayment}
                  disabled={processing || isTransitioning || complianceBlocked}
                  className="w-full hover:bg-afrikoni-gold/90 font-semibold"
                >
                  {processing || isTransitioning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing Payment...</>
                  ) : (
                    <><DollarSign className="w-4 h-4 mr-2" /> Proceed to Payment</>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Stripe Payment Form - Will be rendered by @stripe/react-stripe-js when available */}
                <div className="mb-6 p-6 border rounded-xl">
                  <p className="text-sm font-semibold mb-4">
                    Payment Details
                  </p>
                  <p className="text-sm mb-4">
                    {paymentMethod === 'card' && 'Enter your credit card details below'}
                    {paymentMethod === 'bank' && 'Complete bank transfer using the details provided'}
                    {paymentMethod === 'crypto' && 'Send USDC/USDT to the wallet address shown'}
                  </p>

                  {/* Stripe Elements will be mounted here when @stripe/react-stripe-js is available */}
                  <div id="stripe-card-element" className="min-h-12 p-3 border rounded-lg">
                    {/* Stripe.js Elements component will render here */}
                    <p className="text-xs">Card element will load when Stripe.js is available</p>
                  </div>

                  <p className="text-xs mt-3">
                    Your card details are encrypted and only processed by Stripe.
                  </p>
                </div>

                {/* Confirm Payment Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPaymentShown(false)}
                    disabled={processing}
                    variant="outline"
                    className="flex-1 hover:bg-white/5"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={processing || isTransitioning || !capabilities?.can_buy}
                    className="flex-1 hover:bg-afrikoni-gold/90 font-semibold"
                  >
                    {processing || isTransitioning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <>Confirm & Pay {escrow.currency} {escrow.amount?.toLocaleString()}</>
                    )}
                  </Button>
                </div>
                {!capabilities?.can_buy && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 mt-4">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] text-amber-200">Buyer capabilities required to fund escrow.</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-semibold">
              Payment Secured
            </p>
            <p className="text-sm mt-2">
              Funded on {new Date(escrow.funded_at).toLocaleDateString()}
            </p>
            <Badge className="mt-4 border">
              Awaiting Production Start
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
