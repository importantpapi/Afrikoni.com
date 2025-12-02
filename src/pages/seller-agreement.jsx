import React from 'react';
import SEO from '@/components/SEO';

export default function SellerAgreement() {
  return (
    <>
      <SEO
        title="Seller Agreement | Afrikoni B2B Marketplace"
        description="The seller agreement outlining rights, obligations, and responsibilities for suppliers using Afrikoni."
        url="/seller-agreement"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Seller Agreement
          </h1>
          <p className="text-sm text-afrikoni-deep/80">
            This agreement will define the commercial and legal terms that apply to suppliers who
            list products and transact on Afrikoni. Use this as a placeholder until your legal team
            provides final wording.
          </p>
        </div>
      </div>
    </>
  );
}


