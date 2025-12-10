import React, { useEffect } from 'react';
import SEO from '@/components/SEO';
import ScrollToTop from '@/components/ScrollToTop';

export default function TermsAndConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SEO
        title="Terms & Conditions"
        description="Afrikoni Terms & Conditions - Read our platform rules, user responsibilities, and terms of service for using Afrikoni B2B marketplace."
        url="/terms-and-conditions"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-gray-900 dark:text-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-afrikoni-chestnut">Terms & Conditions</h1>
          
          <section className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Last Updated:</strong> December 2025<br />
              <strong>Effective Date:</strong> December 2025<br />
              <strong>Company Name:</strong> Afrikoni (pending registration)<br />
              <strong>Website:</strong> Afrikoni.com<br />
              <strong>Contact:</strong> hello@afrikoni.com
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">1. Agreement</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By using Afrikoni, you agree to these Terms. If not, stop using the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">2. Role of Afrikoni</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni is a technology platform enabling business connections.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We are not a seller or logistics provider.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users conduct transactions directly with each other.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">3. Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users must be:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>18+</li>
              <li>A registered business or sole proprietor</li>
              <li>Providing true and accurate information</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">4. Platform Rules</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users must not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Upload false or illegal content</li>
              <li>Violate IP laws or trade restrictions</li>
              <li>Commit fraud or avoid future platform fees</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may remove harmful accounts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">5. Listings & Transactions</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users are responsible for verification, negotiations, and due diligence.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni does not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Product quality or delivery</li>
              <li>Payment completion</li>
              <li>Commercial results</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">6. Payments</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Financial data is processed by certified partners.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Fee structures will be communicated when activated.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">7. Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni owns the platform brand and design system.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users retain control of their content but grant display rights to Afrikoni.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">8. Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Follow the Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">9. Uptime</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              No guarantees of uninterrupted service.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may modify features without notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">10. Termination</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may suspend accounts that violate these terms.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users can request account deletion anytime.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">11. Limited Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni is not liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Business losses</li>
              <li>Shipment failures</li>
              <li>Disputes between users</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Max liability: €50 EUR
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">12. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Belgian laws apply
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Courts in Belgium have jurisdiction
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">13. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update these terms anytime. Users will be notified if important changes occur.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">14. Contact</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Email: <a href="mailto:hello@afrikoni.com" className="text-afrikoni-gold hover:underline">hello@afrikoni.com</a>
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Address: Kortenberg, Belgium (temporary)
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

