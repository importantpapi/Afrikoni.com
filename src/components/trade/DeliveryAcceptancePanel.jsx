/**
 * Delivery Acceptance Panel
 * State: DELIVERED → ACCEPTED → SETTLED
 * 
 * Buyer confirms delivery and accepts goods.
 * Once accepted, this triggers automatic payment release from escrow.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import { releaseEscrow } from '@/services/escrowService';

export default function DeliveryAcceptancePanel({ trade, onNextStep, isTransitioning }) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasDefects, setHasDefects] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAcceptDelivery() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Release escrow
      const escrowResult = await releaseEscrow({
        escrowId: null, // Would be populated in real flow
        reason: hasDefects ? 'conditional_acceptance' : 'delivery_accepted',
        metadata: {
          notes,
          rating,
          hasDefects
        }
      });

      // Transition to SETTLED
      await onNextStep(TRADE_STATE.SETTLED, {
        buyerAccepted: true,
        notes,
        rating
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
              Confirm Delivery
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verify goods match the RFQ and accept delivery.
            </p>
          </div>

          {/* Delivery Checklist */}
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-3">
              Verify Delivery
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  defaultChecked
                  disabled
                />
                <span className="text-gray-700 dark:text-gray-300">Goods received in good condition</span>
              </li>
              <li className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  defaultChecked
                  disabled
                />
                <span className="text-gray-700 dark:text-gray-300">Quantity matches invoice</span>
              </li>
              <li className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  defaultChecked
                  disabled
                />
                <span className="text-gray-700 dark:text-gray-300">Quality matches specifications</span>
              </li>
            </ul>
          </div>

          {/* Issue Reporting */}
          <div className="mb-6">
            <label className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={hasDefects}
                onCheckedChange={setHasDefects}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                There are issues with this delivery
              </span>
            </label>

            {hasDefects && (
              <div className="border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  Report issues (will open a dispute)
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-2">
              Rate this supplier
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-all ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="border border-afrikoni-gold/20 bg-afrikoni-gold/5 rounded-lg p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isAccepted}
                onCheckedChange={setIsAccepted}
                className="mt-1"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I accept this delivery and authorize payment release to the supplier.
              </span>
            </label>
          </div>

          {/* Accept Button */}
          <Button
            onClick={handleAcceptDelivery}
            disabled={!isAccepted || isSubmitting || isTransitioning}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isSubmitting || isTransitioning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              '✓ Accept & Release Payment'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Trust Score Impact */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
            💡 Your feedback helps build trust
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
            Ratings and delivery experience are used to calculate supplier trust scores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
