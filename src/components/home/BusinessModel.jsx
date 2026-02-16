/**
 * Afrikoni Business Model & Reality Check
 * Transparent presentation of our approach, challenges, and sustainable model
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, DollarSign, Shield, 
  TrendingUp, Users, Target, Zap, AlertCircle,
  Calculator, BarChart3, Lightbulb, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Button } from '@/components/shared/ui/button';
import { useNavigate } from 'react-router-dom';

export default function BusinessModel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const successFactors = [
    { icon: CheckCircle, text: 'You solve a REAL pain point (trust in B2B trade - this exists)' },
    { icon: CheckCircle, text: 'You execute better than competitors (hard but possible)' },
    { icon: CheckCircle, text: 'You have enough capital to survive 18-24 months (need $500K-1M)' },
    { icon: CheckCircle, text: 'You focus on ONE country first, not all of Africa (critical!)' },
    { icon: CheckCircle, text: 'You build trust before scaling (slow is fast)' },
    { icon: CheckCircle, text: 'You charge fair prices (value > cost)' },
    { icon: CheckCircle, text: 'You\'re in it for 5-10 years, not a quick exit' }
  ];

  const failureFactors = [
    { icon: XCircle, text: 'You try to do everything at once (scope creep)' },
    { icon: XCircle, text: 'You scale before product-market fit' },
    { icon: XCircle, text: 'You prioritize features over trust' },
    { icon: XCircle, text: 'You run out of money before profitability' },
    { icon: XCircle, text: 'You charge too much too soon' },
    { icon: XCircle, text: 'You can\'t deliver on the 48-hour guarantee' },
    { icon: XCircle, text: 'You compete on price (race to bottom)' }
  ];

  const challenges = [
    {
      icon: Users,
      title: 'The Cold Start Problem',
      description: 'You need sellers to attract buyers, and buyers to attract sellers.',
      solution: 'Manual hustle for first 6 months - personally onboard sellers and buyers, facilitate first transactions, document success stories.'
    },
    {
      icon: Shield,
      title: 'The Trust Problem',
      description: 'Africans have been scammed online repeatedly. Default is distrust.',
      solution: 'Build trust systematically: physical presence, over-deliver on first transactions, build social proof, leverage trust as brand.'
    },
    {
      icon: DollarSign,
      title: 'The Capital Problem',
      description: 'Marketplaces burn cash before they make money.',
      solution: 'Lean startup approach: Start with $50K, prove traction, then raise or bootstrap sustainably.'
    },
    {
      icon: Zap,
      title: 'The Operational Problem',
      description: 'Managing disputes, verification, payments is HARD.',
      solution: 'Start manual, learn deeply, then automate intelligently. Never lose the human touch.'
    }
  ];

  const revenueStreams = [
    {
      icon: DollarSign,
      title: 'Transaction Fees',
      description: 'Transparent tiered pricing: 3% (Bronze), 2% (Silver), 1% (Gold)',
      potential: '$1.7M/year'
    },
    {
      icon: Users,
      title: 'Buyer Services',
      description: 'Buyer Pro ($99/month) and Enterprise ($499/month) subscriptions',
      potential: '$1.07M/year'
    },
    {
      icon: Target,
      title: 'Value-Added Services',
      description: 'Logistics, financial services, verification, advertising, academy',
      potential: '$1.2M/year'
    },
    {
      icon: BarChart3,
      title: 'Data & Intelligence',
      description: 'Market reports, API access, research partnerships',
      potential: '$540K/year'
    }
  ];

  return (
    <section className="py-16 md:py-24 lg:py-28 bg-gradient-to-b from-white to-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            AFRIKONI: A LONG-TERM INFRASTRUCTURE PLAY
          </h2>
          <p className="text-os-lg md:text-os-xl text-afrikoni-deep/80 max-w-3xl mx-auto mb-6">
            Afrikoni is not a shortcut or a hype-driven marketplace. It is a long-term effort to build the structure African trade has historically lacked.
          </p>
          <div className="inline-flex items-center gap-2 bg-os-accent/10 border border-os-accent/30 rounded-full px-6 py-3">
            <CheckCircle className="w-5 h-5 text-os-accent" aria-hidden="true" />
            <span className="text-afrikoni-chestnut font-semibold">We believe this can work if built patiently, ethically, and in collaboration with real businesses on the ground.</span>
          </div>
        </motion.div>
        
        {/* Sticky Tabs */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-os-accent/20 mb-8 -mx-4 px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-afrikoni-offwhite/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Model</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Success Factors */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-6 h-6" />
                    IT CAN WORK IF:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {successFactors.map((factor, idx) => {
                      const Icon = factor.icon;
                      return (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          className="flex items-start gap-2"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05, type: "spring" }}
                          >
                            <Icon className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          </motion.div>
                          <span className="text-afrikoni-deep text-os-sm">{factor.text}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>

              {/* Failure Factors */}
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-6 h-6" />
                    IT WILL FAIL IF:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {failureFactors.map((factor, idx) => {
                      const Icon = factor.icon;
                      return (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          className="flex items-start gap-2"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: 180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05, type: "spring" }}
                          >
                            <Icon className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          </motion.div>
                          <span className="text-afrikoni-deep text-os-sm">{factor.text}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Insight */}
            <Card className="border-os-accent/30 bg-gradient-to-br from-os-accent/10 to-afrikoni-chestnut/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <Lightbulb className="w-8 h-8 text-os-accent flex-shrink-0" />
                  <div>
                    <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-3">
                      The Honest Truth
                    </h3>
                    <p className="text-afrikoni-deep leading-relaxed mb-4">
                      Afrikoni CAN work. The market is real ($2+ trillion African B2B trade). The problem is real (trust). The opportunity is MASSIVE.
                    </p>
                    <p className="text-afrikoni-deep leading-relaxed">
                      But it requires: Brilliant execution, fair pricing, real value creation, patience, persistence, and a bit of luck.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((challenge, idx) => {
                const Icon = challenge.icon;
            return (
              <motion.div
                key={idx}
                    initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                    <Card className="h-full border-os-accent/20">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-os-accent/20 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-os-accent" />
                          </div>
                          <CardTitle className="text-os-xl">{challenge.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-afrikoni-deep mb-3">
                            <strong className="text-afrikoni-chestnut">Problem:</strong> {challenge.description}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-os-sm text-afrikoni-deep">
                            <strong className="text-green-800">Solution:</strong> {challenge.solution}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Revenue Model Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {revenueStreams.map((stream, idx) => {
                const Icon = stream.icon;
                return (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-os-accent/20 hover:border-os-accent transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-os-accent/20 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-os-accent" />
                      </div>
                          <CardTitle>{stream.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-afrikoni-deep mb-4">{stream.description}</p>
                        <div className="bg-os-accent/10 border border-os-accent/30 rounded-lg p-3">
                          <p className="text-os-sm font-semibold text-afrikoni-chestnut">
                            Revenue Potential: {stream.potential}
                          </p>
                        </div>
                    </CardContent>
                  </Card>
              </motion.div>
            );
          })}
        </div>

            {/* Disclaimer */}
            <div className="bg-afrikoni-offwhite border-l-4 border-os-accent/50 p-4 rounded-r-lg mb-6">
              <p className="text-os-sm text-afrikoni-deep/70 italic">
                Illustrative projections based on modeled assumptions, not current performance.
              </p>
            </div>

            {/* Total Revenue Projection */}
            <Card className="border-os-accent bg-gradient-to-br from-os-accent/20 to-afrikoni-chestnut/20">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">
                    Year 2-3 Revenue Projection
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-afrikoni-deep mb-2">Total Revenue</p>
                      <p className="text-4xl font-bold text-os-accent">$4.9M</p>
                    </div>
                    <div>
                      <p className="text-afrikoni-deep mb-2">Profit Margin</p>
                      <p className="text-4xl font-bold text-green-700">41%</p>
                    </div>
                  </div>
                  <p className="text-afrikoni-deep/80 text-os-sm">
                    Based on 1,000 sellers, 5,000 buyers, $10M GMV
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card className="border-os-accent/30">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">
                    Our Pricing Philosophy
                  </h3>
                  <p className="text-os-lg text-afrikoni-deep max-w-3xl mx-auto">
                    "We only make money when you succeed. Our fees are designed to be fair, transparent, and aligned with the value we provide."
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  {[
                    { tier: 'Bronze', fee: '3%', price: 'Free', color: 'from-amber-600 to-amber-700' },
                    { tier: 'Silver', fee: '2%', price: '$49/mo', color: 'from-gray-400 to-gray-500' },
                    { tier: 'Gold', fee: '1%', price: '$199/mo', color: 'from-os-accent to-os-accentDark' },
                    { tier: 'Enterprise', fee: 'Custom', price: 'Custom', color: 'from-purple-600 to-purple-700' }
                  ].map((tier, idx) => (
                    <Card key={idx} className={`bg-gradient-to-br ${tier.color} text-white border-0`}>
                      <CardContent className="p-6 text-center">
                        <h4 className="text-os-xl font-bold mb-2">{tier.tier}</h4>
                        <p className="text-os-2xl font-bold mb-1">{tier.fee}</p>
                        <p className="text-os-sm opacity-90">{tier.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-afrikoni-offwhite rounded-lg p-6 mb-6">
                  <h4 className="font-bold text-afrikoni-chestnut mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Cost Calculator Example
                  </h4>
                  <p className="text-afrikoni-deep mb-2">
                    For a <strong>$10,000 order</strong>, you'll pay <strong className="text-os-accent">$300 (3%)</strong>
                  </p>
                  <p className="text-os-sm text-afrikoni-deep/80">
                    This includes: Escrow protection, fraud prevention, dispute resolution, payment processing, customer support, and platform maintenance.
                  </p>
                  <p className="text-os-sm text-afrikoni-deep/80 mt-2">
                    Equivalent services separately would cost $500-800.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut"
                  >
                    View Full Pricing Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/contact')}
                    className="border-os-accent text-afrikoni-chestnut"
                  >
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="border-2 border-os-accent bg-gradient-to-br from-afrikoni-chestnut/10 to-afrikoni-deep/10">
            <CardContent className="p-8">
              <Heart className="w-12 h-12 text-os-accent mx-auto mb-4" />
              <h3 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Build Something Meaningful?
              </h3>
              <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
                If you decide to build it, build it RIGHT. Build it with INTEGRITY. Build it to LAST.
              </p>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut px-8 py-3"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
