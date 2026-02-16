import React from 'react';
import SEO from '@/components/SEO';

export default function Cookies() {
  return (
    <>
      <SEO
        title="Cookie Policy | Afrikoni B2B Marketplace"
        description="Understand how Afrikoni uses cookies and similar technologies on our platform."
        url="/cookies"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Cookie Policy
          </h1>
          <p className="text-os-sm text-afrikoni-deep/80">
            This page will describe the types of cookies and similar technologies used on Afrikoni,
            how we use them, and how you can manage your preferences.
          </p>
        </div>
      </div>
    </>
  );
}


