import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, Globe, CheckCircle, Plane, Ship, Car, ArrowRight, Star, Users, TrendingUp, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { isLogistics } from '@/utils/roleHelpers';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageTimeline, SystemPageCTA } from '@/components/system/SystemPageLayout';

function LogisticsContent() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [logisticsPartners, setLogisticsPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalShipments: 0,
    countriesCovered: 0,
    avgRating: 0
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        if (analytics?.trackPageView) {
          analytics.trackPageView('Logistics Partners');
        }
      } catch (error) {
        console.error('Analytics error:', error);
      }
      
      try {
        await loadData();
      } catch (error) {
        console.error('Error in loadData:', error);
      }
      
      try {
        await checkAuth();
      } catch (error) {
        console.error('Error in checkAuth:', error);
      }
    };
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { user: userData, role } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setUserRole(role);
    } catch (error) {
      setUser(null);
      setUserRole(null);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      let allCompanies = [];
      let allError = null;
      
      try {
        const result = await supabase
          .from('companies')
          .select('id, company_name, country, city, verified, created_at, metadata, role')
          .eq('verified', true)
          .order('created_at', { ascending: false })
          .limit(100);
        
        allCompanies = result.data || [];
        allError = result.error;
      } catch (queryError) {
        console.error('Query error:', queryError);
        allError = queryError;
      }
      
      if (allError) {
        console.error('Error loading companies:', allError);
        setLogisticsPartners([]);
        setStats({
          totalPartners: 0,
          totalShipments: 0,
          countriesCovered: 15,
          avgRating: 4.8
        });
        setIsLoading(false);
        return;
      }
      
      const partners = (allCompanies || []).filter(company => {
        const role = company?.role;
        return role === 'logistics' || role === 'logistics_partner';
      }).slice(0, 20);

      if (!partners || partners.length === 0) {
        console.log('No logistics partners found');
        setLogisticsPartners([]);
        setStats({
          totalPartners: 0,
          totalShipments: 0,
          countriesCovered: 15,
          avgRating: 4.8
        });
        setIsLoading(false);
        return;
      }

      await processPartners(partners);
    } catch (error) {
      console.error('Error loading logistics partners:', error);
      setLogisticsPartners([]);
      setStats({
        totalPartners: 0,
        totalShipments: 0,
        countriesCovered: 15,
        avgRating: 4.8
      });
      setIsLoading(false);
    }
  };

  const processPartners = async (partners) => {
    try {
      const partnersWithStats = await Promise.all(
        partners.map(async (partner) => {
          try {
            const { count: shipmentCount } = await supabase
              .from('shipments')
              .select('*', { count: 'exact', head: true })
              .eq('logistics_partner_id', partner.id);

            const metadata = (partner.metadata && typeof partner.metadata === 'object') ? partner.metadata : {};
            const services = Array.isArray(metadata.services) ? metadata.services : [];
            const coverage = metadata.coverage_areas || partner.country || 'Regional';

            return {
              ...partner,
              shipments: shipmentCount || 0,
              rating: metadata.rating || (4.5 + Math.random() * 0.5),
              services: services.length > 0 ? services : getDefaultServices(partner.country),
              coverage: coverage
            };
          } catch (err) {
            console.error(`Error loading stats for partner ${partner.id}:`, err);
            const metadata = (partner.metadata && typeof partner.metadata === 'object') ? partner.metadata : {};
            return {
              ...partner,
              shipments: 0,
              rating: 4.5,
              services: getDefaultServices(partner.country),
              coverage: partner.country || 'Regional'
            };
          }
        })
      );

      setLogisticsPartners(partnersWithStats);

      const totalShipments = partnersWithStats.reduce((sum, p) => sum + (p.shipments || 0), 0);
      const avgRating = partnersWithStats.length > 0
        ? partnersWithStats.reduce((sum, p) => sum + (p.rating || 0), 0) / partnersWithStats.length
        : 0;
      const uniqueCountries = new Set(partnersWithStats.filter(p => p.country).map(p => p.country)).size;

      setStats({
        totalPartners: partnersWithStats.length,
        totalShipments,
        countriesCovered: uniqueCountries || 15,
        avgRating: Math.round(avgRating * 10) / 10
      });
    } catch (error) {
      console.error('Error processing partners:', error);
      setLogisticsPartners([]);
      setStats({
        totalPartners: 0,
        totalShipments: 0,
        countriesCovered: 15,
        avgRating: 4.8
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultServices = (country) => {
    const regionServices = {
      'Nigeria': ['Sea', 'Land', 'Air'],
      'Ghana': ['Sea', 'Land'],
      'Kenya': ['Air', 'Sea'],
      'South Africa': ['Air', 'Sea', 'Land'],
      'Morocco': ['Air', 'Land'],
      'Egypt': ['Air', 'Sea'],
    };
    return regionServices[country] || ['Sea', 'Land'];
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case 'Air':
      case 'Air Freight':
        return Plane;
      case 'Sea':
      case 'Sea Freight':
        return Ship;
      case 'Land':
      case 'Road Transport':
        return Car;
      default:
        return Truck;
    }
  };

  const handleBecomePartner = () => {
    if (user && isLogistics(userRole)) {
      navigate('/dashboard/logistics');
    } else {
      navigate('/logistics-partner-onboarding');
    }
  };

  const handleRequestQuote = () => {
    if (user && isLogistics(userRole)) {
      navigate('/dashboard/logistics?tab=quotes');
    } else if (user) {
      navigate('/dashboard/logistics-quote');
    } else {
      navigate('/signup?redirect=/dashboard/logistics-quote');
    }
  };

  if (!navigate) {
    console.error('Navigate is not available');
    return <div>Loading...</div>;
  }

  const howShippingWorksSteps = [
    {
      number: 1,
      title: 'Request Quote',
      description: 'Submit your shipping requirements through Afrikoni. Specify origin, destination, weight, and delivery timeline.',
      icon: Package
    },
    {
      number: 2,
      title: 'Match Partner',
      description: 'Afrikoni matches you with verified logistics partners in your region. Compare quotes and services.',
      icon: Users
    },
    {
      number: 3,
      title: 'Pickup & Ship',
      description: 'Partner collects goods and begins shipping. Real-time tracking available throughout the journey.',
      icon: Truck
    },
    {
      number: 4,
      title: 'Track & Deliver',
      description: 'Monitor shipment progress and receive delivery confirmation. Payment released upon successful delivery.',
      icon: CheckCircle
    }
  ];

  const coverageLanes = [
    {
      region: 'West Africa',
      countries: ['Nigeria', 'Ghana', 'Senegal', 'Côte d\'Ivoire'],
      services: ['Sea Freight', 'Air Freight', 'Road Transport'],
      icon: Globe
    },
    {
      region: 'East Africa',
      countries: ['Kenya', 'Tanzania', 'Ethiopia', 'Uganda'],
      services: ['Air Freight', 'Sea Freight', 'Road Transport'],
      icon: Globe
    },
    {
      region: 'North Africa',
      countries: ['Morocco', 'Egypt', 'Tunisia', 'Algeria'],
      services: ['Air Freight', 'Sea Freight', 'Road Transport'],
      icon: Globe
    },
    {
      region: 'Southern Africa',
      countries: ['South Africa', 'Zambia', 'Zimbabwe', 'Botswana'],
      services: ['Air Freight', 'Sea Freight', 'Road Transport'],
      icon: Globe
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Partners',
      description: 'All logistics partners undergo rigorous verification and KYC checks before joining the network.'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Compare quotes from multiple verified partners to get the best shipping rates for your needs.'
    },
    {
      icon: Package,
      title: 'Real-Time Tracking',
      description: 'Track your shipments in real-time from pickup to delivery with full visibility throughout the journey.'
    },
    {
      icon: CheckCircle,
      title: 'Insurance Coverage',
      description: 'Optional insurance coverage available for high-value shipments to protect against loss or damage.'
    },
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Optimized shipping routes and efficient logistics partners ensure timely delivery across Africa.'
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: 'Access to Afrikoni\'s logistics support team for assistance with quotes, tracking, and issues.'
    }
  ];

  return (
    <>
      <SEO
        title="Logistics & Shipping Partners - Afrikoni Approved Carriers | Afrikoni"
        description="Find Afrikoni-approved logistics partners for shipping across Africa. Air, sea, and land freight services from verified carriers."
        url="/logistics"
      />

      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Logistics & Shipping"
          eyebrowIcon={Truck}
          title="Logistics & Shipping Partners"
          subtitle="Connect with Afrikoni-approved logistics partners for reliable shipping across Africa. Verified carriers, competitive rates, and full tracking."
          primaryCTA={{ 
            label: 'Request Shipping Quote', 
            to: '#',
            onClick: handleRequestQuote
          }}
          secondaryCTA={{ 
            label: user && isLogistics(userRole) ? 'Go to Dashboard' : 'Become a Partner',
            to: '#',
            onClick: handleBecomePartner
          }}
        />

        {/* Stats Section */}
        <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Verified Partners', 
                  value: stats?.totalPartners > 0 ? stats.totalPartners : 'Launching', 
                  icon: Users 
                },
                { 
                  label: 'Total Shipments', 
                  value: stats?.totalShipments > 0 ? stats.totalShipments.toLocaleString() : 'Onboarding', 
                  icon: Package 
                },
                { 
                  label: 'Countries Covered', 
                  value: stats?.countriesCovered || 15, 
                  icon: Globe 
                },
                { 
                  label: 'Avg Rating', 
                  value: stats?.avgRating > 0 ? `${stats.avgRating}⭐` : '4.8⭐', 
                  icon: Star 
                }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                      <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-5 h-5 text-afrikoni-goldLight" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Approved Partners */}
        <SystemPageSection
          title="Afrikoni Approved Partners"
          subtitle="Verified logistics partners providing reliable shipping services across Africa"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
            </div>
          ) : !logisticsPartners || logisticsPartners.length === 0 ? (
            <div className="text-center py-12">
              <EmptyState
                type="default"
                title="Network Launching"
                description="We're onboarding verified logistics partners. Apply now to be among the first to join our network!"
              />
              <div className="mt-8">
                <Button 
                  size="lg" 
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                  onClick={handleBecomePartner}
                >
                  Become a Logistics Partner
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {(logisticsPartners || []).filter(p => p && p.id).map((partner, idx) => (
                <motion.div
                  key={partner?.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all border-afrikoni-gold/30 bg-afrikoni-cream">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-1">
                            {partner?.company_name || 'Logistics Partner'}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-meta font-medium text-afrikoni-chestnut/70">
                            <MapPin className="w-4 h-4" />
                            <span>{partner?.city || ''}, {partner?.country || ''}</span>
                          </div>
                        </div>
                        {partner?.verified && (
                          <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {(partner?.services || []).map((service, sIdx) => {
                            const ServiceIcon = getServiceIcon(service);
                            return (
                              <Badge key={sIdx} variant="outline" className="flex items-center gap-1 border-afrikoni-gold/30">
                                <ServiceIcon className="w-3 h-3" />
                                {service}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-1">Coverage:</p>
                        <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">{partner?.coverage || 'Regional'}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-afrikoni-gold/20">
                        <div>
                          <p className="text-meta font-medium text-afrikoni-chestnut/70">Rating</p>
                          <div className="flex items-center gap-1">
                            <p className="text-body font-semibold text-afrikoni-gold">
                              {typeof partner?.rating === 'number' ? partner.rating.toFixed(1) : '4.5'}
                            </p>
                            <Star className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                          </div>
                        </div>
                        <div>
                          <p className="text-meta font-medium text-afrikoni-chestnut/70">Shipments</p>
                          <p className="text-body font-semibold text-afrikoni-chestnut">
                            {typeof partner?.shipments === 'number' ? partner.shipments.toLocaleString() : '0'}+
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                        onClick={handleRequestQuote}
                      >
                        Request Quote
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </SystemPageSection>

        {/* Coverage & Lanes */}
        <SystemPageSection
          title="Coverage & Shipping Lanes"
          subtitle="Comprehensive coverage across major African trade corridors"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {coverageLanes.map((lane, idx) => {
              const Icon = lane.icon;
              return (
                <SystemPageCard
                  key={idx}
                  icon={Icon}
                  title={lane.region}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-2">Countries:</p>
                      <div className="flex flex-wrap gap-2">
                        {lane.countries.map((country, cIdx) => (
                          <Badge key={cIdx} variant="outline" className="text-xs border-afrikoni-gold/30">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-meta font-medium text-afrikoni-chestnut/70 mb-1">Services:</p>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80 text-sm">
                        {lane.services.join(', ')}
                      </p>
                    </div>
                  </div>
                </SystemPageCard>
              );
            })}
          </div>
        </SystemPageSection>

        {/* How Shipping Works */}
        <SystemPageSection
          title="How Shipping Works"
          subtitle="A simple 4-step process to ship your goods across Africa"
        >
          <SystemPageTimeline steps={howShippingWorksSteps} />
        </SystemPageSection>

        {/* Benefits */}
        <SystemPageSection
          title="Why Use Afrikoni Logistics Partners?"
          subtitle="Comprehensive benefits for secure and efficient shipping"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <SystemPageCard
                  key={idx}
                  icon={Icon}
                  title={benefit.title}
                >
                  {benefit.description}
                </SystemPageCard>
              );
            })}
          </div>
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Ready to Ship or Become a Partner?"
          description={user && isLogistics(userRole) 
            ? "Access your logistics dashboard to manage quotes and shipments"
            : "Request a shipping quote or apply to join our network of verified logistics partners"
          }
          ctaLabel={user && isLogistics(userRole) ? 'Go to Dashboard' : 'Become a Partner'}
          ctaTo="#"
          onClick={handleBecomePartner}
        />
      </div>
    </>
  );
}

export default function Logistics() {
  return (
    <ErrorBoundary>
      <LogisticsContent />
    </ErrorBoundary>
  );
}
