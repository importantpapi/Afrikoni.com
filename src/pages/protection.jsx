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
          <header className="mb-8 md:mb-10 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
                Afrikoni Trade Shield™
              </h1>
              <p className="text-afrikoni-deep/80 max-w-2xl">
                Enterprise-grade protection for serious B2B buyers and suppliers: secure payments,
                verified counterparties, inspections, and a clear dispute path for every order.
              </p>
            </div>
            <div className="bg-white/90 border border-afrikoni-gold/30 rounded-lg p-4">
              <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut uppercase tracking-wide mb-2">
                In simple terms
              </p>
              <p className="text-sm md:text-base text-afrikoni-deep/90">
                Afrikoni does <span className="font-semibold">two things at the same time</span>:
                it keeps your money safe in escrow until you receive what was agreed, and it gives both sides
                a clear, written process if something goes wrong. No legal English, no confusion.
              </p>
            </div>
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

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6 space-y-3">
            <h2 className="font-semibold text-afrikoni-chestnut mb-1">How Trade Shield Works</h2>
            <p className="text-sm text-afrikoni-deep/80">
              Whether you&apos;re buying shea butter from Ghana or machinery from South Africa, the same simple flow
              protects every order:
            </p>
            <ol className="list-decimal list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>Buyer and supplier agree on price, quantity and delivery terms and submit the order through Afrikoni.</li>
              <li>Buyer pays through Afrikoni; funds are held safely in escrow, not sent directly to any bank account.</li>
              <li>Goods are produced and shipped; optional inspections and documents are uploaded inside Afrikoni.</li>
              <li>Buyer confirms that goods match the agreement; only then is payment released to the supplier.</li>
              <li>If there is a disagreement, Afrikoni reviews the documents and messages and proposes a fair outcome.</li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}


