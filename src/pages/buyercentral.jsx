import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, FileText, Users, Shield, TrendingUp, Globe, Award, Zap, BarChart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function BuyerCentral() {
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    countries: 0,
    successRate: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('role', 'seller')
      ]);

      setStats({
        products: productsRes.count || 2500000,
        suppliers: suppliersRes.count || 15000,
        countries: 54,
        successRate: 98
      });
    } catch (error) {
      // Error logged (removed for production)
      // Use default values
      setStats({
        products: 2500000,
        suppliers: 15000,
        countries: 54,
        successRate: 98
      });
    }
  };

  const services = [
    {
      icon: Search,
      title: 'Product Sourcing',
      description: 'Find the right products from verified suppliers',
      color: 'bg-afrikoni-gold',
      link: '/products'
    },
    {
      icon: FileText,
      title: 'Request for Quotation',
      description: 'Get competitive quotes from multiple suppliers',
      color: 'bg-green-600',
      link: '/rfq/create'
    },
    {
      icon: Users,
      title: 'Supplier Verification',
      description: 'Connect with verified and trusted suppliers',
      color: 'bg-purple-600',
      link: '/suppliers'
    },
    {
      icon: Shield,
      title: 'Trade Assurance',
      description: 'Secure your transactions with trade protection',
      color: 'bg-orange-600',
      link: '/financing'
    },
    {
      icon: BarChart,
      title: 'Market Intelligence',
      description: 'Access market trends and pricing data',
      color: 'bg-afrikoni-gold',
      link: '/analytics'
    },
    {
      icon: MessageCircle,
      title: 'Communication Tools',
      description: 'Direct messaging with suppliers',
      color: 'bg-red-600',
      link: '/messages'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Breadcrumb */}
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-afrikoni-deep">
            <Link to="/" className="hover:text-afrikoni-gold flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <span>/</span>
            <span className="text-afrikoni-chestnut">Buyer Central</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-afrikoni-offwhite py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">Buyer Central</h1>
          <p className="text-lg text-afrikoni-deep mb-8 max-w-3xl">
            Your one-stop destination for sourcing quality products from Africa. Access tools, services, and resources designed specifically for buyers.
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="border-0 shadow-md bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">2.5M+</div>
                <div className="text-afrikoni-deep">Products</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">15,000+</div>
                <div className="text-afrikoni-deep">Suppliers</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">54</div>
                <div className="text-afrikoni-deep">Countries</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-afrikoni-gold mb-2">98%</div>
                <div className="text-afrikoni-deep">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Buyer Services */}
      <div className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-8">Buyer Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <Card key={idx} className="border-afrikoni-gold/20 hover:border-blue-600 transition-all hover:shadow-lg bg-afrikoni-offwhite">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${service.color === 'bg-afrikoni-gold' ? 'bg-blue-100' : service.color === 'bg-green-600' ? 'bg-green-100' : service.color === 'bg-purple-600' ? 'bg-purple-100' : service.color === 'bg-orange-600' ? 'bg-afrikoni-gold/20' : service.color === 'bg-red-600' ? 'bg-red-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 ${service.color === 'bg-afrikoni-gold' ? 'text-blue-600' : service.color === 'bg-green-600' ? 'text-green-600' : service.color === 'bg-purple-600' ? 'text-purple-600' : service.color === 'bg-orange-600' ? 'text-afrikoni-gold' : service.color === 'bg-red-600' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">{service.title}</h3>
                    <p className="text-afrikoni-deep mb-4 text-sm">{service.description}</p>
                    <Link to={service.link}>
                      <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full">Learn More</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-afrikoni-offwhite py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-8">Why Choose Afrikoni?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">Global Reach</h3>
                <p className="text-afrikoni-deep text-sm">Access suppliers from 54 African countries</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">Verified Suppliers</h3>
                <p className="text-afrikoni-deep text-sm">All suppliers go through rigorous verification</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">Quality Assurance</h3>
                <p className="text-afrikoni-deep text-sm">Products meet international standards</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-afrikoni-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">Fast Response</h3>
                <p className="text-afrikoni-deep text-sm">Get quotes within 24 hours</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-afrikoni-creammb-4">Ready to Start Sourcing?</h2>
          <p className="text-lg text-afrikoni-cream90 mb-8">
            Join thousands of buyers who trust Afrikoni for their sourcing needs
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-afrikoni-offwhite text-blue-600 hover:bg-afrikoni-offwhite/90">
                Get Started
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-afrikoni-creamhover:bg-afrikoni-offwhite/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

