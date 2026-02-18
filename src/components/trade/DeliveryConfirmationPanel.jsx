/**
 * Delivery Confirmation Panel
 * State: DELIVERED → ACCEPTED (with escrow release)
 *
 * Buyer confirms receipt of goods and triggers escrow payment release
 * to the seller. Requires explicit acknowledgment via two checkboxes.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { transitionTrade } from '@/services/tradeKernel';
import { toast } from 'sonner';
import {
  Loader2,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import ReviewModal from '@/components/trade/ReviewModal';

export default function DeliveryConfirmationPanel({ trade, onDeliveryConfirmed, isTransitioning }) {
  const [goodsReceived, setGoodsReceived] = useState(false);
  const [escrowUnderstood, setEscrowUnderstood] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const canConfirm = goodsReceived && escrowUnderstood && !isSubmitting && !isTransitioning;

  async function handleConfirmDelivery() {
    if (!canConfirm) return;

    setIsSubmitting(true);
    try {
      const result = await transitionTrade(trade.id, 'accepted', {
        buyer_accepted: true,
        accepted_at: new Date().toISOString(),
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setIsConfirmed(true);
      setShowReview(true);
      toast.success('Delivery confirmed! Escrow payment has been released to the seller.');
      onDeliveryConfirmed();
    } catch (err) {
      console.error('Failed to confirm delivery:', err);
      toast.error(err.message || 'Failed to confirm delivery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isConfirmed) {
    return (
      <>
        <Card className="border border-emerald-400/30 bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
              <PackageCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-os-2xl font-semibold text-emerald-300">
              Delivery Confirmed!
            </h2>
            <p className="text-os-sm mt-2 text-white/60 max-w-md mx-auto">
              The escrow payment has been released to the supplier. This trade is now complete.
            </p>
            <Button
              onClick={() => setShowReview(true)}
              className="mt-6 h-12 px-8 bg-os-accent hover:bg-os-accent/90 text-black font-bold"
            >
              Rate Your Experience
            </Button>
            <p className="mt-4 text-os-xs text-white/30">
              Need help? <a href="mailto:support@afrikoni.com" className="text-os-accent underline">Contact support</a>
            </p>
          </CardContent>
        </Card>
        <ReviewModal
          isOpen={showReview}
          onClose={() => setShowReview(false)}
          trade={trade}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <PackageCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-os-2xl font-semibold">
                Confirm Delivery
              </h2>
            </div>
            <p className="text-os-sm text-white/60">
              Verify that you have received the goods for{' '}
              <span className="font-medium text-white/80">{trade.title}</span>{' '}
              and release escrow payment.
            </p>
          </div>

          {/* Trade Summary */}
          {trade.metadata && (
            <div className="rounded-os-sm p-4 mb-6 border border-white/10 bg-white/5">
              <p className="text-os-xs text-white/50 font-semibold mb-2">Trade Summary</p>
              <div className="grid grid-cols-2 gap-3 text-os-sm">
                {trade.metadata.total_price && (
                  <div>
                    <p className="text-white/50">Total Price</p>
                    <p className="font-semibold text-white">
                      {trade.metadata.currency || 'USD'}{' '}
                      {Number(trade.metadata.total_price).toLocaleString()}
                    </p>
                  </div>
                )}
                {trade.metadata.supplier_name && (
                  <div>
                    <p className="text-white/50">Supplier</p>
                    <p className="font-semibold text-white">
                      {trade.metadata.supplier_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkbox 1: Goods Received */}
          <div className="border border-white/10 rounded-os-sm p-4 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={goodsReceived}
                onChange={(e) => setGoodsReceived(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-os-sm font-semibold text-white">
                    Goods Received
                  </span>
                </div>
                <p className="text-os-xs text-white/50 mt-1">
                  I confirm I have received the goods and they match the order specifications.
                </p>
              </div>
            </label>
          </div>

          {/* Checkbox 2: Escrow Understanding */}
          <div className="border border-white/10 rounded-os-sm p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={escrowUnderstood}
                onChange={(e) => setEscrowUnderstood(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-os-sm font-semibold text-white">
                    Escrow Release Authorization
                  </span>
                </div>
                <p className="text-os-xs text-white/50 mt-1">
                  I understand that confirming delivery will release the escrow payment to the seller.
                  This action cannot be undone.
                </p>
              </div>
            </label>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-os-sm flex items-center gap-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-os-xs text-amber-200">
              Once confirmed, escrow funds will be released immediately. Only confirm if you are
              satisfied with the delivered goods.
            </p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmDelivery}
            disabled={!canConfirm}
            className={`w-full font-semibold ${
              canConfirm
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : ''
            }`}
          >
            {isSubmitting || isTransitioning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Confirmation...
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4 mr-2" />
                Confirm Delivery & Release Payment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
