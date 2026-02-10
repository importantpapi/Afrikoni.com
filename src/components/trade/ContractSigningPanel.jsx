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
import { TRADE_STATE } from '@/services/tradeKernel';
import { getTradeContract, signContract } from '@/services/contractService';

export default function ContractSigningPanel({ trade, onNextStep, isTransitioning }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContract();
  }, [trade?.id]);

  async function loadContract() {
    try {
      const result = await getTradeContract(trade.id);
      if (!result.success) throw new Error(result.error);
      setContract(result.contract || null);
      setSigned(result.contract?.buyer_signed_at ? true : false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!agreed) return;

    setError(null);
    const signResult = await signContract(contract?.id);
    if (!signResult.success) {
      setError(signResult.error || 'Failed to sign contract');
      return;
    }
    setSigned(true);
    await onNextStep(TRADE_STATE.ESCROW_REQUIRED, {
      contractId: contract?.id,
      buyerSigned: true,
      escrowAmount: contract?.total_amount || trade?.price_max,
      currency: contract?.currency || trade?.currency
    });
  }

  if (loading) {
    return (
      <Card className="border rounded-2xl">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-sm mt-2">Loading contract...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {signed ? 'Contract Signed' : 'Review & Sign Contract'}
          </h2>
          <p className="text-sm mt-1">
            {signed
              ? 'Your contract has been digitally signed.'
              : 'Review the contract terms and sign to proceed.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border text-sm">
            {error}
          </div>
        )}

        {!signed ? (
          <>
            {/* Contract Preview */}
            <div className="border rounded-xl mb-4 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {contract?.title || 'Supply Contract'}
                </span>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {contract?.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: contract.content_html }} />
                  ) : (
                    <div className="space-y-3 text-sm">
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
            <div className="border rounded-xl p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I have reviewed the contract and agree to its terms. By signing, I confirm
                  I am authorized to enter into this agreement on behalf of my company.
                </span>
              </label>
            </div>

            {/* Sign Button */}
            <Button
              onClick={handleSign}
              disabled={!agreed || isTransitioning}
              className="w-full hover:bg-afrikoni-gold/90 font-semibold"
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-semibold">
              Contract Signed
            </p>
            <p className="text-sm mt-2">
              Next step: Fund escrow to confirm the trade.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
