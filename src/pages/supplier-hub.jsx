import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Package, FileText, Award, Users, TrendingUp, CheckCircle, Shield, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function SupplierHub() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Supplier Hub');
  }, []);

  const whySellFeatures = [
    {
      icon: Users,
      title: 'Access to Buyers',
      description: 'Connect with buyers from across Africa and beyond',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: DollarSign,
      title: 'Grow Your Sales',
      description: 'Expand your customer base and increase revenue',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Get paid securely through our escrow system',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Business Tools',
      description: 'Analytics, inventory management, and marketing tools',
      color: 'bg-afrikoni-offwhite text-afrikoni-gold'
    }
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Create Account',
      description: 'Sign up and complete your company profile',
      icon: Users
    },
    {
      step: 2,
      title: 'Get Verified',
      description: 'Complete verification to earn Trust Shield badge',
      icon: Award
    },
    {
      step: 3,
      title: 'List Products',
      description: 'Add your products with photos and descriptions',
      icon: Package
    },
    {
      step: 4,
      title: 'Receive Orders',
      description: 'Respond to RFQs and receive orders from buyers',
      icon: FileText
    }
  ];

  return (
    <>
      <SEO
        title="Supplier Hub - Sell Products to Buyers Across Africa | Afrikoni"
        description="Learn how to sell on Afrikoni. List products, get verified, respond to RFQs, and grow your business with secure payments and buyer protection."
        url="/supplier-hub"
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
                Supplier Hub
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream-100 max-w-3xl mx-auto mb-8">
                Sell your products to buyers across Africa. Get verified, list products, respond to RFQs, and grow your business.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Start Selling
                  </Button>
                </Link>
                <Link to="/verification-center">
                  <Button size="lg" variant="outline" className="border-white text-afrikoni-creamhover:bg-afrikoni-offwhite/10">
                    Get Verified
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* Why Sell on Afrikoni */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Why Sell on Afrikoni?
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Everything you need to grow your business and reach new customers
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whySellFeatures.map((feature, idx) => {
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

          {/* How Selling Works */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How Selling Works
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                A simple 4-step process to start selling on Afrikoni
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
            {/* Verification Process */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Award className="w-8 h-8 text-afrikoni-gold" />
                  Verification Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-afrikoni-deep">
                  Get verified to earn buyer trust and increase sales:
                </p>
                <ul className="space-y-2">
                  {['Email & phone verification', 'Business registration', 'Identity verification (KYC)', 'Bank account verification', 'Trade history review'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/verification-center">
                  <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Start Verification
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* RFQ Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <FileText className="w-8 h-8 text-afrikoni-gold" />
                  Respond to RFQs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-afrikoni-deep">
                  Receive and respond to buyer requests for quotations:
                </p>
                <ul className="space-y-2">
                  {['Browse active RFQs', 'Submit competitive quotes', 'Win more orders', 'Build buyer relationships'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard/rfqs">
                  <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    View RFQs
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
                Ready to Start Selling?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Join thousands of suppliers growing their business on Afrikoni
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/dashboard/products">
                  <Button size="lg" variant="outline" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                    List Products
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

