import React from 'react';
import SEO from '@/components/SEO';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Conditions | Afrikoni B2B Marketplace"
        description="Read the terms and conditions that govern the use of Afrikoni, the African B2B marketplace for verified suppliers and buyers."
        url="/terms"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-afrikoni-deep/80">
            This page will contain the full legal terms governing the use of Afrikoni by buyers,
            suppliers, and partners. Work with your legal counsel to finalise the text here.
          </p>
        </div>
      </div>
    </>
  );
}


