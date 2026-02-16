import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Check, X, Calculator, TrendingUp, Shield, Zap, Users, Building, Star, Award, FileText, Sparkles, DollarSign, Package } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [orderValue, setOrderValue] = useState(10000);
  const [selectedTier, setSelectedTier] = useState('starter'); // Default to free tier
  
  // Refs for scrolling
  const calculatorRef = useRef(null);
  const sellerTiersRef = useRef(null);
  const buyerTiersRef = useRef(null);
  const transactionFeesRef = useRef(null);
  const servicesRef = useRef(null);
  const featuresRef = useRef(null);
  
  // Handle query parameters on mount
  useEffect(() => {
    const plan = searchParams.get('plan');
    const type = searchParams.get('type');
    const service = searchParams.get('service');
    const feature = searchParams.get('feature');
    const calculator = searchParams.get('calculator');
    const estimator = searchParams.get('estimator');
    
    // Scroll to calculator if requested
    if (calculator === 'true' && calculatorRef.current) {
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    
    // Scroll to estimator if requested (same as calculator section)
    if (estimator === 'true' && calculatorRef.current) {
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    
    // Handle plan selection
    if (plan) {
      const planMap = {
        'free': 'starter',
        'starter': 'starter',
        'growth': 'growth',
        'pro': 'growth', // Pro maps to Growth for sellers
        'elite': 'elite',
        'business': 'elite' // Business maps to Elite for sellers
      };
      if (planMap[plan]) {
        setSelectedTier(planMap[plan]);
        setTimeout(() => {
          sellerTiersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
    
    // Scroll to transaction fees section
    if (type === 'rfq' || type === 'deal') {
      setTimeout(() => {
        transactionFeesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    
    // Scroll to services section
    if (service) {
      setTimeout(() => {
        servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    
    // Scroll to features section
    if (feature) {
      setTimeout(() => {
        featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams]);

  // Africa-appropriate pricing - designed for African SME margins (15-25%)
  const sellerTiers = [
    {
      id: 'starter',
      name: 'Afrikoni Starter',
      emoji: '🚀',
      monthlyPrice: 'Free',
      transactionFee: 4,
      description: 'Zero cost to start selling',
      features: [
        'Basic product listing',
        'Up to 10 products',
        'Standard search ranking',
        'Basic analytics',
        'RFQ notifications',
        'Standard support',
        '4% success fee only when you sell'
      ],
      color: 'border-green-300',
      bgColor: 'bg-green-50',
      popular: false
    },
    {
      id: 'growth',
      name: 'Afrikoni Growth',
      emoji: '📈',
      monthlyPrice: '$29',
      transactionFee: 3,
      description: 'Best value for growing businesses',
      features: [
        'Everything in Starter',
        'Unlimited products',
        '2x search visibility',
        '3% success fee (save 25%)',
        'Full analytics dashboard',
        'Priority RFQ matching',
        'Email support'
      ],
      color: 'border-os-accent',
      bgColor: 'bg-afrikoni-cream/30',
      popular: true
    },
    {
      id: 'elite',
      name: 'Afrikoni Elite',
      emoji: '👑',
      monthlyPrice: '$99',
      transactionFee: 2,
      description: 'Maximum visibility & lowest fees',
      features: [
        'Everything in Growth',
        'Top search visibility (3x)',
        'Verified Elite badge',
        '2% success fee (save 50%)',
        'Featured in category pages',
        'Priority customer support',
        'Dedicated account manager',
        'Custom storefront branding'
      ],
      color: 'border-purple-400',
      bgColor: 'bg-purple-50',
      popular: false
    }
  ];

  // Africa-appropriate buyer pricing
  const buyerTiers = [
    {
      id: 'free',
      name: 'Afrikoni Free',
      price: '$0',
      period: 'forever',
      description: 'Start sourcing immediately',
      features: [
        'Browse verified suppliers',
        'Search products & categories',
        '3 RFQs per month',
        '10 messages per month',
        'Basic Afrikoni Shield protection',
        'Standard support'
      ],
      color: 'border-green-300',
      popular: false
    },
    {
      id: 'pro',
      name: 'Afrikoni Pro',
      price: '$29',
      period: 'per month',
      description: 'Less than $1/day for serious buyers',
      features: [
        'Everything in Free',
        'Unlimited RFQs',
        'Unlimited messaging',
        'Priority supplier matching',
        'Price intelligence & benchmarks',
        'Supplier comparison tools',
        'Email support'
      ],
      color: 'border-os-accent',
      popular: true
    },
    {
      id: 'business',
      name: 'Afrikoni Business',
      price: '$99',
      period: 'per month',
      description: 'For procurement professionals',
      features: [
        'Everything in Pro',
        'Bulk RFQ management',
        'API access',
        'Custom supplier vetting',
        'Dedicated account manager',
        'Priority support (4hr response)',
        'Custom reports & analytics',
        'Multi-user accounts'
      ],
      color: 'border-purple-400',
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
            <Badge className="bg-os-accent/20 text-afrikoni-chestnut mb-4 px-4 py-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Designed for African Business Realities
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-4">
              We Only Win When You Win
            </h1>
            <p className="text-os-lg text-afrikoni-deep/80 max-w-3xl mx-auto mb-6">
              Zero upfront costs. Success fees only when your deal completes.
              Africa's fairest B2B marketplace pricing — designed for SME margins and cash flow realities.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-os-sm">
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium">No hidden fees — ever</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium">Start free today</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </header>

          {/* Fee Calculator */}
          <Card ref={calculatorRef} className="mb-12 border-os-accent/30 shadow-os-md">
            <CardHeader className="bg-gradient-to-r from-os-accent/10 to-afrikoni-cream">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-os-accent" />
                See How Much You Keep
              </CardTitle>
              <p className="text-os-sm text-afrikoni-deep/70 mt-1">
                Calculate your success fee — we only charge when your deal completes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-os-base font-semibold text-afrikoni-chestnut mb-3">
                    Order Value (USD)
                  </label>
                  <input
                    type="number"
                    value={orderValue}
                    onChange={(e) => setOrderValue(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border-2 border-os-accent/50 rounded-lg text-afrikoni-deep font-medium text-os-lg focus:ring-2 focus:ring-os-accent focus:border-os-accent shadow-sm"
                    min="0"
                    step="100"
                    placeholder="Enter order value"
                  />
                </div>
                <div>
                  <label className="block text-os-base font-semibold text-afrikoni-chestnut mb-3">
                    Seller Tier
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-os-accent/50 rounded-lg text-afrikoni-deep font-medium text-os-lg focus:ring-2 focus:ring-os-accent focus:border-os-accent shadow-sm"
                  >
                    {sellerTiers.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.emoji} {tier.name} ({tier.transactionFee}% success fee)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedTierData && selectedTierData.transactionFee && (
                <div className="mt-6 p-6 bg-gradient-to-br from-afrikoni-cream/80 to-os-accent/20 rounded-lg border-2 border-os-accent/30 shadow-md">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-os-accent/20">
                    <div>
                      <span className="text-os-lg font-semibold text-afrikoni-chestnut">Success Fee ({selectedTierData.transactionFee}%)</span>
                      <p className="text-os-xs text-afrikoni-deep/60">Only charged when deal completes</p>
                    </div>
                    <span className="text-3xl font-bold text-afrikoni-chestnut">
                      ${feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-os-lg font-semibold text-afrikoni-deep">You Keep:</span>
                    <span className="text-os-2xl font-bold text-green-700">
                      ${(orderValue - feeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-os-sm text-green-800 flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Your fee includes Afrikoni Shield protection:</strong> Secure escrow, fraud prevention,
                        48-hour dispute resolution, and full customer support. Your satisfaction or your money back.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Tiers */}
          <section ref={sellerTiersRef} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Building className="w-8 h-8" />
                For Sellers
              </h2>
              <p className="text-afrikoni-deep/80">
                Choose monthly subscription OR pay per transaction. You decide what works best for your business.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellerTiers.map((tier) => {
                const isSelectedFromQuery = searchParams.get('plan') === 'free' && tier.id === 'bronze' ||
                                          searchParams.get('plan') === 'verified' && tier.id === 'silver' ||
                                          searchParams.get('plan') === 'enterprise' && tier.id === 'enterprise';
                return (
                <Card
                  key={tier.id}
                  className={`${tier.color} ${tier.bgColor} ${tier.popular || isSelectedFromQuery ? 'ring-2 ring-os-accent' : ''} ${isSelectedFromQuery ? 'ring-4 shadow-os-md' : ''} relative transition-all`}
                >
                  {(tier.popular || isSelectedFromQuery) && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-os-accent text-white">
                      {isSelectedFromQuery ? 'Selected' : 'Most Popular'}
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{tier.emoji}</span>
                      <CardTitle className="text-os-xl">{tier.name}</CardTitle>
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
                      <p className="text-os-sm text-afrikoni-deep/70">
                        OR {tier.transactionFee}% per transaction
                      </p>
                    )}
                    <p className="text-os-sm text-afrikoni-deep/80 mt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-os-sm">
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
                );
              })}
            </div>
          </section>

          {/* Buyer Tiers */}
          <section ref={buyerTiersRef} className="mb-16">
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
                  className={`${tier.color} ${tier.popular ? 'ring-2 ring-os-accent' : ''} relative`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-os-accent text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-os-xl mb-2">{tier.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-afrikoni-chestnut">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-afrikoni-deep/70">/{tier.period}</span>
                      )}
                    </div>
                    <p className="text-os-sm text-afrikoni-deep/80">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-os-sm">
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

          {/* Transaction Fees Section - Renamed to Afrikoni Shield Protection */}
          <section ref={transactionFeesRef} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Shield className="w-8 h-8 text-os-accent" />
                Afrikoni Shield Protection
              </h2>
              <p className="text-afrikoni-deep/80 max-w-2xl mx-auto">
                Every transaction is protected. Your payment is held securely until you confirm receipt.
                We only charge a success fee when your deal completes — if it doesn't work out, you pay nothing.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`border-2 ${searchParams.get('type') === 'rfq' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-os-accent" />
                    RFQ-Based Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-2xl font-bold text-afrikoni-chestnut mb-2">2-3%</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    Fee charged on successful trades facilitated through our RFQ (Request for Quotation) system.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Applied only on completed transactions</span>
                    </li>
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Includes escrow protection and dispute resolution</span>
                    </li>
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>No upfront costs or monthly fees</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className={`border-2 ${searchParams.get('type') === 'deal' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-os-accent" />
                    Deal-Based Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-2xl font-bold text-afrikoni-chestnut mb-2">1-2%</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    Success fee on completed trades. Lower rate for high-volume sellers.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Volume discounts available</span>
                    </li>
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Negotiable for enterprise clients</span>
                    </li>
                    <li className="flex items-start gap-2 text-os-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Transparent pricing, no hidden fees</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Services Section */}
          <section ref={servicesRef} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Shield className="w-8 h-8" />
                Logistics & Trade Services
              </h2>
              <p className="text-afrikoni-deep/80">
                Optional Afrikoni-managed services to streamline your trade operations.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className={`border-2 ${searchParams.get('service') === 'logistics' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-os-accent" />
                    Logistics Coordination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-xl font-bold text-afrikoni-chestnut mb-2">Commission-based</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    End-to-end shipping support across 54 African countries.
                  </p>
                  <ul className="space-y-2 text-os-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Customs clearance assistance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Real-time tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Warehousing solutions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className={`border-2 ${searchParams.get('service') === 'verification' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-os-accent" />
                    Supplier Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-xl font-bold text-afrikoni-chestnut mb-2">One-time fee</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    KYC & business verification to build buyer trust.
                  </p>
                  <ul className="space-y-2 text-os-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Business document review</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Enhanced verification badge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Priority in search results</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className={`border-2 ${searchParams.get('service') === 'assistance' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-os-accent" />
                    Trade Assistance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-xl font-bold text-afrikoni-chestnut mb-2">Custom pricing</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    Dedicated trade coordination and support.
                  </p>
                  <ul className="space-y-2 text-os-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Personal account manager</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Negotiation support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>24/7 priority support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Features Section */}
          <section ref={featuresRef} className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8" />
                Premium Features
              </h2>
              <p className="text-afrikoni-deep/80">
                Optional platform services to boost your visibility and reach.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`border-2 ${searchParams.get('feature') === 'featured' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-os-accent" />
                    Featured Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-xl font-bold text-afrikoni-chestnut mb-2">$29/month per product</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    Boost product visibility with featured placement in search results.
                  </p>
                  <ul className="space-y-2 text-os-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Top placement in search results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Featured badge on product cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Up to 3x more views</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className={`border-2 ${searchParams.get('feature') === 'premium' ? 'border-os-accent ring-4 ring-os-accent/20' : 'border-os-accent/30'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-os-accent" />
                    Premium Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-os-xl font-bold text-afrikoni-chestnut mb-2">$99/month</p>
                  <p className="text-afrikoni-deep/80 mb-4">
                    Priority placement and promotion across the platform.
                  </p>
                  <ul className="space-y-2 text-os-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Homepage feature spots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Email newsletter inclusion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Social media promotion</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Why Afrikoni - Comparison */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                Would You Pay 3% to Avoid Losing 100%?
              </h2>
              <p className="text-afrikoni-deep/80 max-w-2xl mx-auto">
                Last year, African businesses lost $4.2 billion to trade fraud.
                Afrikoni Shield protects your money — the success fee is your insurance.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-os-md border-2 border-os-accent/30">
                <thead>
                  <tr className="bg-gradient-to-r from-os-accent/20 to-afrikoni-cream">
                    <th className="px-4 py-4 text-left font-bold text-afrikoni-chestnut">Protection</th>
                    <th className="px-4 py-4 text-center font-bold text-afrikoni-chestnut">
                      <span className="flex items-center justify-center gap-1">
                        <Shield className="w-4 h-4" />
                        Afrikoni
                      </span>
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-afrikoni-deep">WhatsApp/Direct</th>
                    <th className="px-4 py-4 text-center font-semibold text-afrikoni-deep">Local Platforms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-accent/20">
                  <tr>
                    <td className="px-4 py-3 font-medium">Success Fee</td>
                    <td className="px-4 py-3 text-center text-green-600 font-bold">2-4%</td>
                    <td className="px-4 py-3 text-center">0% (but 100% risk)</td>
                    <td className="px-4 py-3 text-center text-red-600">5-15%</td>
                  </tr>
                  <tr className="bg-afrikoni-cream/20">
                    <td className="px-4 py-3 font-medium">Payment Protection</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-os-red mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600">⚠ Limited</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Verified Suppliers</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-os-red mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-yellow-600">⚠ Basic</span>
                    </td>
                  </tr>
                  <tr className="bg-afrikoni-cream/20">
                    <td className="px-4 py-3 font-medium">Dispute Resolution</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">48-hour guarantee</td>
                    <td className="px-4 py-3 text-center text-red-600">No recourse</td>
                    <td className="px-4 py-3 text-center">Weeks</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Money-Back Guarantee</td>
                    <td className="px-4 py-3 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-os-red mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <X className="w-5 h-5 text-os-red mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-6 text-center">
              Common Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-os-accent" />
                    Why pay fees when WhatsApp is "free"?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    WhatsApp has no protection. If something goes wrong, you lose everything.
                    Our 2-4% success fee includes escrow protection, verified suppliers, and dispute resolution.
                    It's insurance for your money — would you rather pay 3% or risk losing 100%?
                  </p>
                </CardContent>
              </Card>
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-os-accent" />
                    When do I pay the success fee?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    Only when your deal completes successfully. If the transaction doesn't close,
                    or if there's a dispute ruled in your favor, you pay nothing.
                    Zero upfront costs, zero risk.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-os-accent" />
                    Is this pricing fair for African businesses?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    Yes! We designed our pricing for African SME realities: 15-25% margins and tight cash flow.
                    Our rates (2-4%) are lower than Alibaba (3-5%) and much lower than local platforms (5-15%).
                    Plans start at $29/month — less than $1 per day.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-os-accent" />
                    How do I get lower rates?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep/80">
                    Upgrade your plan! Growth members pay 3% (save 25%), Elite members pay 2% (save 50%).
                    High-volume traders can contact us for custom enterprise rates.
                    Email <a href="mailto:hello@afrikoni.com" className="text-os-accent hover:underline">hello@afrikoni.com</a>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-afrikoni-cream/50 rounded-lg p-8">
            <h2 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">
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
