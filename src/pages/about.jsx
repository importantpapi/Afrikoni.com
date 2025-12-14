import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, Target, Heart, MapPin, Play, CheckCircle, Store, ShoppingBag, Truck, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/i18n/LanguageContext';
import BusinessModel from '@/components/home/BusinessModel';
import BushidoManifesto from '@/components/home/BushidoManifesto';

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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5 py-20 md:py-28 lg:py-32 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-afrikoni-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-afrikoni-chestnut/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block mb-6"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6 leading-tight">
                About Afrikoni
              </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-xl md:text-2xl lg:text-3xl text-afrikoni-deep font-semibold max-w-4xl mx-auto mb-6 leading-relaxed"
              >
                Africa's trusted B2B trade engine — connecting buyers, sellers and logistics across 54 countries.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto leading-relaxed"
              >
                Empowering African businesses to go global through verified suppliers, secure payments, and seamless logistics.
              </motion.p>
            </motion.div>
            
            {/* Video Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <Card className="border-2 border-afrikoni-gold/30 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-afrikoni-offwhite">
                <div className="relative aspect-video bg-gradient-to-br from-afrikoni-gold/20 via-afrikoni-chestnut/20 to-afrikoni-gold/10 flex items-center justify-center group cursor-pointer hover:from-afrikoni-gold/30 hover:via-afrikoni-chestnut/30 hover:to-afrikoni-gold/20 transition-all duration-300">
                  <div className="text-center z-10">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mx-auto mb-6 shadow-xl border-2 border-white/50 group-hover:bg-white/40 transition-all"
                    >
                      <Play className="w-12 h-12 text-white ml-1" fill="white" />
                    </motion.div>
                    <p className="text-white font-semibold text-lg md:text-xl">Company Video Coming Soon</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Our Story & Mission Section */}
        <section className="py-16 md:py-24 lg:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 mb-16">
              {/* Our Story */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut">
                  Our Story
                </h2>
                </div>
                
                <div className="space-y-5 text-afrikoni-deep leading-relaxed text-base md:text-lg">
                      <p>
                    Afrikoni was born from a simple vision: <span className="font-semibold text-afrikoni-chestnut">to make African businesses accessible to the world and the world accessible to African businesses.</span>
                      </p>
                      <p>
                    As entrepreneurs ourselves, we have firsthand experience with the challenges of cross-border trade in Africa — payment risks, trust issues, and fragmented markets. We knew there had to be a better way.
                      </p>
                      <p>
                        Today, Afrikoni connects thousands of businesses across 54 African countries, facilitating millions in trade volume through our secure escrow system and verified supplier network.
                      </p>
                </div>
              </motion.div>

              {/* Our Vision */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="border-2 border-afrikoni-gold/20 h-full shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-afrikoni-gold" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut">Our Vision</h3>
                    </div>
                    <p className="text-afrikoni-deep leading-relaxed text-base md:text-lg mb-8">
                      To become the most trusted B2B marketplace in Africa, where every business—from small local suppliers to large international buyers—can trade with confidence, security, and transparency.
                    </p>
                    <Link to="/services/buyers">
                      <Button 
                        size="lg" 
                        className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold group"
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Join as a Buyer
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Our Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-2 border-afrikoni-gold/20 shadow-lg bg-gradient-to-br from-white to-afrikoni-offwhite">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut">Our Mission</h3>
                  </div>
                  <p className="text-afrikoni-deep leading-relaxed text-base md:text-lg mb-8">
                    To empower African businesses to go global by providing a trusted, secure, and transparent B2B marketplace that breaks down barriers and creates opportunities.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep font-medium">Connect businesses across all 54 African countries</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep font-medium">Provide secure escrow payments and buyer protection</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep font-medium">Verify suppliers and build trust in African trade</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep font-medium">Enable seamless logistics and shipping solutions</span>
                    </div>
                  </div>

              <Link to="/services/suppliers">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full md:w-auto border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-semibold group"
                    >
                      <Store className="w-5 h-5 mr-2" />
                  Join as a Supplier
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Business Model & Reality Check */}
        <BusinessModel />

        {/* Afrikoni Bushido Manifesto */}
        <section className="py-16 md:py-24 lg:py-28 bg-gradient-to-br from-afrikoni-chestnut/5 via-afrikoni-gold/5 to-afrikoni-chestnut/5">
          <BushidoManifesto />
        </section>

        {/* Our Values */}
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
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Card className="h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-xl group bg-white">
                      <CardContent className="p-6 md:p-8">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          className="w-14 h-14 rounded-xl bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-gold/10 flex items-center justify-center mb-6 group-hover:from-afrikoni-gold/30 group-hover:to-afrikoni-gold/20 transition-all shadow-lg"
                        >
                          <Icon className="w-7 h-7 text-afrikoni-gold" />
                        </motion.div>
                        <h3 className="font-bold text-lg text-afrikoni-chestnut mb-3">{value.title}</h3>
                        <p className="text-sm md:text-base text-afrikoni-deep leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
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
                  whileHover={{ y: -8 }}
                >
                  <Card className="border-2 border-afrikoni-gold/20 text-center hover:border-afrikoni-gold transition-all hover:shadow-xl h-full bg-white">
                    <CardContent className="p-6 md:p-8">
                      {member.image ? (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                          className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mx-auto mb-6 border-4 border-afrikoni-gold/30 shadow-xl relative"
                        >
                          <img
                            src={member.image}
                            alt={`${member.name} - ${member.role}`}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-chestnut/20 flex items-center justify-center"><span class="text-afrikoni-gold text-xs text-center px-2">Image<br/>Loading</span></div>';
                            }}
                          />
                        </motion.div>
                      ) : (
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-afrikoni-gold/30 to-afrikoni-chestnut/30 mx-auto mb-6 flex items-center justify-center border-4 border-afrikoni-gold/30 shadow-xl">
                          <Users className="w-16 h-16 text-afrikoni-gold" />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">{member.name}</h3>
                      <p className="text-base font-semibold text-afrikoni-gold mb-4">{member.role}</p>
                      
                      {/* Badges */}
                      {member.badges && (
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                          {member.badges.map((badge, badgeIdx) => (
                            <span
                              key={badgeIdx}
                              className="text-xs px-3 py-1 bg-afrikoni-gold/10 text-afrikoni-chestnut rounded-full border border-afrikoni-gold/30 font-medium"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm md:text-base text-afrikoni-deep mb-4 leading-relaxed">{member.description}</p>
                      
                      {/* Country Flags */}
                      {member.countries && member.countries.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-afrikoni-deep/70">
                          {member.countries.map((country, countryIdx) => (
                            <div key={countryIdx} className="flex items-center gap-1.5">
                              <span className="text-xl" role="img" aria-label={`Flag of ${country.name}`}>
                                {country.flag}
                              </span>
                              <span className="font-medium">{country.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : member.country ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-afrikoni-deep/70">
                          <span className="text-xl" role="img" aria-label={`Flag of ${member.country}`}>
                            {member.flag}
                          </span>
                          <span className="font-medium">{member.country}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* CTA After Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link to="/services/logistics">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 font-semibold group"
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Partner in Logistics
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
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
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-6">
                    Ready to Build Something Meaningful?
              </h2>
                  <p className="text-lg md:text-xl text-afrikoni-deep mb-8 max-w-2xl mx-auto leading-relaxed">
                    If you decide to build it, build it RIGHT. Build it with INTEGRITY. Build it to LAST.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                      <Button 
                        size="lg" 
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-semibold group"
                      >
                    Get Started
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-6 text-lg font-semibold"
                      >
                    Contact Us
                  </Button>
                </Link>
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
