import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Mail, Phone, MapPin, AlertTriangle, TrendingUp, Shield, Target, DollarSign, Users, Globe, CheckCircle, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { Input } from '@/components/shared/ui/input';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

export default function Investors() {
  const { trackPageView } = useAnalytics();
  const [email, setEmail] = React.useState('');

  useEffect(() => {
    trackPageView('Investors');
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email,
          source: 'investor_updates',
          subscribed_at: new Date().toISOString()
        });
      
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
      
      toast.success('Thank you for subscribing to investor updates!');
      setEmail('');
    } catch (error) {
      // Fallback: store in localStorage
      const existing = JSON.parse(localStorage.getItem('investorSubscribers') || '[]');
      if (!existing.includes(email)) {
        localStorage.setItem('investorSubscribers', JSON.stringify([...existing, email]));
        toast.success('Thank you for subscribing to investor updates!');
        setEmail('');
      } else {
        toast.info('You are already subscribed!');
      }
    }
  };

  const brutalRealities = [
    {
      icon: AlertTriangle,
      title: 'We Are Not a Unicorn (Yet)',
      description: 'We are a Beta marketplace with real demand, real suppliers, and real transactions. We prioritize trust and quality over fake scale. No inflated numbers, no empty listings, no misleading metrics.',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Target,
      title: 'RFQ-First, Not Product-First',
      description: 'We are demand-driven. Buyers post requests first. Suppliers respond to real demand. This is intentional. We onboard buyers first, then suppliers based on actual need. Quality > quantity.',
      color: 'text-afrikoni-purple'
    },
    {
      icon: Shield,
      title: 'Trust is Our Product',
      description: 'Every supplier is verified. Every transaction is escrow-protected. Every shipment is tracked. We invest in KYC, AML, and anti-corruption measures. This costs money. This is our moat.',
      color: 'text-afrikoni-green'
    },
    {
      icon: TrendingUp,
      title: 'Sustainable Unit Economics',
      description: 'We charge for value: subscription fees, transaction fees, verification fees. We are not burning cash on fake growth. We are building a sustainable business that serves real African businesses.',
      color: 'text-afrikoni-red'
    }
  ];

  const sustainableModel = [
    {
      metric: 'Revenue Streams',
      value: '3',
      description: 'Subscriptions, Transaction Fees, Verification Services'
    },
    {
      metric: 'Customer Acquisition',
      value: 'Organic',
      description: 'Word-of-mouth, RFQ-driven demand, verified supplier network'
    },
    {
      metric: 'Unit Economics',
      value: 'Positive',
      description: 'Each transaction generates revenue. No loss-leader strategy.'
    },
    {
      metric: 'Market Size',
      value: '54 Countries',
      description: 'All of Africa. Real demand. Real suppliers. Real opportunity.'
    }
  ];

  return (
    <>
      <SEO
        title="AFRIKONI: BRUTAL REALITY CHECK & SUSTAINABLE BUSINESS MODEL - For Investors"
        description="Brutal honesty about Afrikoni's Beta status, RFQ-first approach, trust infrastructure, and sustainable business model. No fake metrics. Real demand. Real opportunity."
        url="/investors"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section - Brutal Reality Check */}
        <section className="bg-gradient-to-br from-afrikoni-deep via-afrikoni-chestnut to-afrikoni-deep py-16 md:py-24 text-afrikoni-cream">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-afrikoni-gold" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                AFRIKONI: BRUTAL REALITY CHECK &<br />SUSTAINABLE BUSINESS MODEL
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8">
                For Investors Who Value Honesty Over Hype
              </p>
              <p className="text-lg text-afrikoni-cream/80 max-w-3xl mx-auto">
                We are a Beta marketplace. We prioritize trust, quality, and sustainable growth over fake scale. 
                This document is for investors who want the truth, not the pitch.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Brutal Realities */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                The Brutal Truth
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                What you need to know before investing
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {brutalRealities.map((reality, idx) => {
                const Icon = reality.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-2 border-afrikoni-gold/30 h-full hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-6 h-6 ${reality.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-afrikoni-chestnut mb-3">
                              {reality.title}
                            </h3>
                            <p className="text-afrikoni-deep/80 leading-relaxed">
                              {reality.description}
          </p>
        </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
                  </div>
        </section>

        {/* Sustainable Business Model */}
        <section className="py-16 md:py-20 bg-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Sustainable Business Model
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                How we make money without burning cash
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {sustainableModel.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-afrikoni-gold/20 text-center h-full">
                    <CardContent className="p-6">
                      <div className="text-4xl font-bold text-afrikoni-gold mb-2">
                        {item.value}
                </div>
                      <h3 className="text-lg font-bold text-afrikoni-chestnut mb-2">
                        {item.metric}
                      </h3>
                      <p className="text-sm text-afrikoni-deep/70">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-4 text-center">
                    Why This Model Works
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-afrikoni-green flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-afrikoni-chestnut mb-1">Demand-Driven Growth</h4>
                          <p className="text-afrikoni-deep/80 text-sm">
                            RFQ-first approach means we only onboard suppliers when there's real demand. No wasted resources on empty listings.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-afrikoni-green flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-afrikoni-chestnut mb-1">Trust as Moat</h4>
                          <p className="text-afrikoni-deep/80 text-sm">
                            Our verification, escrow, and compliance infrastructure is expensive to replicate. This is our competitive advantage.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-afrikoni-green flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-afrikoni-chestnut mb-1">Multiple Revenue Streams</h4>
                          <p className="text-afrikoni-deep/80 text-sm">
                            Subscriptions, transaction fees, and verification services create a diversified, sustainable revenue model.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-afrikoni-green flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-afrikoni-chestnut mb-1">Real Unit Economics</h4>
                          <p className="text-afrikoni-deep/80 text-sm">
                            Every transaction generates revenue. We don't subsidize losses. We build a business that works from day one.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* What We're NOT */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                What We're NOT
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-2">We're NOT a Unicorn</h3>
                      <p className="text-afrikoni-deep/80 text-sm">
                        We don't have millions of users. We don't have billions in GMV. We have real businesses, real transactions, and real trust. That's enough.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-2">We're NOT Burning Cash</h3>
                      <p className="text-afrikoni-deep/80 text-sm">
                        We don't spend millions on marketing. We don't subsidize transactions. We build trust, one verified supplier at a time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-2">We're NOT Product-First</h3>
                      <p className="text-afrikoni-deep/80 text-sm">
                        We don't fill the marketplace with fake listings. We start with demand (RFQs), then match suppliers. Quality over quantity.
                      </p>
                    </div>
            </div>
          </CardContent>
        </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-2">We're NOT a Quick Flip</h3>
                      <p className="text-afrikoni-deep/80 text-sm">
                        Building trust infrastructure takes time. We're building for the long term. If you want quick returns, look elsewhere.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Investor Contact */}
        <section className="py-16 md:py-20 bg-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-afrikoni-gold">
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut text-center">
                    Ready to Invest in Real Trust?
                  </CardTitle>
                </CardHeader>
          <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-afrikoni-gold" />
                        Investor Relations
                      </h3>
                <div className="space-y-3">
                        <a href="mailto:investors@afrikoni.com" className="text-afrikoni-deep hover:text-afrikoni-gold block">
                      investors@afrikoni.com
                    </a>
                        <a href="tel:+32456779368" className="text-afrikoni-deep hover:text-afrikoni-gold block">
                      +32 456 77 93 68
                    </a>
                  </div>
                </div>
                    <div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-afrikoni-gold" />
                        Headquarters
                      </h3>
                      <div className="text-afrikoni-deep">
                        <p className="font-medium mb-1">Afrikoni Limited</p>
                        <p>Antwerpselaan 20</p>
                        <p>1000 Brussels, Belgium</p>
                      </div>
                    </div>
                  </div>

        {/* Investor Updates Subscribe */}
                  <div className="border-t border-afrikoni-gold/20 pt-8">
                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-4 text-center">
                      Receive Investor Updates
              </h3>
                    <p className="text-sm text-afrikoni-deep/70 mb-6 text-center max-w-2xl mx-auto">
                      Get periodic updates on traction, product roadmap, and fundraising. No spam. Just honest updates.
              </p>
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your work email"
                        className="flex-1"
                        required
              />
                      <Button type="submit" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                Subscribe
              </Button>
            </form>
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
