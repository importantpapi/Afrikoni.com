import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, Globe, CheckCircle, Plane, Ship, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Logistics() {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Logistics Partners');
  }, []);

  // Mock logistics partners data
  const logisticsPartners = [
    {
      id: 1,
      name: 'AfriLogistics Express',
      country: 'Nigeria',
      services: ['Air', 'Sea', 'Land'],
      coverage: 'West Africa',
      rating: 4.8,
      shipments: '10,000+'
    },
    {
      id: 2,
      name: 'East Africa Shipping Co.',
      country: 'Kenya',
      services: ['Air', 'Sea'],
      coverage: 'East Africa',
      rating: 4.7,
      shipments: '8,500+'
    },
    {
      id: 3,
      name: 'South African Freight',
      country: 'South Africa',
      services: ['Air', 'Sea', 'Land'],
      coverage: 'Southern Africa',
      rating: 4.9,
      shipments: '15,000+'
    },
    {
      id: 4,
      name: 'Morocco Transport Network',
      country: 'Morocco',
      services: ['Air', 'Land'],
      coverage: 'North Africa',
      rating: 4.6,
      shipments: '7,200+'
    },
    {
      id: 5,
      name: 'Ghana Cargo Services',
      country: 'Ghana',
      services: ['Sea', 'Land'],
      coverage: 'West Africa',
      rating: 4.5,
      shipments: '6,800+'
    },
    {
      id: 6,
      name: 'Pan-African Logistics',
      country: 'Multiple',
      services: ['Air', 'Sea', 'Land'],
      coverage: 'Pan-African',
      rating: 4.8,
      shipments: '25,000+'
    }
  ];

  const getServiceIcon = (service) => {
    switch (service) {
      case 'Air':
        return Plane;
      case 'Sea':
        return Ship;
      case 'Land':
        return Car;
      default:
        return Truck;
    }
  };

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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-creammb-4">
                Logistics & Shipping Partners
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream-100 max-w-3xl mx-auto mb-8">
                Connect with Afrikoni-approved logistics partners for reliable shipping across Africa
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Request Shipping Quote
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="border-white text-afrikoni-creamhover:bg-afrikoni-offwhite/10">
                    Become a Partner
                  </Button>
                </Link>
              </div>
            </motion.div>
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {logisticsPartners.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <CardTitle className="text-xl mb-1">{partner.name}</CardTitle>
                          <div className="flex items-center gap-2 text-afrikoni-deep">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{partner.country}</span>
                          </div>
                        </div>
                        <Badge variant="success" className="bg-green-100 text-green-700">
                          Verified
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Services */}
                      <div>
                        <p className="text-sm font-semibold text-afrikoni-deep mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {partner.services.map((service, sIdx) => {
                            const ServiceIcon = getServiceIcon(service);
                            return (
                              <Badge key={sIdx} variant="outline" className="flex items-center gap-1">
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
                        <p className="text-sm text-afrikoni-deep">{partner.coverage}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-afrikoni-gold/20">
                        <div>
                          <p className="text-xs text-afrikoni-deep/70">Rating</p>
                          <p className="text-sm font-semibold text-afrikoni-gold">{partner.rating} ⭐</p>
                        </div>
                        <div>
                          <p className="text-xs text-afrikoni-deep/70">Shipments</p>
                          <p className="text-sm font-semibold text-afrikoni-deep">{partner.shipments}</p>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                        Request Quote
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                    { icon: CheckCircle, text: 'Verified and trusted partners' },
                    { icon: CheckCircle, text: 'Competitive shipping rates' },
                    { icon: CheckCircle, text: 'Real-time tracking' },
                    { icon: CheckCircle, text: 'Insurance coverage available' },
                    { icon: CheckCircle, text: 'Fast delivery times' },
                    { icon: CheckCircle, text: 'Dedicated support team' }
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
                Request a quote from our verified logistics partners
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                    Request Quote
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}

