import React, { useEffect } from 'react';
import SEO from '@/components/SEO';
import ScrollToTop from '@/components/ScrollToTop';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SEO
        title="Privacy Policy"
        description="Afrikoni Privacy Policy - Learn how we collect, use, and protect your personal data in compliance with GDPR and African privacy regulations."
        url="/privacy-policy"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-gray-900 dark:text-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-afrikoni-chestnut">Privacy Policy</h1>
          
          <section className="space-y-4">
            <p className="text-os-sm text-gray-600 dark:text-gray-400">
              <strong>Last Updated:</strong> December 2025<br />
              <strong>Effective Date:</strong> December 2025<br />
              <strong>Company Name:</strong> Afrikoni (pending full legal registration)<br />
              <strong>Website:</strong> Afrikoni.com
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">1. Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni ("we", "our", "us") is a B2B marketplace enabling trusted trade across Africa and beyond.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We are committed to protecting your privacy and complying with applicable data protection laws including GDPR and relevant African privacy regulations.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By using Afrikoni.com, you consent to the practices described in this Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">2. Information We Collect</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Name, phone number, and email</li>
              <li>Business details and registration information</li>
              <li>Product listings, company profile data</li>
              <li>Payment and trade information (via secure partners)</li>
              <li>Device, browser, IP, and analytics data</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We do not knowingly collect data from individuals under 18.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">3. How We Use Your Data</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use personal data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Enable trade and messaging on the platform</li>
              <li>Verify businesses and prevent fraud</li>
              <li>Provide customer support and service updates</li>
              <li>Improve platform security and functionality</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We do not sell personal data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">4. Legal Basis</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Contractual necessity</li>
              <li>Legitimate interests (security, analytics)</li>
              <li>Consent (marketing)</li>
              <li>Legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">5. Data Sharing</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Business partners you interact with</li>
              <li>Hosting and analytics providers</li>
              <li>Payment and verification services</li>
              <li>Authorities if legally required</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">6. Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We protect your data with encryption, monitoring, and access controls.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              However, no system is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">7. International Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Safeguards like Standard Contractual Clauses are used when required.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">8. Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You may access, correct, delete, restrict processing, or withdraw consent.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Email: <a href="mailto:hello@afrikoni.com" className="text-os-accent hover:underline">hello@afrikoni.com</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">9. Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Used for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Authentication</li>
              <li>Personalization</li>
              <li>Analytics</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users can adjust cookie settings through browser/system controls.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">10. Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Data kept while accounts remain active or as required by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">11. Updates</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may revise this policy. Changes will be communicated clearly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-os-2xl md:text-3xl font-semibold text-afrikoni-chestnut">12. Contact</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Email: <a href="mailto:hello@afrikoni.com" className="text-os-accent hover:underline">hello@afrikoni.com</a>
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

