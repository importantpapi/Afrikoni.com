/**
 * Delivery Acceptance Panel
 * State: DELIVERED → ACCEPTED → SETTLED
 * 
 * Buyer confirms delivery and accepts goods.
 * Once accepted, this triggers automatic payment release from escrow.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle2, Star, AlertCircle, Clock } from 'lucide-react';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import { differenceInDays, differenceInHours, parseISO, addDays } from 'date-fns';

export default function DeliveryAcceptancePanel({ trade, onNextStep, isTransitioning, capabilities }) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasDefects, setHasDefects] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Calculate escrow auto-release countdown (typically 7 days after delivery)
  useEffect(() => {
    if (trade?.delivered_at || trade?.metadata?.delivery_confirmed_at) {
      const deliveryDate = trade.delivered_at || trade.metadata.delivery_confirmed_at;
      const releaseDate = addDays(parseISO(deliveryDate), 7); // 7 day inspection period
      
      const updateCountdown = () => {
        const now = new Date();
        const daysLeft = differenceInDays(releaseDate, now);
        const hoursLeft = differenceInHours(releaseDate, now) % 24;
        
        if (daysLeft < 0) {
          setTimeRemaining('Escrow released');
        } else if (daysLeft === 0) {
          setTimeRemaining(`${hoursLeft}h remaining`);
        } else {
          setTimeRemaining(`${daysLeft}d ${hoursLeft}h remaining`);
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [trade]);

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
      {/* Escrow Auto-Release Countdown */}
      {timeRemaining && (
        <div className="bg-gradient-to-r from-[#B8922F]/10 to-transparent border border-[#B8922F]/20 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-[#B8922F]/10 rounded-full">
            <Clock className="w-5 h-5 text-[#B8922F]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-900">Automatic Escrow Release</p>
            <p className="text-xs text-stone-600">
              {timeRemaining === 'Escrow released' ? (
                'Funds automatically released to supplier'
              ) : (
                <>Payment will auto-release in <span className="font-bold text-[#B8922F]">{timeRemaining}</span> if no issues reported</>
              )}
            </p>
          </div>
          {timeRemaining !== 'Escrow released' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/dashboard/disputes?trade_id=${trade.id}`}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Report Issue
            </Button>
          )}
        </div>
      )}
      
      <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-os-2xl font-semibold">
              Confirm Delivery
            </h2>
            <p className="text-os-sm mt-1">
              Verify goods match the RFQ and accept delivery.
            </p>
          </div>

          {/* Delivery Checklist */}
          <div className="rounded-os-sm p-4 mb-6 border">
            <p className="text-os-sm font-semibold mb-3">
              Verify Delivery
            </p>
            <ul className="space-y-2 text-os-sm">
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
              <span className="text-os-sm">
                There are issues with this delivery
              </span>
            </label>

            {hasDefects && (
              <div className="border rounded-os-sm p-4">
                <p className="text-os-xs font-semibold mb-2">
                  Report issues (will open a dispute)
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="text-os-sm placeholder:text-white/40"
                />
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-os-sm font-semibold mb-2">
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
          <div className="border rounded-os-sm p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-os-sm">
                I accept this delivery and authorize payment release to the supplier.
              </span>
            </label>
          </div>

          {/* Accept Button */}
          {!capabilities?.can_buy && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-os-sm flex items-center gap-3 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-os-xs text-amber-200">Buyer capabilities required to accept delivery.</p>
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
      <Card className="border rounded-os-md">
        <CardContent className="p-4">
          <p className="text-os-xs font-semibold">
            💡 Your feedback helps build trust
          </p>
          <p className="text-os-xs mt-1">
            Ratings and delivery experience are used to calculate supplier trust scores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
