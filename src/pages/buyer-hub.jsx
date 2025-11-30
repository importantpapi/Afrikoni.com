import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Shield, Users, FileText, Truck, BookOpen, CheckCircle, Search, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function BuyerHub() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Buyer Hub');
  }, []);

  const whyBuyFeatures = [
    {
      icon: Users,
      title: 'Verified Suppliers',
      description: 'Connect with pre-verified African suppliers you can trust',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Shield,
      title: 'Trade Shield Protection',
      description: 'Secure escrow and quality guarantees on every order',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Find exactly what you need with advanced filters and AI matching',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: FileText,
      title: 'RFQ Marketplace',
      description: 'Post requests and get competitive quotes from multiple suppliers',
      color: 'bg-afrikoni-offwhite text-afrikoni-gold'
    }
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Search & Discover',
      description: 'Browse products or post an RFQ to find the right suppliers',
      icon: Search
    },
    {
      step: 2,
      title: 'Compare & Choose',
      description: 'Compare prices, MOQs, and supplier credentials',
      icon: Award
    },
    {
      step: 3,
      title: 'Place Order',
      description: 'Secure order with Trade Shield protection',
      icon: ShoppingBag
    },
    {
      step: 4,
      title: 'Track & Receive',
      description: 'Track shipment and confirm receipt to release payment',
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

      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-afrikoni-cream-100/30">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-creammb-4">
                Buyer Hub
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream-100 max-w-3xl mx-auto mb-8">
                Source products from verified African suppliers with confidence. Trade Shield protection, RFQ marketplace, and logistics support.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Start Sourcing
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="border-white text-afrikoni-creamhover:bg-afrikoni-offwhite/10">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* Why Buy on Afrikoni */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Why Buy on Afrikoni?
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Everything you need to source products safely across Africa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyBuyFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">{feature.title}</h3>
                        <p className="text-afrikoni-deep">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* How Sourcing Works */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How Sourcing Works
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                A simple 4-step process to source products from Africa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorksSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <Badge variant="outline" className="text-afrikoni-gold border-afrikoni-gold">
                            Step {step.step}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-afrikoni-deep">{step.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Additional Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Verified Suppliers Program */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Users className="w-8 h-8 text-afrikoni-gold" />
                  Verified Suppliers Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-afrikoni-deep">
                  All suppliers on Afrikoni go through a rigorous verification process including:
                </p>
                <ul className="space-y-2">
                  {['Business registration verification', 'Identity verification (KYC)', 'Bank account verification', 'Trade history review', 'Quality certifications'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/suppliers">
                  <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Browse Verified Suppliers
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* RFQ Marketplace */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <FileText className="w-8 h-8 text-afrikoni-gold" />
                  RFQ Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-afrikoni-deep">
                  Post a Request for Quotation and receive competitive quotes from multiple suppliers:
                </p>
                <ul className="space-y-2">
                  {['Specify your requirements', 'Receive multiple quotes', 'Compare prices and terms', 'Choose the best supplier'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/rfq/create">
                  <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Post an RFQ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <section className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Start Sourcing?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Join thousands of buyers sourcing products from verified African suppliers
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}

