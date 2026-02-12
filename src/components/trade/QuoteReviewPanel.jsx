/**
 * Quote Review & Selection Panel
 * State: QUOTED
 * 
 * Buyer reviews quotes from suppliers and selects one.
 * Selecting a quote transitions to CONTRACTED state and triggers contract generation.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, TrendingDown } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { TRADE_STATE } from '@/services/tradeKernel';
import { generateContractFromQuote } from '@/services/contractService';

export default function QuoteReviewPanel({ trade, onNextStep, isTransitioning, capabilities }) {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuotes();
  }, [trade?.id]);

  async function loadQuotes() {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:companies!supplier_id(company_name, trust_score, country)
        `)
        .eq('trade_id', trade.id)
        .order('price_per_unit', { ascending: true });

      if (error) throw error;
      setQuotes(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectQuote(quoteId) {
    setSelectedQuoteId(quoteId);
    const quote = quotes.find(q => q.id === quoteId);

    // Generate contract before transitioning to CONTRACTED
    const contractResult = await generateContractFromQuote(trade.id, quoteId);
    if (!contractResult.success) {
      setSelectedQuoteId(null);
      setError(contractResult.error || 'Failed to generate contract');
      return;
    }

    await onNextStep(TRADE_STATE.CONTRACTED, {
      selectedQuoteId: quoteId,
      supplierId: quote.supplier_id,
      totalPrice: quote.total_price,
      currency: quote.currency,
      contractId: contractResult.contract?.id
    });
  }

  if (loading) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-sm mt-2">Loading quotes...</p>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">No quotes yet</p>
          <p className="text-sm mt-1">
            Suppliers are reviewing your RFQ. Check back soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border rounded-2xl">
          <CardContent className="p-4 text-sm">
            {error}
          </CardContent>
        </Card>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          Review Quotes
        </h2>
        <p className="text-sm mt-1">
          {quotes.length} supplier{quotes.length !== 1 ? 's' : ''} responded. Select the best offer.
        </p>
      </div>

      {quotes.map((quote, idx) => (
        <Card
          key={quote.id}
          className={`border transition-all cursor-pointer rounded-2xl ${selectedQuoteId === quote.id
            ? 'border-afrikoni-gold/50 bg-afrikoni-gold/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
            : 'border-white/10 bg-white/5 hover:border-afrikoni-gold/40'
            }`}
          onClick={() => setExpanding(expanding === quote.id ? null : quote.id)}
        >
          <CardContent className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">
                  {quote.supplier?.company_name}
                </h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="">
                    {quote.supplier?.country}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={
                      (quote.supplier?.trust_score || 0) >= 80
                        ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/30'
                        : 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/30'
                    }
                  >
                    Trust: {Math.round(quote.supplier?.trust_score || 0)}%
                  </Badge>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {quote.currency} {quote.price_per_unit}
                </p>
                <p className="text-xs mt-1">
                  per {trade.quantity_unit}
                </p>
              </div>
            </div>

            {/* Expandable Details */}
            {expanding === quote.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="">Total Price</p>
                    <p className="font-semibold">
                      {quote.currency} {quote.total_price?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="">Lead Time</p>
                    <p className="font-semibold">
                      {quote.lead_time_days} days
                    </p>
                  </div>
                  <div>
                    <p className="">Incoterms</p>
                    <p className="font-semibold">
                      {quote.incoterms || 'FOB'}
                    </p>
                  </div>
                  <div>
                    <p className="">Delivery</p>
                    <p className="font-semibold">
                      {quote.delivery_location || 'To be confirmed'}
                    </p>
                  </div>
                </div>

                {/* Select Button */}
                {!capabilities?.can_buy && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 mt-4">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] text-amber-200">Buyer capabilities required to select quotes.</p>
                  </div>
                )}
                <Button
                  onClick={() => handleSelectQuote(quote.id)}
                  disabled={isTransitioning || selectedQuoteId === quote.id || !capabilities?.can_buy}
                  className="w-full hover:bg-afrikoni-gold/90 mt-4"
                >
                  {selectedQuoteId === quote.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Quote Selected
                    </>
                  ) : isTransitioning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Select This Quote'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Best Price Indicator */}
      {quotes.length > 1 && (
        <div className="border rounded-xl p-3 text-sm">
          <p>
            <TrendingDown className="w-4 h-4 inline mr-1" />
            <strong>Best pricing:</strong> The first option is {(
              (1 - quotes[0].price_per_unit / quotes[quotes.length - 1].price_per_unit) * 100
            ).toFixed(0)}% lower than the highest bid.
          </p>
        </div>
      )}
    </div>
  );
}
