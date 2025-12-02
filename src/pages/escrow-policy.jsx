import React from 'react';
import SEO from '@/components/SEO';

export default function EscrowPolicy() {
  return (
    <>
      <SEO
        title="Escrow & Payment Policy | Afrikoni Trade Shield"
        description="Details of Afrikoni's escrow-style payment flows, release conditions, and refund logic under Trade Shield."
        url="/escrow-policy"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Escrow &amp; Payment Policy
          </h1>
          <p className="text-sm text-afrikoni-deep/80">
            Use this page to describe how funds are held, when they are released to suppliers, how
            chargebacks and refunds are handled, and what protections Afrikoni Trade Shield offers
            to both sides.
          </p>
        </div>
      </div>
    </>
  );
}


