import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Shield, Users, FileText, Truck, Search, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

export default function BuyerHub() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Buyer Hub');
  }, []);

  const whyBuyFeatures = [
    {
      icon: Users,
      title: 'Verified Suppliers',
      description: 'Connect with pre-verified African suppliers you can trust. All suppliers undergo rigorous KYC/KYB verification before joining the platform.',
    },
    {
      icon: Shield,
      title: 'Trade Shield Protection',
      description: 'Secure escrow and quality guarantees on every order. Your payment is held safely until you confirm receipt of goods.',
    },
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Find exactly what you need with advanced filters and AI matching. Search by product, category, country, or supplier credentials.',
    },
    {
      icon: FileText,
      title: 'RFQ Marketplace',
      description: 'Post requests and get competitive quotes from multiple suppliers. Compare prices, MOQs, and terms in one place.',
    }
  ];

  const howItWorksSteps = [
    {
      number: 1,
      title: 'Search & Discover',
      description: 'Browse products or post an RFQ to find the right suppliers. Use advanced filters to match your exact requirements.',
      icon: Search
    },
    {
      number: 2,
      title: 'Compare & Choose',
      description: 'Compare prices, MOQs, and supplier credentials. Review reliability scores, ratings, and trade history to make informed decisions.',
      icon: Award
    },
    {
      number: 3,
      title: 'Place Order',
      description: 'Secure order with Trade Shield protection. Funds are held in escrow until you confirm receipt of goods.',
      icon: ShoppingBag
    },
    {
      number: 4,
      title: 'Track & Receive',
      description: 'Track shipment and confirm receipt to release payment. Optional inspections available for quality assurance.',
      icon: Truck
    }
  ];

  return (
    <>
      <SEO
        title="Buyer Hub - Source Products from Verified African Suppliers | Afrikoni"
        description="Discover how to source products from verified African suppliers. Learn about Trade Shield protection, RFQ system, and logistics support."
        url="/buyer-hub"
      />

      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Buyer Hub"
          title="Source Products from Verified African Suppliers"
          subtitle="Source products from verified African suppliers with confidence. Trade Shield protection, RFQ marketplace, and logistics support."
          primaryCTA={{ label: 'Start Sourcing', to: '/signup' }}
          secondaryCTA={{ label: 'Browse Products', to: '/marketplace' }}
        />

        {/* Why Buy on Afrikoni */}
        <SystemPageSection
          title="Why Buy on Afrikoni?"
          subtitle="Everything you need to source products safely across Africa"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyBuyFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <SystemPageCard
                  key={idx}
                  icon={Icon}
                  title={feature.title}
                >
                  {feature.description}
                </SystemPageCard>
              );
            })}
          </div>
        </SystemPageSection>

        {/* How Sourcing Works */}
        <SystemPageSection
          title="How Sourcing Works"
          subtitle="A simple 4-step process to source products from Africa"
        >
          <SystemPageTimeline steps={howItWorksSteps} />
        </SystemPageSection>

        {/* Additional Sections */}
        <SystemPageSection>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Verified Suppliers Program */}
            <Card className="border-os-accent/30 bg-afrikoni-cream">
              <CardHeader>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut flex items-center gap-3">
                  <Users className="w-8 h-8 text-os-accent" />
                  Verified Suppliers Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  All suppliers on Afrikoni go through a rigorous verification process including:
                </p>
                <ul className="space-y-2">
                  {['Business registration verification', 'Identity verification (KYC)', 'Bank account verification', 'Trade history review', 'Quality certifications'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                      <span className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/suppliers">
                  <Button className="w-full bg-os-accent hover:bg-os-accentDark text-white">
                    Browse Verified Suppliers
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* RFQ Marketplace */}
            <Card className="border-os-accent/30 bg-afrikoni-cream">
              <CardHeader>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut flex items-center gap-3">
                  <FileText className="w-8 h-8 text-os-accent" />
                  RFQ Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  Post a Request for Quotation and receive competitive quotes from multiple suppliers:
                </p>
                <ul className="space-y-2">
                  {['Specify your requirements', 'Receive multiple quotes', 'Compare prices and terms', 'Choose the best supplier'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                      <span className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/rfq/create">
                  <Button className="w-full bg-os-accent hover:bg-os-accentDark text-white">
                    Post an RFQ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Ready to Start Sourcing?"
          description="Join thousands of buyers sourcing products from verified African suppliers"
          ctaLabel="Create Free Account"
          ctaTo="/signup"
        />
      </div>
    </>
  );
}
