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
import { sanitizeHTML } from '@/utils/sanitizeHTML';
import { toast } from 'sonner';
import { Button } from '@/components/shared/ui/button';
import SuccessScreen from '@/components/shared/ui/SuccessScreen';

export default function ContractSigningPanel({ trade, onNextStep, isTransitioning, isBuyer, isSeller, profile }) {
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
      const isSignedByThisUser = isBuyer ? !!result.contract?.buyer_signed_at : !!result.contract?.seller_signed_at;
      setSigned(isSignedByThisUser);
    } catch (err) {
      console.error(err);
      // Fallback if no contract exists yet (should be created by now ideally)
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!agreed) return;

    setError(null);
    try {
      const role = isBuyer ? 'buyer' : 'seller';
      const signResult = await signContract(contract?.id, role);
      if (!signResult.success) {
        setError(signResult.error || 'Failed to sign contract');
        return;
      }
      setSigned(true);
      toast.success("Contract signed successfully");
    } catch (err) {
      setError("An error occurred during signing.");
    }
  }

  const handleContinue = async () => {
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
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-os-accent" />
          <p className="text-os-sm mt-2 text-os-text-secondary">Loading contract details...</p>
        </CardContent>
      </Card>
    );
  }

  if (signed) {
    return (
      <Card className="border bg-os-surface-base rounded-os-md border-emerald-500/20 shadow-os-lg overflow-hidden">
        <CardContent className="p-0">
          <SuccessScreen
            title="Contract Secured"
            message="Your digital signature has been recorded and cryptographically sealed. The trade terms are now legally locked."
            theme="emerald"
            nextSteps={[
              { label: "Legally binding contract generated in Document Vault", icon: <FileText className="w-4 h-4" /> },
              { label: "Both parties notified of mutual agreement", icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: "Trade Shield protection fully enabled", icon: <ShieldCheck className="w-4 h-4" /> }
            ]}
            primaryAction={handleContinue}
            primaryActionLabel="Proceed to Escrow"
            icon={ShieldCheck}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-os-2xl font-semibold text-os-text-primary">
            Review & Sign Contract
          </h2>
          <p className="text-os-sm mt-1 text-os-text-secondary">
            {isBuyer ? 'Verify terms and sign to initiate escrow.' : 'Verify terms and sign to accept the order.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-os-sm border border-red-500/30 bg-red-500/10 text-os-sm text-red-400">
            {error}
          </div>
        )}

        {/* Contract Preview */}
        <div className="border border-os-stroke rounded-os-sm mb-6 bg-os-surface-1 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-os-stroke bg-os-surface-2">
            <FileText className="w-4 h-4 text-os-accent" />
            <span className="text-os-sm font-semibold text-os-text-primary">
              {contract?.title || `Trade Agreement #${trade?.id?.slice(0, 8)}`}
            </span>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="prose prose-sm dark:prose-invert max-w-none text-os-text-secondary">
              {contract?.content_html ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(contract.content_html) }} />
              ) : (
                <div className="space-y-3 text-os-sm">
                  <p><strong className="text-os-text-primary">Buyer:</strong> {trade?.buyer?.company_name}</p>
                  <p><strong className="text-os-text-primary">Supplier:</strong> {trade?.seller?.company_name}</p>
                  <p><strong className="text-os-text-primary">Product:</strong> {trade?.title}</p>
                  <p><strong className="text-os-text-primary">Quantity:</strong> {trade?.quantity} {trade?.quantity_unit}</p>
                  <p><strong className="text-os-text-primary">Total Value:</strong> {contract?.currency || trade?.currency} {(contract?.total_amount || trade?.target_price)?.toLocaleString()}</p>
                  <p><strong className="text-os-text-primary">Terms:</strong> Payment held in secure escrow. Funds released only upon delivery acceptance.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agreement / Signature Pad */}
        <div className="space-y-4 mb-8">
          <p className="text-os-xs font-bold uppercase tracking-wider text-os-accent/80 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Secure Digital Signature
          </p>
          <div className="border border-os-stroke rounded-os-md overflow-hidden bg-black/40">
            <SignaturePad
              onSign={(data) => setAgreed(!!data)}
              className="bg-transparent"
            />
          </div>
          <p className="text-os-xs text-os-text-secondary/60 leading-relaxed italic">
            By signing, you agree to the Afrikoni Trade Terms. This digital signature is legally binding and cryptographically secured.
          </p>
        </div>

        {/* Sign Button */}
        <Button
          onClick={handleSign}
          disabled={!agreed || isTransitioning}
          className="w-full h-12 bg-os-accent hover:bg-os-accent/90 text-black font-bold uppercase tracking-widest text-xs rounded-os-md transition-all shadow-lg shadow-os-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransitioning ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Securing Contract...</>
          ) : (
            'Sign & Confirm Contract'
          )}
        </Button>
        <p className="text-center text-os-xs text-os-text-secondary/40 mt-3">
          Questions about this contract?{' '}
          <a href="mailto:support@afrikoni.com" className="text-os-accent underline">
            Contact support
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
