/**
 * WhatsApp Community Page
 * Join the Afrikoni Trade Community on WhatsApp
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Shield, TrendingUp, ArrowRight, QrCode } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import SEO from '@/components/SEO';
import { openWhatsAppCommunity, generateWhatsAppQRCode } from '@/utils/whatsappCommunity';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Community() {
  const { t } = useLanguage();
  const { trackEvent } = useAnalytics();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const whatsappLink = import.meta.env.VITE_WHATSAPP_COMMUNITY_LINK || 'https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v';

  useEffect(() => {
    // Generate QR code on mount
    const qrUrl = generateWhatsAppQRCode(whatsappLink);
    setQrCodeUrl(qrUrl);
  }, [whatsappLink]);

  const handleJoinClick = () => {
    trackEvent('join_whatsapp_clicked', {
      source: 'community_page',
      page: 'community'
    });
    openWhatsAppCommunity('community_page');
  };

  const benefits = [
    {
      icon: Users,
      title: 'Connect with Verified Partners',
      description: 'Network with verified buyers, suppliers, and logistics partners across 54 African countries.'
    },
    {
      icon: Shield,
      title: 'Trust & Safety First',
      description: 'All community members are verified Afrikoni users. Trade with confidence.'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Opportunities',
      description: 'Get instant notifications about new RFQs, product launches, and trade opportunities.'
    },
    {
      icon: MessageCircle,
      title: 'Direct Communication',
      description: 'Chat directly with potential partners, ask questions, and build relationships.'
    }
  ];

  return (
    <>
      <SEO
        title="Join the Afrikoni Trade Community | WhatsApp"
        description="Connect with verified buyers, suppliers & logistics partners. Trade. Trust. Thrive. Join our WhatsApp community."
        url="/community"
      />
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-offwhite to-afrikoni-cream">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-chestnut to-afrikoni-deep text-afrikoni-cream py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-afrikoni-gold/20 rounded-full mb-6">
                <MessageCircle className="w-10 h-10 text-afrikoni-gold" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-serif">
                Join the Afrikoni Trade Community
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                Connect with verified buyers, suppliers & logistics partners. Trade. Trust. Thrive.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleJoinClick}
                  size="lg"
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut font-bold text-lg px-8 py-6 rounded-full shadow-afrikoni-lg"
                >
                  Join Afrikoni Community 🚀
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          {/* QR Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="border-afrikoni-gold/30 bg-white shadow-afrikoni-lg">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg border-2 border-afrikoni-gold/20 shadow-lg">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="WhatsApp Community QR Code"
                          className="w-64 h-64"
                        />
                      ) : (
                        <div className="w-64 h-64 bg-afrikoni-offwhite flex items-center justify-center">
                          <QrCode className="w-16 h-16 text-afrikoni-gold/50" />
                        </div>
                      )}
                    </div>
                    <p className="text-center text-sm text-afrikoni-deep/70 mt-4">
                      Scan with WhatsApp
                    </p>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
                      Quick Join via QR Code
                    </h2>
                    <p className="text-afrikoni-deep/80 mb-6 text-lg">
                      Open WhatsApp on your phone, tap the <strong>Communities</strong> tab, then scan this QR code to join instantly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Button
                        onClick={handleJoinClick}
                        size="lg"
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut font-semibold"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Open WhatsApp Link
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          if (qrCodeUrl) {
                            const link = document.createElement('a');
                            link.href = qrCodeUrl;
                            link.download = 'afrikoni-community-qr.png';
                            link.click();
                          }
                        }}
                        className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10"
                      >
                        <QrCode className="w-5 h-5 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut text-center mb-8 md:mb-12">
              Why Join Our Community?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                  >
                    <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg h-full bg-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-afrikoni-chestnut mb-2">
                              {benefit.title}
                            </h3>
                            <p className="text-afrikoni-deep/80">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Community Guidelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-gold/10">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
                  Community Guidelines
                </h2>
                <ul className="space-y-3 text-afrikoni-deep/80">
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <span>Only verified Afrikoni users can join. This ensures a trusted trading environment.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <span>Respect all members. Professional communication is required at all times.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <span>Share relevant trade opportunities, RFQs, and business insights.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <span>No spam, scams, or off-platform payment requests. All transactions should go through Afrikoni.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                    <span>Report any suspicious activity to our support team at hello@afrikoni.com</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-gold/5">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                  Ready to Connect?
                </h2>
                <p className="text-lg text-afrikoni-deep/80 mb-8 max-w-2xl mx-auto">
                  Join thousands of verified traders building Africa's largest B2B network. Start connecting today!
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleJoinClick}
                    size="lg"
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut font-bold text-lg px-10 py-6 rounded-full shadow-afrikoni-lg"
                  >
                    Join Afrikoni Community 🚀
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}

