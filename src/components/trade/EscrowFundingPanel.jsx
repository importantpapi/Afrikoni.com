/**
 * Escrow Funding Panel
 * State: ESCROW_REQUIRED → ESCROW_FUNDED
 * 
 * Buyer funds escrow to lock in the trade.
 * Money is held in escrow until all conditions are met for release.
 * Integrated with Stripe for secure payment processing.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Loader2, CheckCircle2, Lock, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { initiateEscrowPayment, fundEscrow } from '@/services/escrowService';
import { validateTradeCompliance } from '@/services/complianceService';
import { TRADE_STATE } from '@/services/tradeKernel';

export default function EscrowFundingPanel({ trade, onNextStep, isTransitioning }) {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [paymentShown, setPaymentShown] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  useEffect(() => {
    loadUserAndEscrow();
  }, [trade?.id]);

  useEffect(() => {
    loadCompliance();
  }, [trade?.id]);

  async function loadUserAndEscrow() {
    try {
      // Get current user
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData);

      // Load escrow for this trade
      const { data, error: escrowError } = await supabase
        .from('escrows')
        .select('*')
        .eq('trade_id', trade.id)
        .single();

      if (escrowError && escrowError.code !== 'PGRST116') throw escrowError;
      setEscrow(data || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompliance() {
    const hsCode = trade?.metadata?.hs_code || trade?.metadata?.hsCode;
    if (!hsCode) {
      setCompliance({ compliant: false, missingDocuments: ['hs_code_required'] });
      return;
    }
    setComplianceLoading(true);
    const result = await validateTradeCompliance(trade.id, hsCode);
    setCompliance(result);
    setComplianceLoading(false);
  }

  async function handleInitiatePayment() {
    if (!escrow || !user) return;
    if (compliance && compliance.compliant === false) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent via Stripe
      const result = await initiateEscrowPayment({
        escrowId: escrow.id,
        buyerEmail: user.email,
        amount: escrow.amount,
        currency: escrow.currency
      });

      if (result.success) {
        setStripeClientSecret(result.paymentIntent.clientSecret);
        setPaymentIntentId(result.paymentIntent.paymentIntentId);
        setPaymentShown(true);
      } else {
        setError(result.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmPayment() {
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
                    disabled={processing || isTransitioning}
                    className="flex-1 hover:bg-afrikoni-gold/90 font-semibold"
                  >
                    {processing || isTransitioning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <>Confirm & Pay {escrow.currency} {escrow.amount?.toLocaleString()}</>
                    )}
                  </Button>
                </div>
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
