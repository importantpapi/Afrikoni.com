/**
 * Contract Signing Panel
 * State: CONTRACTED
 * 
 * Digital signature flow for the contract.
 * Contract is AI-generated based on RFQ + selected quote.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Loader2, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SignaturePad } from '@/components/shared/ui/SignaturePad';
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
      <Card className="border rounded-os-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-os-sm mt-2">Loading contract...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-os-2xl font-semibold">
            {signed ? 'Contract Signed' : 'Review & Sign Contract'}
          </h2>
          <p className="text-os-sm mt-1">
            {signed
              ? 'Your contract has been digitally signed.'
              : 'Review the contract terms and sign to proceed.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-os-sm border text-os-sm">
            {error}
          </div>
        )}

        {!signed ? (
          <>
            {/* Contract Preview */}
            <div className="border rounded-os-sm mb-4 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b">
                <FileText className="w-4 h-4" />
                <span className="text-os-sm font-semibold">
                  {contract?.title || 'Supply Contract'}
                </span>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {contract?.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: contract.content_html }} />
                  ) : (
                    <div className="space-y-3 text-os-sm">
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

            {/* Agreement / Signature Pad */}
            <div className="space-y-4 mb-6">
              <p className="text-os-xs font-black uppercase tracking-[0.3em] text-os-accent opacity-80">
                Sovereign Digital Signature
              </p>
              <SignaturePad
                onSign={(data) => setAgreed(!!data)}
                className="bg-black/20"
              />
              <p className="text-os-xs text-os-muted italic leading-relaxed">
                By signing above, you cryptographically commit to the terms of this Trade DNA.
                This signature is immutable and tied to the Afrikoni Sovereign Ledger.
              </p>
            </div>

            {/* Sign Button */}
            <Button
              onClick={handleSign}
              disabled={!agreed || isTransitioning}
              className="w-full h-14 bg-os-accent text-black font-black uppercase tracking-widest text-os-xs rounded-os-md hover:scale-[1.02] transition-all shadow-os-lg shadow-os-accent/10"
            >
              {isTransitioning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Committing to Ledger...</>
              ) : (
                '✓ Register Signed Contract'
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-os-md mb-4 border">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-semibold">
              Contract Signed
            </p>
            <p className="text-os-sm mt-2">
              Next step: Fund escrow to confirm the trade.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
