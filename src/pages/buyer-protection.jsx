import React from 'react';
import SEO from '@/components/SEO';

export default function BuyerProtectionAgreement() {
  return (
    <>
      <SEO
        title="Buyer Protection Policy | Afrikoni B2B Marketplace"
        description="Learn how Afrikoni protects buyers through escrow, dispute resolution, and robust trade assurance."
        url="/buyer-protection"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Buyer Protection Policy
          </h1>
          <p className="text-os-sm text-afrikoni-deep/80">
            This policy will describe the protections Afrikoni offers to buyers, including escrow,
            quality assurance, refunds, and dispute resolution processes.
          </p>
        </div>
      </div>
    </>
  );
}


