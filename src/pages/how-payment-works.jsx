import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, CheckCircle, ArrowRight, CreditCard, Clock, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TrustBadge from '@/components/shared/ui/TrustBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HowPaymentWorks() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const paymentSteps = [
    {
      icon: CreditCard,
      title: '1. Secure Payment',
      description: 'Buyer makes payment into Afrikoni escrow account. Funds are held securely and cannot be accessed by supplier until delivery is confirmed.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Truck,
      title: '2. Product Delivery',
      description: 'Supplier ships the product. Buyer receives and inspects the order. Delivery tracking is available throughout the process.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: CheckCircle,
      title: '3. Confirmation',
      description: 'Buyer confirms receipt and quality. If satisfied, payment is automatically released to supplier. If not, dispute process begins.',
      color: 'text-os-accent',
      bgColor: 'bg-os-accent/20'
    },
    {
      icon: Users,
      title: '4. Transaction Complete',
      description: 'Funds are released to supplier. Both parties can leave reviews. Transaction is complete and secure.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const trustBadges = [
    { type: 'buyer-protection' },
    { type: 'escrow-payment' },
    { type: 'verified-supplier' }
  ];

  return (
    <>
      <SEO 
        title="How Payment Works - Afrikoni Escrow System"
        description="Learn how Afrikoni's secure escrow payment system protects buyers and sellers in B2B transactions across Africa."
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="w-12 h-12 md:w-16 md:h-16 text-os-accent" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut">
                How Payment Works
              </h1>
            </div>
            <p className="text-os-lg md:text-os-xl text-afrikoni-deep max-w-3xl mx-auto mb-6">
              Secure escrow payments protect both buyers and sellers. Your funds are safe until delivery is confirmed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {trustBadges.map((badge, idx) => (
                <TrustBadge key={idx} type={badge.type} />
              ))}
            </div>
          </motion.div>

          {/* Payment Flow */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-6 md:mb-8 text-center">
              The Escrow Payment Process
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-os-accent/20 hover:border-os-accent transition-all shadow-md hover:shadow-os-lg">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${step.bgColor} mb-3`}>
                          <Icon className={`w-6 h-6 ${step.color}`} />
                        </div>
                        <CardTitle className="text-os-lg font-bold text-afrikoni-chestnut">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-afrikoni-deep leading-relaxed text-os-sm">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Visual Flow Diagram */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20 shadow-os-md">
              <CardHeader>
                <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut text-center">
                  Payment Flow Diagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 py-8">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <CreditCard className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Buyer Pays</h3>
                    <p className="text-os-sm text-afrikoni-deep">Funds held in escrow</p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-os-accent hidden md:block" />
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Truck className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Product Shipped</h3>
                    <p className="text-os-sm text-afrikoni-deep">Delivery in progress</p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-os-accent hidden md:block" />
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-os-accent/20 flex items-center justify-center mb-3">
                      <CheckCircle className="w-10 h-10 text-os-accent" />
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Buyer Confirms</h3>
                    <p className="text-os-sm text-afrikoni-deep">Quality verified</p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-os-accent hidden md:block" />
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Payment Released</h3>
                    <p className="text-os-sm text-afrikoni-deep">Transaction complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Benefits */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-6 md:mb-8 text-center">
              Why Escrow Payments?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-os-accent/20">
                <CardHeader>
                  <Shield className="w-8 h-8 text-green-600 mb-3" />
                  <CardTitle className="text-os-xl font-bold text-afrikoni-chestnut">
                    Buyer Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep text-os-sm">
                    Your money is safe. If the product doesn't match the description or arrives damaged, you get a full refund.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-os-accent/20">
                <CardHeader>
                  <Clock className="w-8 h-8 text-blue-600 mb-3" />
                  <CardTitle className="text-os-xl font-bold text-afrikoni-chestnut">
                    Guaranteed Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep text-os-sm">
                    Suppliers receive payment immediately after delivery confirmation. No payment delays or disputes.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-os-accent/20">
                <CardHeader>
                  <Lock className="w-8 h-8 text-purple-600 mb-3" />
                  <CardTitle className="text-os-xl font-bold text-afrikoni-chestnut">
                    Secure Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-afrikoni-deep text-os-sm">
                    All payments are encrypted and processed through secure banking infrastructure. Your financial data is protected.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Delivery Guarantee Rules */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20 bg-gradient-to-r from-os-accent/10 to-afrikoni-chestnut/10">
              <CardHeader>
                <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut">
                  Delivery Guarantee Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut mb-1">Quality Match Guarantee</h4>
                      <p className="text-os-sm text-afrikoni-deep">
                        Product must match the description and images. If not, full refund within 7 days.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut mb-1">Delivery Time Protection</h4>
                      <p className="text-os-sm text-afrikoni-deep">
                        If delivery exceeds agreed timeframe by more than 50%, buyer can cancel and get full refund.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut mb-1">Damage Protection</h4>
                      <p className="text-os-sm text-afrikoni-deep">
                        Products damaged during shipping are covered. Full refund or replacement guaranteed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-r from-os-accent/20 to-afrikoni-chestnut/20 rounded-os-md p-8 md:p-12"
          >
            <h2 className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
              Ready to Trade Securely?
            </h2>
            <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
              Start trading with confidence. Our escrow system protects every transaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button className="bg-os-accent hover:bg-os-accentDark text-afrikoni-charcoal">
                  Create Account
                </Button>
              </Link>
              <Link to="/trust">
                <Button variant="outline" className="border-os-accent text-afrikoni-chestnut hover:bg-afrikoni-sand/20">
                  Learn More About Trust
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// Export modal component for use in checkout
export function PaymentWorksModal({ children, trigger, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-os-2xl font-bold text-afrikoni-chestnut">
            How Payment Works
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children || <HowPaymentWorks />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

