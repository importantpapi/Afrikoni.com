import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, FileText, MessageSquare, Eye, Database, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import TrustBadge from '@/components/shared/ui/TrustBadge';
import { Button } from '@/components/shared/ui/button';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';

export default function TrustCenter() {
  const { t } = useLanguage();

  const trustFeatures = [
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Your funds are held securely in escrow until you confirm delivery. Full refund if product doesn\'t match description.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Lock,
      title: 'Secure Escrow Payments',
      description: 'All transactions use our secure escrow system. Funds are only released after delivery confirmation.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: CheckCircle,
      title: 'Verified Suppliers',
      description: 'Every supplier undergoes thorough verification including business documents, tax certificates, and identity checks.',
      color: 'text-os-accent',
      bgColor: 'bg-os-accent/20'
    },
    {
      icon: Database,
      title: 'Data & Privacy Safety',
      description: 'Your data is encrypted and protected. We comply with GDPR and international data protection standards.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const verificationSteps = [
    {
      step: 1,
      title: 'Business Registration',
      description: 'Submit business license and registration documents'
    },
    {
      step: 2,
      title: 'Tax Verification',
      description: 'Provide tax identification number and certificates'
    },
    {
      step: 3,
      title: 'Identity Check',
      description: 'Verify company representatives and authorized signatories'
    },
    {
      step: 4,
      title: 'Address Verification',
      description: 'Confirm business address and physical location'
    },
    {
      step: 5,
      title: 'Bank Account Verification',
      description: 'Verify business bank account for secure payments'
    }
  ];

  return (
    <>
      <SEO 
        title="Trust Center - Afrikoni B2B Marketplace"
        description="Learn how Afrikoni protects buyers and sellers with escrow payments, verified suppliers, and comprehensive buyer protection."
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
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-os-accent" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut">
                Trust Center
              </h1>
            </div>
            <p className="text-os-lg md:text-os-xl text-afrikoni-deep max-w-3xl mx-auto">
              Your security and trust are our top priorities. Learn how we protect every transaction on Afrikoni.
            </p>
          </motion.div>

          {/* Why Trust Afrikoni */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-6 md:mb-8 text-center">
              Why Trust Afrikoni?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustFeatures.map((feature, idx) => {
                const Icon = feature.icon;
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
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.bgColor} mb-3`}>
                          <Icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                        <CardTitle className="text-os-xl font-bold text-afrikoni-chestnut">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-afrikoni-deep leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Escrow / Buyer Protection */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20 shadow-os-md">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-8 h-8 text-os-accent" />
                  <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut">
                    Escrow & Buyer Protection
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-os-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Payment Secured</h3>
                    <p className="text-os-sm text-afrikoni-deep">Buyer pays into escrow account. Funds are held securely.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-os-2xl font-bold text-green-600">2</span>
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Delivery Confirmed</h3>
                    <p className="text-os-sm text-afrikoni-deep">Supplier ships product. Buyer confirms receipt and quality.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-os-accent/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-os-2xl font-bold text-os-accent">3</span>
                    </div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">Funds Released</h3>
                    <p className="text-os-sm text-afrikoni-deep">Payment released to supplier. Transaction complete.</p>
                  </div>
                </div>
                <div className="bg-os-accent/10 rounded-lg p-4 border border-os-accent/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut mb-1">Full Refund Guarantee</h4>
                      <p className="text-os-sm text-afrikoni-deep">
                        If the product doesn't match the description or is damaged, you get a full refund. No questions asked.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Supplier Verification Rules */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-6 md:mb-8 text-center">
              Supplier Verification Process
            </h2>
            <Card className="border-os-accent/20">
              <CardContent className="p-6 md:p-8">
                <div className="space-y-6">
                  {verificationSteps.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-os-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-os-accent">{item.step}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-afrikoni-chestnut mb-1">{item.title}</h3>
                        <p className="text-afrikoni-deep text-os-sm">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-os-accent/20">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-afrikoni-chestnut">Verified Supplier Badge</h3>
                  </div>
                  <p className="text-afrikoni-deep mb-4">
                    Once all verification steps are complete, suppliers receive a "Verified Supplier" badge that appears on their profile and products.
                  </p>
                  <TrustBadge type="verified-supplier" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data & Privacy Safety */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-purple-600" />
                  <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut">
                    Data & Privacy Safety
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-os-accent" />
                      Encryption & Security
                    </h3>
                    <ul className="space-y-2 text-afrikoni-deep text-os-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>256-bit SSL encryption for all data transmission</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Secure payment processing with PCI DSS compliance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Regular security audits and penetration testing</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-os-accent" />
                      Privacy Compliance
                    </h3>
                    <ul className="space-y-2 text-afrikoni-deep text-os-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>GDPR compliant data handling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Your data is never sold to third parties</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Transparent privacy policy and data usage</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Marketplace Rules */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-os-accent" />
                  <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut">
                    Marketplace Rules & Guidelines
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-os-xl font-semibold text-afrikoni-chestnut mb-3">General Rules</h3>
                    <ul className="space-y-2 text-afrikoni-deep">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>All sellers must complete verification before listing products</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Products must be accurately described with clear images and specifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Prohibited items include weapons, illegal substances, and counterfeit goods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>All transactions must be conducted through Afrikoni's escrow system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Fair pricing and transparent communication are required</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-os-xl font-semibold text-afrikoni-chestnut mb-3">Seller Responsibilities</h3>
                    <ul className="space-y-2 text-afrikoni-deep">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                        <span>Respond to buyer inquiries within 24-48 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                        <span>Ship products according to agreed delivery timelines</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                        <span>Provide quality products that match product descriptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                        <span>Maintain accurate inventory and update product availability</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-os-xl font-semibold text-afrikoni-chestnut mb-3">Buyer Responsibilities</h3>
                    <ul className="space-y-2 text-afrikoni-deep">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Make timely payments through the escrow system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Confirm delivery within the specified timeframe</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Provide accurate shipping information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Report any issues or disputes through official channels</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-os-accent/10 rounded-lg border border-os-accent/20">
                    <p className="text-os-sm text-afrikoni-chestnut">
                      <strong>Note:</strong> Violation of marketplace rules may result in account suspension or termination. 
                      For questions about rules or to report violations, contact our support team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Complaint & Resolution Channel */}
          <section className="mb-12 md:mb-16">
            <Card className="border-os-accent/20 bg-gradient-to-r from-os-accent/10 to-afrikoni-chestnut/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-os-accent" />
                  <CardTitle className="text-os-2xl md:text-3xl font-bold text-afrikoni-chestnut">
                    Complaint & Resolution
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-afrikoni-deep mb-6">
                  We take every complaint seriously. Our dedicated support team is available 24/7 to help resolve any issues.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-os-accent/20">
                    <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">Report Issue</h4>
                    <p className="text-os-sm text-afrikoni-deep">Submit a complaint through our support center</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-os-accent/20">
                    <FileText className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">Investigation</h4>
                    <p className="text-os-sm text-afrikoni-deep">Our team reviews your case within 24 hours</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-os-accent/20">
                    <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-semibold text-afrikoni-chestnut mb-1">Resolution</h4>
                    <p className="text-os-sm text-afrikoni-deep">Fair resolution within 3-5 business days</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/contact">
                    <Button className="bg-os-accent hover:bg-os-accentDark text-afrikoni-charcoal w-full sm:w-auto min-h-[44px] touch-manipulation">
                      Contact Support
                    </Button>
                  </Link>
                  <Link to="/disputes">
                    <Button variant="outline" className="border-os-accent text-afrikoni-chestnut hover:bg-afrikoni-sand/20 w-full sm:w-auto min-h-[44px] touch-manipulation">
                      File a Dispute
                    </Button>
                  </Link>
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
              Ready to Trade with Confidence?
            </h2>
            <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
              Join thousands of businesses trading safely on Afrikoni. Your security is our commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button className="bg-os-accent hover:bg-os-accentDark text-afrikoni-charcoal min-h-[44px] touch-manipulation w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/how-payment-works">
                <Button variant="outline" className="border-os-accent text-afrikoni-chestnut hover:bg-afrikoni-sand/20 min-h-[44px] touch-manipulation w-full sm:w-auto">
                  Learn About Payments
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

