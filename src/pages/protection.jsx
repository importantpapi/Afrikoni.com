import React from 'react';
import SEO from '@/components/SEO';

export default function TradeShield() {
  return (
    <>
      <SEO
        title="Afrikoni Trade Shield™ | Secure B2B Order Protection"
        description="Protect every cross-border B2B order with Afrikoni Trade Shield™. Escrow, inspections, dispute resolution, and compliance monitoring for African trade."
        url="/protection"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Afrikoni Trade Shield™
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              Enterprise-grade protection for serious B2B buyers and suppliers: secure payments,
              verified counterparties, inspections, and a clear dispute path for every order.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-5">
              <h2 className="font-semibold text-afrikoni-chestnut mb-2">For Buyers</h2>
              <ul className="list-disc list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
                <li>Escrow-style payment flows with milestone releases.</li>
                <li>Supplier verification and document checks before funds are released.</li>
                <li>Structured dispute and refund process if goods don&apos;t match agreement.</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-5">
              <h2 className="font-semibold text-afrikoni-chestnut mb-2">For Suppliers</h2>
              <ul className="list-disc list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
                <li>Serious, verified buyers with proof of funds.</li>
                <li>Clear delivery conditions and acceptance criteria before shipment.</li>
                <li>Transparent dispute timelines and mediation from Afrikoni.</li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">How Trade Shield Works</h2>
            <ol className="list-decimal list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>Buyer and supplier agree on terms and submit order through Afrikoni.</li>
              <li>Funds are secured and held until shipment and optional inspection.</li>
              <li>Goods are delivered and verified; payment is released to the supplier.</li>
              <li>If there is a dispute, Afrikoni mediates based on documentation and evidence.</li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}


