/**
 * Escrow Funding Panel
 * State: ESCROW_REQUIRED → ESCROW_FUNDED
 * 
 * Buyer funds escrow to lock in the trade.
 * Money is held in escrow until all conditions are met for release.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle2, Lock, DollarSign } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { fundEscrow } from '@/services/escrowService';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

export default function EscrowFundingPanel({ trade, onNextStep, isTransitioning }) {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEscrow();
  }, [trade?.id]);

  async function loadEscrow() {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .select('*')
        .eq('trade_id', trade.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEscrow(data || null);
    } finally {
      setLoading(false);
    }
  }

  async function handleFundEscrow() {
    if (!escrow) return;

    setProcessing(true);
    try {
      // In real system, this would integrate with payment gateway
      // For now, simulate successful payment
      const result = await fundEscrow({
        escrowId: escrow.id,
        transactionId: `TXN-${Date.now()}`,
        paymentDetails: { method: paymentMethod }
      });

      if (result.success) {
        setEscrow(result.escrow);
        // Transition to next state
        await onNextStep(TRADE_STATE.ESCROW_FUNDED, {
          escrowId: escrow.id
        });
      }
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

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-3">
                Payment Method
              </p>
              <div className="space-y-2">
                {['bank_transfer', 'card', 'crypto'].map((method) => (
                  <label key={method} className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {method === 'bank_transfer' ? 'Bank Transfer' : method === 'card' ? 'Credit Card' : 'Cryptocurrency'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fund Button */}
            <Button
              onClick={handleFundEscrow}
              disabled={processing || isTransitioning}
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold"
            >
              {processing || isTransitioning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Payment...</>
              ) : (
                <><DollarSign className="w-4 h-4 mr-2" /> Fund Escrow Now</>
              )}
            </Button>
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
