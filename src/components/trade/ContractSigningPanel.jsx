/**
 * Contract Signing Panel
 * State: CONTRACTED
 * 
 * Digital signature flow for the contract.
 * Contract is AI-generated based on RFQ + selected quote.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';

export default function ContractSigningPanel({ trade, onNextStep, isTransitioning }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    loadContract();
  }, [trade?.id]);

  async function loadContract() {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('trade_id', trade.id)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setContract(data || null);
      setSigned(data?.buyer_signed_at ? true : false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!agreed) return;

    setSigned(true);
    await onNextStep(TRADE_STATE.ESCROW_REQUIRED, {
      contractId: contract?.id,
      buyerSigned: true,
      escrowAmount: contract?.total_amount || trade?.price_max
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-afrikoni-gold" />
          <p className="text-sm text-gray-600 mt-2">Loading contract...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
            {signed ? 'Contract Signed' : 'Review & Sign Contract'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {signed
              ? 'Your contract has been digitally signed.'
              : 'Review the contract terms and sign to proceed.'}
          </p>
        </div>

        {!signed ? (
          <>
            {/* Contract Preview */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg mb-4 overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-300 dark:border-gray-600">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {contract?.title || 'Supply Contract'}
                </span>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto bg-white dark:bg-[#0F0F0F]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {contract?.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: contract.content_html }} />
                  ) : (
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <p><strong>Buyer:</strong> {trade?.buyer?.company_name}</p>
                      <p><strong>Supplier:</strong> {trade?.seller?.company_name}</p>
                      <p><strong>Product:</strong> {trade?.title}</p>
                      <p><strong>Quantity:</strong> {trade?.quantity} {trade?.quantity_unit}</p>
                      <p><strong>Total Value:</strong> {contract?.currency} {contract?.total_amount?.toLocaleString()}</p>
                      <p><strong>Terms:</strong> Payment via escrow. Release upon delivery acceptance.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-900/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={setAgreed}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I have reviewed the contract and agree to its terms. By signing, I confirm
                  I am authorized to enter into this agreement on behalf of my company.
                </span>
              </label>
            </div>

            {/* Sign Button */}
            <Button
              onClick={handleSign}
              disabled={!agreed || isTransitioning}
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold"
            >
              {isTransitioning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing...</>
              ) : (
                '✓ Sign Contract'
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
              Contract Signed
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Next step: Fund escrow to confirm the trade.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
