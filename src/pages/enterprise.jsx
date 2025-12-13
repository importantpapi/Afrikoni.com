/**
 * Enterprise Page
 * For large businesses and enterprise clients
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, Users, Shield, TrendingUp, CheckCircle, ArrowRight, 
  Zap, Globe, Lock, BarChart3, HeadphonesIcon, FileText, 
  Settings, Award, Target, Sparkles
} from 'lucide-react';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

export default function Enterprise() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: 'Dedicated Account Manager',
      description: 'Personal support from a dedicated account manager who understands your business needs and helps you maximize your trading potential.',
      color: 'from-blue-500/20 to-blue-600/20'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user accounts with role-based permissions, team dashboards, and collaborative workflows for your entire organization.',
      color: 'from-purple-500/20 to-purple-600/20'
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Advanced security features, custom contracts, priority dispute resolution, and enterprise-grade compliance support.',
      color: 'from-green-500/20 to-green-600/20'
    },
    {
      icon: TrendingUp,
      title: 'Volume Discounts',
      description: 'Special pricing and discounts for high-volume transactions, long-term partnerships, and exclusive access to premium suppliers.',
      color: 'from-orange-500/20 to-orange-600/20'
    },
    {
      icon: Zap,
      title: 'API Integration',
      description: 'Seamless API integration with your existing systems, ERP connections, and custom workflow automation.',
      color: 'from-yellow-500/20 to-yellow-600/20'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Access to suppliers across all 54 African countries with priority matching and dedicated logistics coordination.',
      color: 'from-indigo-500/20 to-indigo-600/20'
    },
    {
      icon: Lock,
      title: 'Custom Contracts',
      description: 'Tailored contract terms, payment schedules, and service level agreements designed for your business requirements.',
      color: 'from-red-500/20 to-red-600/20'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive reporting, market insights, supplier performance metrics, and custom dashboards for data-driven decisions.',
      color: 'from-teal-500/20 to-teal-600/20'
    }
  ];

  const benefits = [
    {
      icon: HeadphonesIcon,
      title: '24/7 Priority Support',
      description: 'Round-the-clock dedicated support with guaranteed response times'
    },
    {
      icon: FileText,
      title: 'Custom Onboarding',
      description: 'Personalized setup and training for your team'
    },
    {
      icon: Settings,
      title: 'White-Label Options',
      description: 'Custom branding and integration options available'
    },
    {
      icon: Award,
      title: 'Exclusive Access',
      description: 'Early access to new features and premium suppliers'
    }
  ];

  return (
    <>
      <SEO 
        title="Enterprise Solutions - Afrikoni | AFRIKONI"
        description="Enterprise B2B trade solutions for large businesses. Dedicated support, volume discounts, and custom integrations."
        url="/enterprise"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut py-20 md:py-28 lg:py-32 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-20 w-96 h-96 bg-afrikoni-gold/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-afrikoni-gold/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-cream mb-6 leading-tight">
                  Enterprise Solutions
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8 leading-relaxed"
              >
                Tailored B2B trade solutions for large businesses. Scale your operations with dedicated support, volume discounts, and custom integrations.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate('/contact')}
                    size="lg"
                    className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all hover:ring-4 hover:ring-afrikoni-gold/50 group"
                  >
                    Contact Sales
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    size="lg"
                    className="border-2 border-afrikoni-gold/70 text-afrikoni-cream hover:bg-afrikoni-gold/20 px-8 py-6 text-lg font-semibold backdrop-blur-sm"
                  >
                    Schedule Demo
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 lg:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-afrikoni-gold" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut">
                  Enterprise Features
                </h2>
              </div>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
                Everything you need to scale your B2B trade operations across Africa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Card className="h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-xl bg-white group">
                      <CardContent className="p-6 md:p-8">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:shadow-lg transition-all`}
                        >
                          <Icon className="w-7 h-7 text-afrikoni-gold" />
                        </motion.div>
                        <h3 className="font-bold text-lg text-afrikoni-chestnut mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-sm md:text-base text-afrikoni-deep/80 leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 lg:py-28 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Why Choose Enterprise?
              </h2>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
                Exclusive benefits designed for large-scale operations
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-lg bg-gradient-to-br from-white to-afrikoni-offwhite">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-afrikoni-gold/20 flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-8 h-8 text-afrikoni-gold" />
                        </div>
                        <h3 className="font-bold text-lg text-afrikoni-chestnut mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-afrikoni-deep/80 leading-relaxed">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="py-16 md:py-24 lg:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Enterprise Pricing
              </h2>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
                Custom pricing tailored to your business volume and needs
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="border-2 border-afrikoni-gold/20 h-full">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-4">Standard</h3>
                    <div className="text-4xl font-bold text-afrikoni-gold mb-6">
                      Custom
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Standard support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Volume discounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Multi-user accounts</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="md:scale-105"
              >
                <Card className="border-2 border-afrikoni-gold shadow-2xl h-full bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-chestnut/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-afrikoni-gold text-afrikoni-chestnut px-4 py-1 text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-4">Enterprise</h3>
                    <div className="text-4xl font-bold text-afrikoni-gold mb-6">
                      Custom
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep font-semibold">Dedicated account manager</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep font-semibold">24/7 priority support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep font-semibold">API integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep font-semibold">Custom contracts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep font-semibold">Advanced analytics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="border-2 border-afrikoni-gold/20 h-full">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-4">Custom</h3>
                    <div className="text-4xl font-bold text-afrikoni-gold mb-6">
                      Bespoke
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Everything in Enterprise</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">White-label options</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Custom integrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">Dedicated infrastructure</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 lg:py-28 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Card className="border-2 border-afrikoni-gold/30 shadow-2xl bg-gradient-to-br from-white to-afrikoni-offwhite">
                <CardContent className="p-10 md:p-14">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Target className="w-10 h-10 text-afrikoni-gold" />
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut">
                      Ready to Scale Your Business?
                    </h2>
                  </div>
                  <p className="text-lg md:text-xl text-afrikoni-deep mb-8 max-w-2xl mx-auto leading-relaxed">
                    Contact our enterprise team to discuss custom solutions tailored to your business needs and volume requirements.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => navigate('/contact')}
                        size="lg"
                        className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldDark px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all hover:ring-4 hover:ring-afrikoni-gold/50 group"
                      >
                        Get Started
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => navigate('/contact')}
                        size="lg"
                        variant="outline"
                        className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-6 text-lg font-semibold"
                      >
                        Schedule Demo
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
