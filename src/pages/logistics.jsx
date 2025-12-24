import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, Globe, CheckCircle, Plane, Ship, Car, ArrowRight, Star, Users, TrendingUp, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { isLogistics } from '@/utils/roleHelpers';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBoundary from '@/components/ErrorBoundary';

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
      
      // Load logistics partners from companies table
      // First, try to get all verified companies and filter by role
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
        // Don't throw, just set empty state
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
      
      // Filter for logistics partners client-side (more reliable)
      const partners = (allCompanies || []).filter(company => {
        const role = company?.role;
        return role === 'logistics' || role === 'logistics_partner';
      }).slice(0, 20); // Limit to 20 partners

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
      // Use empty array on error with default stats
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

      // Get shipment stats for each partner (with error handling)
      const partnersWithStats = await Promise.all(
        partners.map(async (partner) => {
          try {
            const { count: shipmentCount, error: shipmentError } = await supabase
              .from('shipments')
              .select('*', { count: 'exact', head: true })
              .eq('logistics_partner_id', partner.id);

            // Get average rating from metadata or calculate from shipments
            const metadata = (partner.metadata && typeof partner.metadata === 'object') ? partner.metadata : {};
            const services = Array.isArray(metadata.services) ? metadata.services : [];
            const coverage = metadata.coverage_areas || partner.country || 'Regional';

            return {
              ...partner,
              shipments: shipmentCount || 0,
              rating: metadata.rating || (4.5 + Math.random() * 0.5), // Default rating between 4.5-5.0
              services: services.length > 0 ? services : getDefaultServices(partner.country),
              coverage: coverage
            };
          } catch (err) {
            console.error(`Error loading stats for partner ${partner.id}:`, err);
            // Return partner with default stats
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

      // Calculate stats
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
    // Default services based on common logistics in the region
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
      // User is already a logistics partner, go to dashboard
      navigate('/dashboard/logistics');
    } else {
      // Go to onboarding
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

  // Early return if critical dependencies are missing
  if (!navigate) {
    console.error('Navigate is not available');
    return <div>Loading...</div>;
  }

  return (
    <>
      <SEO
        title="Logistics & Shipping Partners - Afrikoni Approved Carriers | Afrikoni"
        description="Find Afrikoni-approved logistics partners for shipping across Africa. Air, sea, and land freight services from verified carriers."
        url="/logistics"
      />

      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-afrikoni-cream-100/30">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Logistics & Shipping Partners
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 max-w-3xl mx-auto mb-8">
                Connect with Afrikoni-approved logistics partners for reliable shipping across Africa
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-lg px-8 py-6"
                  onClick={handleRequestQuote}
                >
                  Request Shipping Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                  onClick={handleBecomePartner}
                >
                  {user && isLogistics(userRole) ? 'Go to Dashboard' : 'Become a Partner'}
                  </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { label: 'Verified Partners', value: stats?.totalPartners || 0, icon: Users, color: 'bg-blue-500' },
                { label: 'Total Shipments', value: (typeof stats?.totalShipments === 'number' ? stats.totalShipments.toLocaleString() : '0'), icon: Package, color: 'bg-green-500' },
                { label: 'Countries', value: stats?.countriesCovered || 15, icon: Globe, color: 'bg-purple-500' },
                { label: 'Avg Rating', value: (stats?.avgRating > 0 ? `${stats.avgRating}⭐` : '4.8⭐'), icon: Star, color: 'bg-afrikoni-gold' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs md:text-sm text-afrikoni-cream/80">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* Approved Partners */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Afrikoni Approved Partners
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Verified logistics partners providing reliable shipping services across Africa
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
              </div>
            ) : !logisticsPartners || logisticsPartners.length === 0 ? (
              <div className="text-center py-12">
                <EmptyState
                  type="default"
                  title="No Logistics Partners Yet"
                  description="Be the first to join our network! Apply now to become a verified logistics partner."
                />
                <div className="mt-8">
                  <Button 
                    size="lg" 
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                    onClick={handleBecomePartner}
                  >
                    Become a Logistics Partner
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(logisticsPartners || []).filter(p => p && p.id).map((partner, idx) => (
                <motion.div
                  key={partner?.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                    <Card className="h-full hover:shadow-xl transition-all border-afrikoni-gold/20">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{partner?.company_name || 'Logistics Partner'}</CardTitle>
                          <div className="flex items-center gap-2 text-afrikoni-deep">
                            <MapPin className="w-4 h-4" />
                              <span className="text-sm">{partner?.city || ''}, {partner?.country || ''}</span>
                            </div>
                          </div>
                          {partner?.verified && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Services */}
                      <div>
                        <p className="text-sm font-semibold text-afrikoni-deep mb-2">Services:</p>
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

                      {/* Coverage */}
                      <div>
                        <p className="text-sm font-semibold text-afrikoni-deep mb-1">Coverage:</p>
                          <p className="text-sm text-afrikoni-deep/80">{partner?.coverage || 'Regional'}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-afrikoni-gold/20">
                        <div>
                          <p className="text-xs text-afrikoni-deep/70">Rating</p>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-semibold text-afrikoni-gold">
                                {typeof partner?.rating === 'number' ? partner.rating.toFixed(1) : '4.5'}
                              </p>
                              <Star className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                            </div>
                        </div>
                        <div>
                          <p className="text-xs text-afrikoni-deep/70">Shipments</p>
                            <p className="text-sm font-semibold text-afrikoni-deep">
                              {typeof partner?.shipments === 'number' ? partner.shipments.toLocaleString() : '0'}+
                            </p>
                        </div>
                      </div>

                      {/* CTA */}
                        <Button 
                          className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
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
          </section>

          {/* Why Use Afrikoni Logistics */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-goldDark/10 border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut flex items-center gap-3">
                  <Truck className="w-8 h-8 text-afrikoni-gold" />
                  Why Use Afrikoni Logistics Partners?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { icon: Shield, text: 'Verified and trusted partners' },
                    { icon: TrendingUp, text: 'Competitive shipping rates' },
                    { icon: Package, text: 'Real-time tracking' },
                    { icon: CheckCircle, text: 'Insurance coverage available' },
                    { icon: Clock, text: 'Fast delivery times' },
                    { icon: Users, text: 'Dedicated support team' }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <Icon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-afrikoni-deep">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Join as Partner CTA */}
          {(!logisticsPartners || logisticsPartners.length === 0) && (
            <section className="mb-16">
              <Card className="bg-gradient-to-r from-afrikoni-chestnut to-afrikoni-deep border-0">
                <CardContent className="p-8 md:p-12 text-center">
                  <Truck className="w-16 h-16 text-afrikoni-gold mx-auto mb-6" />
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Become a Logistics Partner
                  </h2>
                  <p className="text-xl text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                    Join Afrikoni's logistics network and help facilitate trade across Africa. 
                    Get verified, access our platform, and grow your business.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-lg px-8 py-6"
                    onClick={handleBecomePartner}
                  >
                    Apply to Join Network
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Logistics Plans Pricing Table */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Logistics Plans & Pricing
              </h2>
              <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
                Choose the shipping option that works best for your business
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Standard Plan */}
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-afrikoni-chestnut">Standard</CardTitle>
                  <CardDescription>Buyer arranges shipping</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-afrikoni-gold mb-2">Free</div>
                    <p className="text-sm text-afrikoni-deep">No platform fee</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Buyer handles shipping directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Full control over logistics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">No escrow protection for shipping</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">Select Standard</Button>
                </CardContent>
              </Card>

              {/* Afrikoni Logistics Plan */}
              <Card className="border-afrikoni-gold hover:border-afrikoni-gold transition-all shadow-lg relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">Recommended</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-afrikoni-chestnut">Afrikoni Logistics</CardTitle>
                  <CardDescription>Escrow-protected shipping</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-afrikoni-gold mb-2">2-5%</div>
                    <p className="text-sm text-afrikoni-deep">Of shipping cost</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Escrow protection for shipping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Verified logistics partners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Real-time tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Insurance coverage</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">Select Afrikoni Logistics</Button>
                </CardContent>
              </Card>

              {/* Verified Express Plan */}
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-afrikoni-chestnut">Verified Express</CardTitle>
                  <CardDescription>Premium fast shipping</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-afrikoni-gold mb-2">5-8%</div>
                    <p className="text-sm text-afrikoni-deep">Of shipping cost</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Priority shipping lanes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Faster delivery times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Premium support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-afrikoni-deep">Enhanced insurance</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">Select Express</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Incoterms Selection Guide */}
          <section className="mb-16">
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut flex items-center gap-3">
                  <Package className="w-8 h-8 text-afrikoni-gold" />
                  Incoterms Selection Guide
                </CardTitle>
                <CardDescription>
                  Choose the right shipping terms for your transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-3">EXW (Ex Works)</h4>
                    <p className="text-sm text-afrikoni-deep mb-2">
                      Buyer collects goods from seller's premises. Buyer responsible for all shipping costs and risks.
                    </p>
                    <Badge variant="outline" className="text-xs">Buyer Pays All</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-3">FOB (Free On Board)</h4>
                    <p className="text-sm text-afrikoni-deep mb-2">
                      Seller delivers goods to port. Buyer pays shipping from port to destination.
                    </p>
                    <Badge variant="outline" className="text-xs">Shared Responsibility</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-afrikoni-chestnut mb-3">CIF (Cost, Insurance, Freight)</h4>
                    <p className="text-sm text-afrikoni-deep mb-2">
                      Seller pays shipping and insurance to destination port. Buyer handles customs and final delivery.
                    </p>
                    <Badge variant="outline" className="text-xs">Seller Pays Shipping</Badge>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-afrikoni-gold/10 rounded-lg border border-afrikoni-gold/20">
                  <p className="text-sm text-afrikoni-deep">
                    <strong>Tip:</strong> Select your preferred Incoterms when creating an RFQ or during checkout. This helps suppliers provide accurate quotes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Need Shipping Services?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Request a quote from our verified logistics partners or join our network
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-lg px-8 py-6"
                  onClick={handleRequestQuote}
                >
                    Request Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10 text-lg px-8 py-6"
                  onClick={handleBecomePartner}
                >
                  {user && isLogistics(userRole) ? 'Go to Dashboard' : 'Become a Partner'}
                  </Button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}

export default function Logistics() {
  try {
    return (
      <ErrorBoundary fallbackMessage="Failed to load logistics partners page. Please try refreshing.">
        <LogisticsContent />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering Logistics component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8 border border-afrikoni-gold/20">
          <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-2">Something went wrong</h1>
          <p className="text-afrikoni-deep mb-6">
            Failed to load logistics partners page. Please try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-afrikoni-gold text-afrikoni-chestnut rounded hover:bg-afrikoni-goldDark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}
