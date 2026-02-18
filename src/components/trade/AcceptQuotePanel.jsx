/**
 * Accept Quote Panel
 * State: RFQ → QUOTED
 *
 * Buyer reviews incoming quotes on their RFQ and accepts one,
 * creating an order and transitioning the trade forward.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { transitionTrade } from '@/services/tradeKernel';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  Building,
  Globe,
  Shield,
  Clock,
  DollarSign,
} from 'lucide-react';

export default function AcceptQuotePanel({ trade, quotes, onQuoteAccepted }) {
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptedId, setAcceptedId] = useState(null);

  async function handleAcceptQuote(quote) {
    if (acceptingId) return;

    setAcceptingId(quote.id);
    try {
      const result = await transitionTrade(trade.id, 'quoted', {
        accepted_quote_id: quote.id,
        supplier_company_id: quote.supplier_company_id,
        unit_price: quote.unit_price,
        total_price: quote.total_price,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setAcceptedId(quote.id);
      toast.success('Quote accepted successfully! Order has been created.');
      onQuoteAccepted(quote);
    } catch (err) {
      console.error('Failed to accept quote:', err);
      toast.error(err.message || 'Failed to accept quote. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  }

  if (!quotes || quotes.length === 0) {
    return (
      <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-white/40" />
          <p className="font-semibold">No quotes received yet</p>
          <p className="text-os-sm mt-1 text-white/60">
            Suppliers are reviewing your RFQ. You will be notified when quotes arrive.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-os-2xl font-semibold">
          Accept a Quote
        </h2>
        <p className="text-os-sm mt-1 text-white/60">
          {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received for{' '}
          <span className="font-medium text-white/80">{trade.title}</span>.
          Review and accept the best offer.
        </p>
      </div>

      {/* Quote Cards */}
      {quotes.map((quote) => {
        const supplier = quote.companies || {};
        const isAccepting = acceptingId === quote.id;
        const isAccepted = acceptedId === quote.id;
        const trustScore = supplier.trust_score || 0;
        const isVerified = supplier.verification_status === 'verified';

        return (
          <Card
            key={quote.id}
            className={`border transition-all rounded-os-md ${
              isAccepted
                ? 'border-emerald-400/50 bg-emerald-500/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
                : 'border-white/10 bg-gradient-to-br from-[#0E1016] to-[#141B24] hover:border-white/20'
            }`}
          >
            <CardContent className="p-5">
              {/* Supplier Info Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-white/50" />
                    <h3 className="font-semibold text-white">
                      {supplier.name || 'Unknown Supplier'}
                    </h3>
                    {isVerified && (
                      <Badge className="bg-emerald-400/10 text-emerald-200 border border-emerald-400/30 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {supplier.country || 'N/A'}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        trustScore >= 80
                          ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/30 text-xs'
                          : trustScore >= 50
                          ? 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/30 text-xs'
                          : 'bg-red-500/10 text-red-200 border border-red-500/30 text-xs'
                      }
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Trust: {Math.round(trustScore)}%
                    </Badge>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-right">
                  <p className="text-os-2xl font-bold text-white">
                    {quote.currency} {Number(quote.unit_price).toLocaleString()}
                  </p>
                  <p className="text-os-xs text-white/50 mt-1">per unit</p>
                </div>
              </div>

              {/* Quote Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pt-4 border-t border-white/10">
                <div className="text-os-sm">
                  <p className="text-white/50 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Total Price
                  </p>
                  <p className="font-semibold text-white mt-1">
                    {quote.currency} {Number(quote.total_price).toLocaleString()}
                  </p>
                </div>
                <div className="text-os-sm">
                  <p className="text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Lead Time
                  </p>
                  <p className="font-semibold text-white mt-1">
                    {quote.lead_time_days} days
                  </p>
                </div>
                <div className="text-os-sm">
                  <p className="text-white/50">Incoterms</p>
                  <p className="font-semibold text-white mt-1">
                    {quote.incoterms || 'FOB'}
                  </p>
                </div>
                <div className="text-os-sm">
                  <p className="text-white/50">Payment Terms</p>
                  <p className="font-semibold text-white mt-1">
                    {quote.payment_terms || 'Escrow'}
                  </p>
                </div>
              </div>

              {/* Supplier Notes */}
              {quote.notes && (
                <div className="rounded-os-sm p-3 bg-white/5 border border-white/10 mb-4">
                  <p className="text-os-xs text-white/50 mb-1">Supplier Notes</p>
                  <p className="text-os-sm text-white/80">{quote.notes}</p>
                </div>
              )}

              {/* Accept Button */}
              <Button
                onClick={() => handleAcceptQuote(quote)}
                disabled={isAccepting || acceptedId !== null}
                className={`w-full font-semibold ${
                  isAccepted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'hover:bg-os-accent/90'
                }`}
              >
                {isAccepted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Quote Accepted
                  </>
                ) : isAccepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting Quote...
                  </>
                ) : acceptedId !== null ? (
                  'Another quote was accepted'
                ) : (
                  'Accept Quote'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
