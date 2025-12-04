import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calculator, TrendingUp, Shield, Zap, Users, Building2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();
  const [orderValue, setOrderValue] = useState(10000);
  const [selectedTier, setSelectedTier] = useState('bronze');

  const sellerTiers = [
    {
      id: 'bronze',
      name: 'Bronze',
      emoji: '🥉',
      monthlyPrice: 'Free',
      transactionFee: 3,
      description: 'Perfect for getting started',
      features: [
        'Basic listing',
        'Standard verification',
        'Email support',
        'Basic analytics',
        'First 10 transactions: FREE'
      ],
      color: 'border-amber-300',
      bgColor: 'bg-amber-50',
      popular: false
    },
    {
      id: 'silver',
      name: 'Silver',
      emoji: '🥈',
      monthlyPrice: '$49',
      transactionFee: 2,
      description: 'For growing businesses',
      features: [
        'Unlimited listings',
        'Enhanced verification badge',
        'Priority support',
        'Featured in search',
        'Advanced analytics',
        'Lower transaction fee (2%)'
      ],
      color: 'border-slate-300',
      bgColor: 'bg-slate-50',
      popular: true
    },
    {
      id: 'gold',
      name: 'Gold',
      emoji: '🥇',
      monthlyPrice: '$199',
      transactionFee: 1,
      description: 'For serious businesses',
      features: [
        'Everything in Silver',
        'Premium verification (factory audit)',
        'Dedicated account manager',
        'Custom storefront',
        'API access',
        'Priority placement',
        'Co-marketing opportunities',
        'Lowest transaction fee (1%)'
      ],
      color: 'border-afrikoni-gold',
      bgColor: 'bg-afrikoni-cream/30',
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      emoji: '💎',
      monthlyPrice: 'Custom',
      transactionFee: 'Custom',
      description: 'For large trading houses',
      features: [
        'Everything in Gold',
        'White-label options',
        'Custom integrations',
        'Full service support',
        'Volume discounts',
        'Negotiated rates'
      ],
      color: 'border-purple-300',
      bgColor: 'bg-purple-50',
      popular: false
    }
  ];

  const buyerTiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Browse and search',
        'Contact suppliers',
        'Place orders',
        'Basic support',
        'Standard escrow'
      ],
      color: 'border-gray-300',
      popular: false
    },
    {
      id: 'pro',
      name: 'Buyer Pro',
      price: '$99',
      period: 'per month',
      description: 'For procurement managers',
      features: [
        'Everything in Free',
        'Advanced search filters',
        'Price drop alerts',
        'Supplier comparison tools',
        'Market intelligence dashboard',
        'Bulk RFQ management',
        'Priority customer support',
        'Saved suppliers and products',
        'Purchase analytics'
      ],
      color: 'border-blue-300',
      popular: true
    },
    {
      id: 'enterprise-buyer',
      name: 'Enterprise',
      price: '$499',
      period: 'per month',
      description: 'For large procurement teams',
      features: [
        'Everything in Pro',
        'Dedicated sourcing agent',
        'Custom supplier vetting',
        'Negotiation assistance',
        'Quality inspection coordination',
        'Multi-user accounts',
        'Integration with ERP',
        'Quarterly business reviews'
      ],
      color: 'border-purple-300',
      popular: false
    }
  ];

  const calculateFee = (value, feePercent) => {
    return (value * feePercent) / 100;
  };

  const selectedTierData = sellerTiers.find(t => t.id === selectedTier);
  const feeAmount = selectedTierData?.transactionFee 
    ? calculateFee(orderValue, selectedTierData.transactionFee)
    : 0;

  return (
    <>
      <SEO
        title="Pricing | Afrikoni B2B Marketplace"
        description="Fair, transparent pricing for African B2B suppliers and buyers. Choose from Bronze, Silver, Gold, or Enterprise plans. Transaction fees from 1-3%. Start free."
        url="/pricing"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-4">
              Afrikoni Pricing: Fair & Transparent
            </h1>
            <p className="text-lg text-afrikoni-deep/80 max-w-3xl mx-auto mb-6">
              We only make money when you succeed. Our fees are designed to be fair, transparent, and aligned with the value we provide.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Free tier available</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </header>

          {/* Fee Calculator */}
          <Card className="mb-12 border-afrikoni-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Transaction Fee Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-afrikoni-deep mb-2">
                    Order Value (USD)
                  </label>
                  <input
                    type="number"
                    value={orderValue}
                    onChange={(e) => setOrderValue(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-afrikoni-gold/30 rounded-md focus:ring-2 focus:ring-afrikoni-gold focus:border-afrikoni-gold"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-afrikoni-deep mb-2">
                    Seller Tier
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-2 border border-afrikoni-gold/30 rounded-md focus:ring-2 focus:ring-afrikoni-gold focus:border-afrikoni-gold"
                  >
                    {sellerTiers.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.emoji} {tier.name} ({tier.transactionFee}% fee)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedTierData && selectedTierData.transactionFee && (
                <div className="mt-6 p-4 bg-afrikoni-cream/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-afrikoni-deep">Transaction Fee ({selectedTierData.transactionFee}%):</span>
                    <span className="text-2xl font-bold text-afrikoni-chestnut">
                      ${feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-afrikoni-deep">Estimated Supplier Payout:</span>
                    <span className="text-xl font-semibold text-green-600">
                      ${(orderValue - feeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-sm text-afrikoni-deep/70 mt-3">
                    This includes: Escrow protection, fraud prevention, dispute resolution, payment processing, customer support, and platform maintenance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Tiers */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Building2 className="w-8 h-8" />
                For Sellers
              </h2>
              <p className="text-afrikoni-deep/80">
                Choose monthly subscription OR pay per transaction. You decide what works best for your business.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellerTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`${tier.color} ${tier.bgColor} ${tier.popular ? 'ring-2 ring-afrikoni-gold' : ''} relative`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-afrikoni-gold text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{tier.emoji}</span>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-afrikoni-chestnut">
                        {tier.monthlyPrice}
                      </span>
                      {tier.monthlyPrice !== 'Free' && tier.monthlyPrice !== 'Custom' && (
                        <span className="text-afrikoni-deep/70">/month</span>
                      )}
                    </div>
                    {tier.transactionFee && typeof tier.transactionFee === 'number' && (
                      <p className="text-sm text-afrikoni-deep/70">
                        OR {tier.transactionFee}% per transaction
                      </p>
                    )}
                    <p className="text-sm text-afrikoni-deep/80 mt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={tier.popular ? 'primary' : 'outline'}
                      className="w-full"
                      asChild
                    >
                      <Link to="/signup">
                        {tier.monthlyPrice === 'Custom' ? 'Contact Sales' : 'Get Started'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Buyer Tiers */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Users className="w-8 h-8" />
                For Buyers
              </h2>
              <p className="text-afrikoni-deep/80">
                Free to browse and buy. Upgrade for advanced tools and intelligence.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {buyerTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`${tier.color} ${tier.popular ? 'ring-2 ring-afrikoni-gold' : ''} relative`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-afrikoni-gold text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{tier.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-afrikoni-chestnut">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-afrikoni-deep/70">/{tier.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-afrikoni-deep/80">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={tier.popular ? 'primary' : 'outline'}
                      className="w-full"
                      asChild
                    >
                      <Link to="/signup">
                        {tier.price === '$0' ? 'Sign Up Free' : 'Get Started'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-6 text-center">
              How We Compare
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm border border-afrikoni-gold/30">
                <thead>
                  <tr className="bg-afrikoni-cream/50">
                    <th className="px-4 py-3 text-left font-semibold text-afrikoni-chestnut">Feature</th>
                    <th className="px-4 py-3 text-center font-semibold text-afrikoni-chestnut">Afrikoni</th>
                    <th className="px-4 py-3 text-center font-semibold text-afrikoni-deep">Competitor A</th>
                    <th className="px-4 py-3 text-center font-semibold text-afrikoni-deep">Alibaba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-afrikoni-gold/20">
                  <tr>
                    <td className="px-4 py-3 font-medium">Transaction Fee</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">2-3%</td>
                    <td className="px-4 py-3 text-center">5-8%</td>
                    <td className="px-4 py-3 text-center">3-5%</td>
                  </tr>
                  <tr className="bg-afrikoni-cream/20">
                    <td className="px-4 py-3 font-medium">Escrow Protection</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600">⚠</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Dispute Resolution</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">48hrs</td>
                    <td className="px-4 py-3 text-center">Weeks</td>
                    <td className="px-4 py-3 text-center">Slow</td>
                  </tr>
                  <tr className="bg-afrikoni-cream/20">
                    <td className="px-4 py-3 font-medium">Free Tier</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600">⚠</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Transparent Fees</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600">⚠</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why should I pay fees when other sites are "free"?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    There's no such thing as free. Others hide costs in higher product prices, poor customer service, no protection when things go wrong, and hidden payment fees. We're upfront about costs and provide real value.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I negotiate rates?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    Yes! High-volume sellers get custom rates. Contact us at <a href="mailto:sales@afrikoni.com" className="text-afrikoni-gold hover:underline">sales@afrikoni.com</a> to discuss enterprise pricing.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What if I'm not satisfied?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    First 10 transactions are FREE for Bronze sellers. Try us risk-free. You can cancel your subscription anytime with no penalties.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do I have to pay monthly or per transaction?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    For Silver and Gold sellers, you can choose! Pay the monthly subscription OR pay per transaction. Whichever works better for your business model.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-afrikoni-cream/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-afrikoni-deep/80 mb-6 max-w-2xl mx-auto">
              Join thousands of African businesses already trading on Afrikoni. Start free, upgrade when you're ready.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link to="/signup">Sign Up Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
