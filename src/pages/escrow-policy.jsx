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
          <p className="text-sm md:text-base text-afrikoni-deep/80 mb-6">
            This policy explains in simple language how Afrikoni Trade Shield™ handles payments,
            how funds are held in escrow, when they are released to suppliers, and how refunds are
            decided when there is a problem.
          </p>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              1. When escrow protection applies
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/80">
              Afrikoni Trade Shield™ applies when:
            </p>
            <ul className="list-disc list-inside text-sm md:text-base text-afrikoni-deep/80 space-y-1.5">
              <li>The order is created and confirmed inside Afrikoni.</li>
              <li>Payment is made through Afrikoni&apos;s supported payment methods.</li>
              <li>All key terms (product, quantity, price, delivery location) are written on the order.</li>
              <li>Communication and documents related to the order stay inside Afrikoni as much as possible.</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              2. How funds are held
            </h2>
            <ul className="list-decimal list-inside text-sm md:text-base text-afrikoni-deep/80 space-y-1.5">
              <li>Buyer pays through Afrikoni using a supported payment method (e.g. card, bank transfer).</li>
              <li>Funds are received by Afrikoni&apos;s payment partner and held in an escrow-style account.</li>
              <li>Supplier is notified that payment is secured, but does not receive the money yet.</li>
              <li>Supplier prepares and ships the goods according to the written order.</li>
            </ul>
            <p className="text-xs md:text-sm text-afrikoni-deep/70">
              Important: Afrikoni never asks buyers to send money directly to a personal account or
              off-platform wallet for protected orders.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              3. When payment is released to the supplier
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/80">
              Payment is normally released when:
            </p>
            <ul className="list-disc list-inside text-sm md:text-base text-afrikoni-deep/80 space-y-1.5">
              <li>The buyer confirms inside Afrikoni that the goods were received in good condition; or</li>
              <li>
                The agreed confirmation window expires (for example, 5–7 days after confirmed delivery) and
                no dispute has been opened.
              </li>
            </ul>
            <p className="text-xs md:text-sm text-afrikoni-deep/70">
              If the buyer reports a problem within the confirmation window, the funds remain on hold
              while Afrikoni reviews the case under the Dispute Resolution policy.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              4. Refunds and partial refunds
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/80">
              Depending on the evidence, Afrikoni may recommend one of the following outcomes:
            </p>
            <ul className="list-disc list-inside text-sm md:text-base text-afrikoni-deep/80 space-y-1.5">
              <li><span className="font-semibold">Full refund</span> – when goods clearly do not match the written agreement or never arrive.</li>
              <li><span className="font-semibold">Partial refund</span> – when part of the shipment is acceptable and both sides agree to a discount.</li>
              <li><span className="font-semibold">No refund</span> – when goods match the written agreement and no clear defect is proven.</li>
            </ul>
            <p className="text-xs md:text-sm text-afrikoni-deep/70">
              Refunds are normally processed back to the original payment method. Processing times can vary
              depending on banks and card networks.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-4 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              5. What is not covered
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/80">
              Afrikoni Trade Shield™ does <span className="font-semibold">not</span> cover:
            </p>
            <ul className="list-disc list-inside text-sm md:text-base text-afrikoni-deep/80 space-y-1.5">
              <li>Payments made outside Afrikoni or sent directly to private accounts.</li>
              <li>Orders or changes to terms agreed only via phone or WhatsApp without written confirmation in the order.</li>
              <li>Normal quality variation when no clear specifications were written.</li>
              <li>Losses caused by buyer resale, storage or misuse after delivery.</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-afrikoni-gold/20 p-5 md:p-6 space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-afrikoni-chestnut">
              6. If you have a question
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/80">
              If you are unsure whether a specific order is covered, or you need help understanding this
              policy, please contact Afrikoni support through the Help Center or from your order page before
              sending or releasing any payment.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}


