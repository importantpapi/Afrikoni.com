import React from 'react';
import SEO from '@/components/SEO';

export default function InspectionServices() {
  return (
    <>
      <SEO
        title="Inspection Services | Afrikoni B2B Marketplace"
        description="Independent pre-shipment inspections, quality checks, and loading supervision for African exports. Reduce risk before goods leave the port."
        url="/inspection"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Inspection Services
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              Work with vetted inspection partners across key African ports and production hubs to
              confirm quantity, quality, and packaging before shipment.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-5">
              <h2 className="font-semibold text-afrikoni-chestnut mb-2">Pre-shipment checks</h2>
              <p className="text-sm text-afrikoni-deep/80">
                Visual inspection, sampling, and basic conformity checks before goods are loaded for
                export.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-afrikoni-gold/20 p-5">
              <h2 className="font-semibold text-afrikoni-chestnut mb-2">Loading supervision</h2>
              <p className="text-sm text-afrikoni-deep/80">
                Independent confirmation of container loading, sealing, and documentation capture
                for audit trails.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">Where we operate first</h2>
            <p className="text-sm text-afrikoni-deep/80 mb-3">
              Initial coverage focuses on high-volume export corridors such as West Africa cocoa,
              coffee, cashew, textiles, and manufactured goods – with expansion to additional
              markets over time.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}


