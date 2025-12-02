import React from 'react';
import SEO from '@/components/SEO';

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing | Afrikoni B2B Marketplace"
        description="Simple, transparent pricing for African B2B suppliers and buyers. Start free, then upgrade to growth and enterprise plans as your trade volume grows."
        url="/pricing"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">
              Afrikoni Pricing
            </h1>
            <p className="text-afrikoni-deep/80 max-w-2xl">
              Fair, predictable pricing for serious African B2B trade. No hidden fees – just
              platform, protection, and growth tools that scale with your business.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'For suppliers testing Afrikoni with a small product catalogue.'
              },
              {
                name: 'Growth',
                price: '$49/mo',
                description: 'For growing exporters and manufacturers with active RFQs and orders.'
              },
              {
                name: 'Enterprise',
                price: 'Talk to us',
                description: 'For large trading houses, cooperatives, and procurement teams.'
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className="bg-white rounded-xl border border-afrikoni-gold/30 shadow-sm p-6 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-afrikoni-chestnut mb-1">
                    {plan.name}
                  </h2>
                  <p className="text-afrikoni-gold text-2xl font-bold mb-3">{plan.price}</p>
                  <p className="text-sm text-afrikoni-deep/80 mb-4">{plan.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


