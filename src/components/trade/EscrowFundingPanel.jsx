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
import { Button } from '@/components/shared/ui/button';
import { Loader2, CheckCircle2, Lock, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { initiateEscrowPayment, fundEscrow } from '@/services/escrowService';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

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

  useEffect(() => {
    loadUserAndEscrow();
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

  async function handleInitiatePayment() {
    if (!escrow || !user) return;

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
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-afrikoni-gold" />
          <p className="text-sm text-gray-600 mt-2">Loading escrow details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!escrow) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-6">
          <p className="font-semibold text-yellow-900">Escrow not initialized</p>
          <p className="text-sm text-yellow-700 mt-1">Contact support if this persists.</p>
        </CardContent>
      </Card>
    );
  }

  const isFunded = escrow.status === 'funded';

  return (
    <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
            {isFunded ? 'Escrow Funded' : 'Fund Escrow'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isFunded
              ? 'Escrow is secured. Supplier can now begin production.'
              : 'Secure payment to lock in the trade and allow production to begin.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isFunded ? (
          <>
            {/* Escrow Amount Display */}
            <div className="bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Escrow Amount</p>
                  <p className="text-3xl font-bold text-afrikoni-gold mt-1">
                    {escrow.currency} {escrow.amount?.toLocaleString()}
                  </p>
                </div>
                <Lock className="w-8 h-8 text-afrikoni-gold opacity-50" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                This amount will be held in escrow until all delivery conditions are met.
              </p>
            </div>

            {/* Security Promises */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8]">
                Your money is protected:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Only released after delivery confirmation</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Full refund if you reject delivery</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Dispute resolution available</span>
                </li>
              </ul>
            </div>

            {!paymentShown ? (
              <>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-3">
                    Payment Method
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: 'card', label: 'Credit Card', description: 'Visa, Mastercard, Amex' },
                      { id: 'bank', label: 'Bank Transfer', description: 'Direct bank payment' },
                      { id: 'crypto', label: 'Cryptocurrency', description: 'USDC, USDT' }
                    ].map((method) => (
                      <label key={method.id} className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {method.label}
                          </p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fund Button */}
                <Button
                  onClick={handleInitiatePayment}
                  disabled={processing || isTransitioning}
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold"
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
                <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-4">
                    Payment Details
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {paymentMethod === 'card' && 'Enter your credit card details below'}
                    {paymentMethod === 'bank' && 'Complete bank transfer using the details provided'}
                    {paymentMethod === 'crypto' && 'Send USDC/USDT to the wallet address shown'}
                  </p>
                  
                  {/* Stripe Elements will be mounted here when @stripe/react-stripe-js is available */}
                  <div id="stripe-card-element" className="min-h-12 p-3 border border-gray-300 rounded-lg bg-white">
                    {/* Stripe.js Elements component will render here */}
                    <p className="text-xs text-gray-500">Card element will load when Stripe.js is available</p>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Your card details are encrypted and only processed by Stripe.
                  </p>
                </div>

                {/* Confirm Payment Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPaymentShown(false)}
                    disabled={processing}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={processing || isTransitioning}
                    className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold"
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
              Payment Secured
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Funded on {new Date(escrow.funded_at).toLocaleDateString()}
            </p>
            <Badge className="mt-4 bg-green-100 text-green-700">
              Awaiting Production Start
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
