import React from 'react';
import SEO from '@/components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy | Afrikoni B2B Marketplace"
        description="Learn how Afrikoni collects, uses, and protects your personal and business data."
        url="/privacy"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Privacy Policy
          </h1>
          <p className="text-os-sm text-afrikoni-deep/80">
            This page will outline how Afrikoni collects, uses, stores, and protects personal data
            in line with applicable data protection and privacy regulations (such as GDPR and local
            African data protection laws).
          </p>
        </div>
      </div>
    </>
  );
}


