import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, FileText, Lock, Award, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function OrderProtection() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Order Protection');
  }, []);

  const protectionSteps = [
    {
      step: 1,
      title: 'Place Order',
      description: 'Buyer places order with verified supplier through Afrikoni platform',
      icon: FileText,
      color: 'blue'
    },
    {
      step: 2,
      title: 'Supplier Confirms',
      description: 'Supplier confirms order and prepares goods for shipment',
      icon: CheckCircle,
      color: 'green'
    },
    {
      step: 3,
      title: 'Shipping Partner Picks Up',
      description: 'Afrikoni-approved logistics partner collects and ships goods',
      icon: Truck,
      color: 'orange'
    },
    {
      step: 4,
      title: 'Buyer Confirms Receipt',
      description: 'Buyer receives and confirms goods, payment released to supplier',
      icon: Award,
      color: 'purple'
    }
  ];

  const protectionFeatures = [
    {
      icon: Shield,
      title: 'Escrow Protection',
      description: 'Your payment is held securely until you confirm receipt of goods',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Lock,
      title: 'Secure Transactions',
      description: 'Bank-grade encryption and secure payment processing',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'Money-back guarantee if goods don\'t match description',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: Users,
      title: 'Verified Suppliers',
      description: 'Only verified and trusted suppliers eligible for Trade Shield',
      color: 'bg-afrikoni-offwhite text-afrikoni-gold'
    }
  ];

  return (
    <>
      <SEO
        title="Afrikoni Trade Shield - Order Protection | Afrikoni"
        description="Protect your B2B transactions with Afrikoni Trade Shield. Secure escrow, quality guarantee, and dispute resolution for safe trading across Africa."
        url="/order-protection"
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
              <div className="inline-flex items-center gap-2 bg-afrikoni-gold/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5 text-afrikoni-goldLight" />
                <span className="text-afrikoni-goldLight font-semibold">Afrikoni Trade Shield</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-creammb-4">
                Trade with Confidence Across Africa
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream-100 max-w-3xl mx-auto mb-8">
                Your orders are protected by our comprehensive escrow system, quality guarantees, and dispute resolution
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Start Trading Safely
                  </Button>
                </Link>
                <Link to="/suppliers">
                  <Button size="lg" variant="outline" className="border-white text-afrikoni-creamhover:bg-afrikoni-offwhite/10">
                    Find Verified Suppliers
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* How It Works */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How Afrikoni Trade Shield Works
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                A simple, secure 4-step process that protects both buyers and suppliers
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {protectionSteps.map((step, idx) => {
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
                          <div className={`w-12 h-12 rounded-full bg-${step.color}-100 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 text-${step.color}-600`} />
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

          {/* Protection Features */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                What's Protected
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Comprehensive protection for your B2B transactions
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {protectionFeatures.map((feature, idx) => {
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

          {/* Dispute Resolution */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-goldDark/10 border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-afrikoni-gold" />
                  Dispute Resolution
                </CardTitle>
                <CardDescription className="text-lg">
                  Fair and transparent dispute resolution process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">24/7 Support</h4>
                    <p className="text-afrikoni-deep">Our team is available around the clock to help resolve any issues</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">Mediation Process</h4>
                    <p className="text-afrikoni-deep">Neutral mediation to find fair solutions for both parties</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">Money-Back Guarantee</h4>
                    <p className="text-afrikoni-deep">Full refund if goods don't match description or quality standards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Trade Safely?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Join thousands of businesses trading securely on Afrikoni
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Get Started
                  </Button>
                </Link>
                <Link to="/suppliers">
                  <Button size="lg" variant="outline" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                    Browse Verified Suppliers
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

