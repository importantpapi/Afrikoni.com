import React from 'react';
import SEO from '@/components/SEO';

export default function Disputes() {
  return (
    <>
      <SEO
        title="Dispute Resolution | Afrikoni Trade Shield"
        description="Understand how Afrikoni handles order disputes between buyers and suppliers, with clear timelines, documentation, and mediation."
        url="/disputes"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Dispute Resolution
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              When something goes wrong, Afrikoni Trade Shield provides a structured path to
              investigate, document, and resolve disputes between buyers and suppliers.
            </p>
          </header>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">Typical dispute flow</h2>
            <ol className="list-decimal list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>Buyer or supplier raises a dispute from the order dashboard.</li>
              <li>Both parties upload evidence: contracts, invoices, photos, and messages.</li>
              <li>Afrikoni reviews the case and may involve inspection partners if needed.</li>
              <li>A resolution proposal is issued, including refund, partial refund, or remediation.</li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}


