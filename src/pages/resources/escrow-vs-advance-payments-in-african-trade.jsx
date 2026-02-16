import React from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import SEO from '@/components/SEO';

export default function EscrowVsAdvancePaymentsInAfricanTrade() {
  return (
    <>
      <SEO
        title="Escrow vs Advance Payments in African Trade | Afrikoni Insights"
        description="Compare escrow-protected payments with traditional advance payments when trading with African suppliers and see how Afrikoni Shield™ reduces risk."
        url="/resources/escrow-vs-advance-payments-in-african-trade"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <div>
            <p className="text-os-xs uppercase tracking-wide text-os-accent mb-2">
              Afrikoni Insights · Payments
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Escrow vs Advance Payments in African Trade
            </h1>
            <p className="text-os-sm text-afrikoni-deep/70">5 min read · Powered by Afrikoni Shield™</p>
          </div>

          <Card className="border-os-accent/20 bg-white">
            <CardContent className="p-6 prose prose-sm md:prose-base max-w-none">
              <p>
                Many cross‑border deals in Africa still rely on advance payments or informal agreements. While this can
                work with long‑standing partners, it exposes buyers and suppliers to unnecessary risk when working with
                new counterparties.
              </p>

              <h2>How advance payments work</h2>
              <p>
                With advance payments, the buyer sends funds before production or shipment. If something goes wrong
                (quality issues, delays, fraud), recovering that money can be extremely difficult.
              </p>

              <h2>How escrow works on Afrikoni</h2>
              <p>
                With escrow on Afrikoni Shield™:
              </p>
              <ul>
                <li>The buyer pays into a secure escrow account.</li>
                <li>The supplier sees the funds are reserved and can safely produce/ship.</li>
                <li>
                  Funds are only released to the supplier once delivery is confirmed or agreed milestones are reached.
                </li>
              </ul>

              <h2>Benefits for buyers</h2>
              <ul>
                <li>Lower fraud risk when working with new suppliers.</li>
                <li>Clear dispute resolution paths in case of quality or delivery issues.</li>
                <li>Better leverage in negotiations.</li>
              </ul>

              <h2>Benefits for suppliers</h2>
              <ul>
                <li>Proof that the buyer has committed funds.</li>
                <li>Reduced payment risk and fewer abandoned orders.</li>
                <li>Improved credibility with banks and logistics partners.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


