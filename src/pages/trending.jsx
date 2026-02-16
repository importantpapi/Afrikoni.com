import React from 'react';
import SEO from '@/components/SEO';

export default function Trending() {
  return (
    <>
      <SEO
        title="Trending Products | Afrikoni B2B Marketplace"
        description="Discover trending African products and high-demand categories on Afrikoni. See what buyers across Africa and the world are sourcing right now."
        url="/trending"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Trending on Afrikoni
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              A snapshot of products and categories that business buyers are actively viewing,
              shortlisting, and requesting quotes for across the continent.
            </p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Agriculture & Food',
              'Textiles & Apparel',
              'Beauty & Personal Care',
              'Industrial & Construction',
              'Home & Living',
              'Consumer Electronics'
            ].map((name) => (
              <div
                key={name}
                className="bg-white rounded-os-sm border border-os-accent/20 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-os-lg font-semibold text-afrikoni-chestnut mb-2">{name}</h2>
                  <p className="text-os-sm text-afrikoni-deep/80">
                    Buyers are actively searching and sending RFQs in this category. Listing now
                    helps you appear in more buyer shortlists.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


