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
import { Loader2, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

export default function DeliveryAcceptancePanel({ trade, onNextStep, isTransitioning, capabilities }) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasDefects, setHasDefects] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAcceptDelivery() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (hasDefects) {
        await onNextStep(TRADE_STATE.DISPUTED, {
          buyerAccepted: false,
          notes,
          rating,
          disputeReason: 'delivery_issues'
        });
        return;
      }

      // Transition to ACCEPTED first (writes buyer acceptance to kernel metadata)
      await onNextStep(TRADE_STATE.ACCEPTED, {
        buyerAccepted: true,
        notes,
        rating
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
      <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Confirm Delivery
            </h2>
            <p className="text-sm mt-1">
              Verify goods match the RFQ and accept delivery.
            </p>
          </div>

          {/* Delivery Checklist */}
          <div className="rounded-xl p-4 mb-6 border">
            <p className="text-sm font-semibold mb-3">
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
                <span className="">Goods received in good condition</span>
              </li>
              <li className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  defaultChecked
                  disabled
                />
                <span className="">Quantity matches invoice</span>
              </li>
              <li className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  defaultChecked
                  disabled
                />
                <span className="">Quality matches specifications</span>
              </li>
            </ul>
          </div>

          {/* Issue Reporting */}
          <div className="mb-6">
            <label className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={hasDefects}
                onChange={(e) => setHasDefects(e.target.checked)}
              />
              <span className="text-sm">
                There are issues with this delivery
              </span>
            </label>

            {hasDefects && (
              <div className="border rounded-xl p-4">
                <p className="text-xs font-semibold mb-2">
                  Report issues (will open a dispute)
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="text-sm placeholder:text-white/40"
                />
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Rate this supplier
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-all ${star <= rating ? 'text-yellow-300' : 'text-white/30'
                    }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="border rounded-xl p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm">
                I accept this delivery and authorize payment release to the supplier.
              </span>
            </label>
          </div>

          {/* Accept Button */}
          {!capabilities?.can_buy && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] text-amber-200">Buyer capabilities required to accept delivery.</p>
            </div>
          )}
          <Button
            onClick={handleAcceptDelivery}
            disabled={!isAccepted || isSubmitting || isTransitioning || !capabilities?.can_buy}
            className="w-full hover:bg-emerald-300 font-semibold"
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
      <Card className="border rounded-2xl">
        <CardContent className="p-4">
          <p className="text-xs font-semibold">
            💡 Your feedback helps build trust
          </p>
          <p className="text-xs mt-1">
            Ratings and delivery experience are used to calculate supplier trust scores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
