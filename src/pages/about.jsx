import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Target, Heart, MapPin, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Target,
      title: 'Empowering African Businesses',
      description: 'We believe every African business deserves access to global markets. Our platform breaks down barriers and creates opportunities.'
    },
    {
      icon: Heart,
      title: 'Trust & Transparency',
      description: 'Trust is the foundation of trade. We build it through verification, escrow protection, and transparent processes.'
    },
    {
      icon: Globe,
      title: 'Connecting 54 Countries',
      description: 'From Lagos to Nairobi, Cairo to Cape Town, we connect businesses across all 54 African countries.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'We\'re not just a platform—we\'re a community of entrepreneurs, traders, and innovators building Africa\'s future.'
    }
  ];

  const teamMembers = [
    {
      name: 'Founder & CEO',
      role: 'Visionary Leader',
      description: 'Passionate about empowering African businesses to go global',
      placeholder: true
    },
    {
      name: 'CTO',
      role: 'Technology Leader',
      description: 'Building the infrastructure for seamless B2B trade',
      placeholder: true
    },
    {
      name: 'Head of Operations',
      role: 'Operations Expert',
      description: 'Ensuring smooth transactions and customer satisfaction',
      placeholder: true
    }
  ];

  return (
    <>
      <SEO 
        title="About Afrikoni - Empowering African Businesses to Go Global"
        description="Learn about Afrikoni's mission to connect African businesses with global markets through trusted B2B trade."
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section with Video Placeholder */}
        <section className="relative bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6">
                Empowering African Businesses to Go Global
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto mb-8">
                Afrikoni is Africa's leading B2B marketplace, connecting verified suppliers and buyers across 54 countries.
              </p>
            </motion.div>
            
            {/* Video Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="border-afrikoni-gold/20 shadow-xl overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-afrikoni-gold/30 to-afrikoni-chestnut/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-white font-semibold">Company Video Coming Soon</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Founder Story & Mission */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-afrikoni-deep leading-relaxed">
                  <p>
                    Afrikoni was born from a simple vision: to make African businesses accessible to the world and the world accessible to African businesses.
                  </p>
                  <p>
                    As entrepreneurs ourselves, we experienced firsthand the challenges of cross-border trade in Africa—payment risks, trust issues, and fragmented markets. We knew there had to be a better way.
                  </p>
                  <p>
                    Today, Afrikoni connects thousands of businesses across 54 African countries, facilitating millions in trade volume through our secure escrow system and verified supplier network.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-afrikoni-gold/20 h-full">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-8 h-8 text-afrikoni-gold" />
                      <h3 className="text-2xl font-bold text-afrikoni-chestnut">Our Mission</h3>
                    </div>
                    <p className="text-afrikoni-deep leading-relaxed mb-4">
                      To empower African businesses to go global by providing a trusted, secure, and transparent B2B marketplace that breaks down barriers and creates opportunities.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep text-sm">Connect businesses across all 54 African countries</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep text-sm">Provide secure escrow payments and buyer protection</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep text-sm">Verify suppliers and build trust in African trade</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep text-sm">Enable seamless logistics and shipping solutions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 54 Countries Map Placeholder */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-afrikoni-offwhite to-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <MapPin className="w-10 h-10 text-afrikoni-gold" />
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut">
                  Connecting 54 African Countries
                </h2>
              </div>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                From North to South, East to West, we're building bridges across the continent.
              </p>
            </motion.div>
            <Card className="border-afrikoni-gold/20 shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-chestnut/10 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <Globe className="w-24 h-24 text-afrikoni-gold/50 mx-auto mb-4" />
                  <p className="text-afrikoni-deep font-semibold">Interactive Africa Map Coming Soon</p>
                  <p className="text-sm text-afrikoni-deep/70 mt-2">Showing all 54 countries we serve</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Our Values
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-afrikoni-gold" />
                        </div>
                        <h3 className="font-bold text-afrikoni-chestnut mb-2">{value.title}</h3>
                        <p className="text-sm text-afrikoni-deep leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Our Team
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Passionate individuals dedicated to transforming African trade
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="border-afrikoni-gold/20 text-center">
                    <CardContent className="p-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-afrikoni-gold/30 to-afrikoni-chestnut/30 mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-12 h-12 text-afrikoni-gold" />
                      </div>
                      <h3 className="font-bold text-afrikoni-chestnut mb-1">{member.name}</h3>
                      <p className="text-sm text-afrikoni-gold mb-3">{member.role}</p>
                      <p className="text-sm text-afrikoni-deep">{member.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 rounded-2xl p-8 md:p-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
                Join Us in Building Africa's Future
              </h2>
              <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
                Whether you're a buyer, seller, or logistics partner, there's a place for you in the Afrikoni community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup">
                  <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal">
                    Get Started
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-sand/20">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

