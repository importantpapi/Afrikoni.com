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
          <header className="mb-8 md:mb-10 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
                Dispute Resolution
              </h1>
              <p className="text-afrikoni-deep/80 max-w-2xl">
                When something goes wrong, Afrikoni Trade Shield provides a structured path to
                investigate, document, and resolve disputes between buyers and suppliers.
              </p>
            </div>
            <div className="bg-white/90 border border-afrikoni-gold/30 rounded-lg p-4">
              <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut uppercase tracking-wide mb-2">
                Before you worry
              </p>
              <p className="text-sm md:text-base text-afrikoni-deep/90">
                Most trades finish without any dispute. This page explains what happens in the rare cases where there
                is a problem, so you know <span className="font-semibold">Afrikoni will stand in the middle</span> and
                follow a clear, fair process.
              </p>
            </div>
          </header>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-6 space-y-3">
            <h2 className="font-semibold text-afrikoni-chestnut mb-3">Typical dispute flow</h2>
            <ol className="list-decimal list-inside text-sm text-afrikoni-deep/80 space-y-1.5">
              <li>The buyer or supplier opens a dispute directly from the protected order page.</li>
              <li>Both sides upload clear evidence: contracts, invoices, photos, videos and key messages.</li>
              <li>Afrikoni&apos;s team reviews the case and, if needed, asks questions or involves inspection partners.</li>
              <li>
                Afrikoni proposes a resolution (refund, partial refund, re‑shipment or other remedy) based on
                what was agreed in writing.
              </li>
            </ol>
            <p className="text-xs md:text-sm text-afrikoni-deep/80 mt-2">
              Important: disputes are only fully covered when payment and communication stay inside Afrikoni Trade Shield™.
            </p>
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-afrikoni-chestnut text-sm md:text-base">Typical timelines</h3>
              <ul className="list-disc list-inside text-xs md:text-sm text-afrikoni-deep/80 space-y-1">
                <li>Afrikoni acknowledges new disputes within 1 business day.</li>
                <li>Initial review and information request usually within 3–5 business days.</li>
                <li>Most cases are resolved within 7–14 business days, depending on evidence and inspections.</li>
              </ul>
              <p className="text-xs md:text-sm text-afrikoni-deep/70">
                Complex cross-border cases may take longer, but Afrikoni will always communicate clearly inside
                the order chat about the status and next steps.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}


