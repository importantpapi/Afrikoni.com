import React from 'react';
import SEO from '@/components/SEO';

export default function AntiFraud() {
  return (
    <>
      <SEO
        title="Anti-Fraud & Risk Monitoring | Afrikoni Shield"
        description="Learn how Afrikoni Shield monitors fraud, sanctions, and high-risk behavior across African B2B trade, protecting both buyers and suppliers."
        url="/anti-fraud"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Anti-Fraud &amp; Risk Monitoring
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              Afrikoni Shield continuously screens counterparties, transactions, and trade patterns
              to detect fraud, impersonation, and sanction risks across African B2B trade.
            </p>
          </header>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">What we watch for</h2>
            <ul className="list-disc list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>Repeated failed KYC / KYB checks and identity inconsistencies.</li>
              <li>High-risk routing of funds and unusual payment behavior.</li>
              <li>Shipping routes and counterparties flagged by sanctions lists.</li>
              <li>Abnormal RFQ and messaging patterns indicating potential scams.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}


