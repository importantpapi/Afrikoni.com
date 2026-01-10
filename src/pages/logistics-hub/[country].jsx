/**
 * Logistics Hub - Country-Specific
 * Showcase logistics coverage and partners for a country
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, MapPin, Clock, Shield, Package, 
  Globe, CheckCircle, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { getCountryConfig, TARGET_COUNTRY, getMarketingContent } from '@/config/countryConfig';
import { supabase } from '@/api/supabaseClient';
import Layout from '@/layout';
import { Link } from 'react-router-dom';

export default function LogisticsHubPage() {
  const { country } = useParams();
  const [config, setConfig] = useState(null);
  const [logisticsPartners, setLogisticsPartners] = useState([]);
  const [stats, setStats] = useState({
    totalShipments: 0,
    activePartners: 0,
    countriesCovered: 0,
    avgDeliveryTime: '7-14 days'
  });

  useEffect(() => {
    const countryName = country || TARGET_COUNTRY;
    const countryConfig = getCountryConfig();
    setConfig(countryConfig);
    loadLogisticsData(countryName);
  }, [country]);

  const loadLogisticsData = async (countryName) => {
    try {
      // Get logistics partners (companies with logistics role)
      const { data: partners } = await supabase
        .from('companies')
        .select('id, company_name, country, city, verified')
        .eq('role', 'logistics')
        .eq('country', countryName)
        .limit(10);

      setLogisticsPartners(partners || []);

      // Get shipment stats (mock for now)
      setStats({
        totalShipments: 1250,
        activePartners: partners?.length || 0,
        countriesCovered: 25,
        avgDeliveryTime: '7-14 days'
      });
    } catch (error) {
      console.error('Error loading logistics data:', error);
    }
  };

  if (!config) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const shippingOptions = [
    {
      type: 'Sea Freight',
      from: config.logisticsHubs?.[0] || 'Port',
      to: 'Global',
      time: '14-30 days',
      cost: 'Competitive rates',
      icon: Package
    },
    {
      type: 'Air Freight',
      from: config.logisticsHubs?.[0] || 'Airport',
      to: 'Global',
      time: '3-7 days',
      cost: 'Fast & reliable',
      icon: Globe
    },
    {
      type: 'Road Transport',
      from: config.logisticsHubs?.[0] || 'City',
      to: 'Regional',
      time: '2-5 days',
      cost: 'Economical',
      icon: Truck
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-ivory to-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-afrikoni-gold text-afrikoni-chestnut">
                {getMarketingContent('logistics')}
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-afrikoni-text-dark mb-6">
                Logistics & Shipping from {config.name}
              </h1>
              <p className="text-xl text-afrikoni-text-dark/70 max-w-3xl mx-auto mb-8">
                Reliable shipping solutions from {config.name} to destinations worldwide. 
                Verified logistics partners, competitive rates, and full tracking.
              </p>
            </motion.div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Total Shipments', value: stats.totalShipments.toLocaleString(), icon: Package },
                { label: 'Active Partners', value: stats.activePartners, icon: Truck },
                { label: 'Countries Covered', value: stats.countriesCovered, icon: Globe },
                { label: 'Avg Delivery', value: stats.avgDeliveryTime, icon: Clock }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-afrikoni-gold/20">
                    <CardContent className="p-6 text-center">
                      <stat.icon className="w-8 h-8 text-afrikoni-gold mx-auto mb-2" />
                      <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-afrikoni-text-dark/70">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Shipping Options */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center text-afrikoni-text-dark mb-8">
                Shipping Options from {config.name}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {shippingOptions.map((option, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-colors">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                            <option.icon className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <CardTitle>{option.type}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-afrikoni-text-dark/50" />
                            <span>{option.from} → {option.to}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-afrikoni-text-dark/50" />
                            <span>{option.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-afrikoni-text-dark/50" />
                            <span>{option.cost}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Logistics Partners */}
            {logisticsPartners.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-center text-afrikoni-text-dark mb-8">
                  Verified Logistics Partners
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logisticsPartners.map((partner, idx) => (
                    <Card key={idx} className="border-afrikoni-gold/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-afrikoni-text-dark">{partner.company_name}</h3>
                          {partner.verified && (
                            <Badge className="bg-afrikoni-green text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-afrikoni-text-dark/70">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" />
                            {partner.city}, {partner.country}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="text-center">
              <Card className="border-afrikoni-gold/30 bg-gradient-to-r from-afrikoni-gold/5 to-afrikoni-green/5">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-afrikoni-text-dark mb-4">
                    Need Shipping from {config.name}?
                  </h2>
                  <p className="text-afrikoni-text-dark/70 mb-6">
                    Request a quote for your shipment and get competitive rates from verified partners
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link to="/logistics-partner-onboarding">
                      <Button variant="outline" size="lg">
                        Become a Partner
                      </Button>
                    </Link>
                    <Link to="/dashboard/logistics-quote">
                      <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut" size="lg">
                        Request Quote
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
