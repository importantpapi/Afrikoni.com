import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Target, Heart, MapPin, Play, CheckCircle, Store, ShoppingBag, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';
import BushidoManifesto from '@/components/home/BushidoManifesto';
import BusinessModel from '@/components/home/BusinessModel';
import SocialProofSection from '@/components/home/SocialProofSection';

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
      name: 'Youba Simao Thiam',
      role: 'Founder & CEO',
      description: 'Passionate about empowering African businesses to go global',
      placeholder: false,
      image: '/images/team/youba-simao-thiam.jpg',
      badges: ['Entrepreneur', 'Visionary', 'Africa-First'],
      countries: [
        { name: 'Senegal', flag: '🇸🇳' },
        { name: 'Mali', flag: '🇲🇱' },
        { name: 'Angola', flag: '🇦🇴' },
        { name: 'Congo', flag: '🇨🇩' }
      ]
    },
    {
      name: 'CTO',
      role: 'Technology Leader',
      description: 'Building the infrastructure for seamless B2B trade',
      placeholder: true,
      badges: ['B2B Technology Specialist'],
      country: 'Nigeria',
      flag: '🇳🇬'
    },
    {
      name: 'Head of Operations',
      role: 'Operations Expert',
      description: 'Ensuring smooth transactions and customer satisfaction',
      placeholder: true,
      badges: ['Trade Operations & Customer Success'],
      country: 'Kenya',
      flag: '🇰🇪'
    }
  ];

  return (
    <>
      <SEO 
        title="About Afrikoni - Africa's Trusted B2B Trade Engine"
        description="Africa's trusted B2B trade engine — connecting buyers, sellers and logistics across 54 countries. Learn about Afrikoni's vision, mission, and founding story."
        url="/about"
        ogType="website"
        ogImage="/images/og-about.jpg"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Afrikoni",
          "description": "Africa's trusted B2B trade engine connecting buyers, sellers and logistics across 54 countries",
          "url": "https://afrikoni.com",
          "logo": "https://afrikoni.com/images/logo.png",
          "founder": {
            "@type": "Person",
            "name": "Youba Simao Thiam",
            "jobTitle": "Founder & CEO"
          },
          "sameAs": [
            "https://twitter.com/afrikoni",
            "https://linkedin.com/company/afrikoni"
          ]
        }}
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section with Video Placeholder */}
        <section className="relative bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 py-16 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6">
                About Afrikoni
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto mb-4 font-semibold">
                Africa's trusted B2B trade engine — connecting buyers, sellers and logistics across 54 countries.
              </p>
              <p className="text-base md:text-lg text-afrikoni-deep/80 max-w-3xl mx-auto mb-8">
                Empowering African businesses to go global through verified suppliers, secure payments, and seamless logistics.
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
        <section className="py-16 md:py-20 lg:py-24">
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
                        As entrepreneurs ourselves, we have firsthand experience with the challenges of cross-border trade in Africa payment risks, trust issues, and fragmented markets. We knew there had to be a better way.
                      </p>
                      <p>
                        Today, Afrikoni connects thousands of businesses across 54 African countries, facilitating millions in trade volume through our secure escrow system and verified supplier network.
                      </p>
                    </div>
                
                <div className="mt-8 pt-8 border-t border-afrikoni-gold/20">
                  <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-4">Our Vision</h3>
                  <p className="text-afrikoni-deep leading-relaxed mb-6">
                    To become the most trusted B2B marketplace in Africa, where every business—from small local suppliers to large international buyers can trade with confidence, security, and transparency.
                  </p>
                  {/* Contextual CTA - After Vision */}
                  <Link to="/services/buyers">
                    <Button variant="outline" className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10">
                      <ShoppingBag className="w-4 h-4 mr-2" aria-hidden="true" />
                      Join as a Buyer
                    </Button>
                  </Link>
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
            
            {/* Contextual CTA - After Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <Link to="/services/suppliers">
                <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-3">
                  <Store className="w-5 h-5 mr-2" aria-hidden="true" />
                  Join as a Supplier
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 54 Countries Map Placeholder */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-afrikoni-offwhite to-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <MapPin className="w-10 h-10 text-afrikoni-gold" aria-label="Location icon" />
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
                  <Globe className="w-24 h-24 text-afrikoni-gold/50 mx-auto mb-4" aria-label="Globe icon representing 54 African countries" />
                  <p className="text-afrikoni-deep font-semibold">Interactive Africa Map Coming Soon</p>
                  <p className="text-sm text-afrikoni-deep/70 mt-2">Showing all 54 countries we serve</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Social Proof Section */}
        <SocialProofSection />

        {/* Bushido Manifesto */}
        <BushidoManifesto />

        {/* Business Model & Reality Check */}
        <BusinessModel />

        {/* Our Values */}
        <section className="py-16 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Our Values
              </h2>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-lg group">
                      <CardContent className="p-6">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center mb-4 group-hover:bg-afrikoni-gold/30 transition-colors"
                        >
                          <Icon className="w-6 h-6 text-afrikoni-gold" aria-label={`${value.title} icon`} />
                        </motion.div>
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
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Our Team
              </h2>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
                Passionate individuals dedicated to transforming African trade
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-afrikoni-gold/20 text-center hover:border-afrikoni-gold transition-all hover:shadow-lg h-full">
                    <CardContent className="p-6 md:p-8">
                      {member.image ? (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                          className={`${member.isFounder ? 'w-36 h-36 md:w-40 md:h-40' : 'w-32 h-32 md:w-36 md:h-36'} rounded-full overflow-hidden mx-auto mb-4 border-3 ${member.isFounder ? 'border-afrikoni-gold/50' : 'border-afrikoni-gold/40'} shadow-xl relative`}
                          style={{
                            boxShadow: member.isFounder 
                              ? '0 15px 40px rgba(212, 160, 50, 0.4), 0 0 0 4px rgba(212, 160, 50, 0.15)' 
                              : '0 10px 30px rgba(212, 160, 50, 0.3), 0 0 0 3px rgba(212, 160, 50, 0.1)'
                          }}
                        >
                          <img
                            src={member.image}
                            alt={`${member.name} - ${member.role}`}
                            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105`}
                            loading="lazy"
                            onError={(e) => {
                              // Fallback if image doesn't exist
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-chestnut/20 flex items-center justify-center"><span class="text-afrikoni-gold text-xs text-center px-2">Image<br/>Loading</span></div>';
                            }}
                            style={{
                              filter: member.isFounder 
                                ? 'contrast(1.1) brightness(1.05) saturate(1.05)' 
                                : 'contrast(1.05) brightness(1.02)',
                              imageRendering: 'crisp-edges',
                              objectPosition: member.isFounder ? '50% 5%' : 'center center',
                              transform: member.isFounder ? 'scale(0.75)' : 'scale(1)',
                              transformOrigin: 'center top'
                            }}
                          />
                          {/* Subtle gold ring glow - enhanced for founder */}
                          <div className={`absolute inset-0 rounded-full ${member.isFounder ? 'ring-3 ring-afrikoni-gold/30' : 'ring-2 ring-afrikoni-gold/20'} pointer-events-none`} />
                        </motion.div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-afrikoni-gold/30 to-afrikoni-chestnut/30 mx-auto mb-4 flex items-center justify-center border-2 border-afrikoni-gold/30">
                          <Users className="w-14 h-14 text-afrikoni-gold" aria-label="Team member placeholder" />
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-afrikoni-chestnut mb-1">{member.name}</h3>
                      <p className="text-sm font-semibold text-afrikoni-gold mb-2">{member.role}</p>
                      
                      {/* Badges */}
                      {member.badges && (
                        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                          {member.badges.map((badge, badgeIdx) => (
                            <span
                              key={badgeIdx}
                              className="text-xs px-2 py-0.5 bg-afrikoni-gold/10 text-afrikoni-chestnut rounded-full border border-afrikoni-gold/20"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-afrikoni-deep mb-3">{member.description}</p>
                      
                      {/* Country Flags - Support multiple countries */}
                      {member.countries && member.countries.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-afrikoni-deep/70">
                          {member.countries.map((country, countryIdx) => (
                            <div key={countryIdx} className="flex items-center gap-1">
                              <span className="text-base" role="img" aria-label={`Flag of ${country.name}`}>
                                {country.flag}
                              </span>
                              <span>{country.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : member.country ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-afrikoni-deep/70">
                          <span className="text-lg" role="img" aria-label={`Flag of ${member.country}`}>
                            {member.flag}
                          </span>
                          <span>{member.country}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Contextual CTA - After Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link to="/services/logistics">
                <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-3">
                  <Truck className="w-5 h-5 mr-2" aria-hidden="true" />
                  Partner in Logistics
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 rounded-2xl p-8 md:p-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Join Us in Building Africa's Future
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Whether you're a buyer, seller, or logistics partner, there's a place for you in the Afrikoni community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-3">
                    Get Started
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-3">
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

