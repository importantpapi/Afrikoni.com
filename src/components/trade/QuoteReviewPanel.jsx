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
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

export default function QuoteReviewPanel({ trade, onNextStep, isTransitioning }) {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);

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
    
    await onNextStep(TRADE_STATE.CONTRACTED, {
      selectedQuoteId: quoteId,
      supplierId: quote.supplier_id,
      totalPrice: quote.total_price,
      currency: quote.currency
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-afrikoni-gold" />
          <p className="text-sm text-gray-600 mt-2">Loading quotes...</p>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="font-semibold text-yellow-900">No quotes yet</p>
          <p className="text-sm text-yellow-700 mt-1">
            Suppliers are reviewing your RFQ. Check back soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
          Review Quotes
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {quotes.length} supplier{quotes.length !== 1 ? 's' : ''} responded. Select the best offer.
        </p>
      </div>

      {quotes.map((quote, idx) => (
        <Card
          key={quote.id}
          className={`border-2 transition-all cursor-pointer ${
            selectedQuoteId === quote.id
              ? 'border-afrikoni-gold/50 bg-afrikoni-gold/5 shadow-premium'
              : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
          }`}
          onClick={() => setExpanding(expanding === quote.id ? null : quote.id)}
        >
          <CardContent className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                  {quote.supplier?.company_name}
                </h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">
                    {quote.supplier?.country}
                  </Badge>
                  <Badge 
                    variant="secondary"
                    className={
                      (quote.supplier?.trust_score || 0) >= 80
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    Trust: {Math.round(quote.supplier?.trust_score || 0)}%
                  </Badge>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-2xl font-bold text-afrikoni-gold">
                  {quote.currency} {quote.price_per_unit}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  per {trade.quantity_unit}
                </p>
              </div>
            </div>

            {/* Expandable Details */}
            {expanding === quote.id && (
              <div className="mt-4 pt-4 border-t border-afrikoni-gold/10 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Price</p>
                    <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                      {quote.currency} {quote.total_price?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Lead Time</p>
                    <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                      {quote.lead_time_days} days
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Incoterms</p>
                    <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                      {quote.incoterms || 'FOB'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Delivery</p>
                    <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                      {quote.delivery_location || 'To be confirmed'}
                    </p>
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  onClick={() => handleSelectQuote(quote.id)}
                  disabled={isTransitioning || selectedQuoteId === quote.id}
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white mt-4"
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
          <p className="text-blue-900 dark:text-blue-200">
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
