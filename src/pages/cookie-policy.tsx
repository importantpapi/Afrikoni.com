import React, { useEffect } from 'react';
import SEO from '@/components/SEO';
import ScrollToTop from '@/components/ScrollToTop';

export default function CookiePolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SEO
        title="Cookie Policy"
        description="Afrikoni Cookie Policy - Learn about how we use cookies, what types of cookies we use, and how you can manage your cookie preferences."
        url="/cookie-policy"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-gray-900 dark:text-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-afrikoni-chestnut">Cookie Policy</h1>
          
          <section className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Last Updated:</strong> December 2025<br />
              <strong>Effective Date:</strong> December 2025<br />
              <strong>Company Name:</strong> Afrikoni (pending full legal registration)<br />
              <strong>Website:</strong> Afrikoni.com
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">1. What Are Cookies?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">2. How We Use Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Afrikoni uses cookies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Enable essential website functionality and security</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze website traffic and user behavior</li>
              <li>Improve your browsing experience</li>
              <li>Personalize content and advertisements (with your consent)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">3. Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">3.1 Necessary Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies as they are necessary for the website to work.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">3.2 Preference Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  These cookies allow the website to remember information that changes the way the website behaves or looks, such as your preferred language or region.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">3.3 Analytics Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the website's performance and user experience.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">3.4 Marketing Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  These cookies are used to track visitors across websites to display relevant advertisements. They are currently not in use but may be implemented in the future with your explicit consent.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">4. Third-Party Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website and deliver advertisements on and through the website.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">5. Managing Your Cookie Preferences</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You can manage your cookie preferences at any time by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Using the cookie consent banner when you first visit our website</li>
              <li>Accessing your Account Settings and clicking "Manage Cookie Preferences"</li>
              <li>Adjusting your browser settings to refuse cookies (note: this may affect website functionality)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">6. Browser Settings</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your ability to use certain features of our website.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For more information on how to manage cookies in your browser, please visit:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-afrikoni-gold hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-afrikoni-gold hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-afrikoni-gold hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-afrikoni-gold hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">7. Cookie Duration</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Cookies may be either "persistent" or "session" cookies. Persistent cookies remain on your device for a set period or until you delete them, while session cookies are deleted when you close your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">8. Updates to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Cookie Policy on this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-afrikoni-chestnut">9. Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
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

