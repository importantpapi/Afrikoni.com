import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Globe, TrendingUp, Shield, DollarSign, BarChart, Users, Star } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function SellerOnboarding() {
  const features = [
    {
      icon: Globe,
      title: 'Reach 54 African Countries',
      description: 'Access buyers across the entire African continent with our pan-African marketplace.',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Growth',
      description: 'Leverage AI for pricing optimization, demand forecasting, and automated operations.',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50'
    },
    {
      icon: Shield,
      title: 'Verified Business Profile',
      description: 'Build trust with buyers through our comprehensive verification system.',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50'
    },
    {
      icon: DollarSign,
      title: 'Multi-Currency Support',
      description: 'Accept payments in local currencies across Africa with automatic conversion.',
      iconColor: 'text-os-accent',
      iconBg: 'bg-afrikoni-offwhite'
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Track sales performance, customer behavior, and market trends in real-time.',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50'
    },
    {
      icon: Users,
      title: 'B2B Networking',
      description: 'Connect with wholesale buyers, distributors, and business partners.',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-os-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              For Sellers
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-4">
              Sell Across Africa with Confidence
            </h1>
            <p className="text-os-lg text-afrikoni-deep max-w-3xl mx-auto mb-8">
              Join Africa's leading B2B marketplace and expand your business reach. Connect with verified buyers, automate your operations, and grow your revenue with our AI-powered platform.
            </p>
            <div className="flex justify-center gap-4">
              <Link to={createPageUrl('Signup')}>
                <Button className="bg-green-600 hover:bg-green-700 text-afrikoni-creampx-8 py-6 text-os-lg">
                  Start Selling Now
                </Button>
              </Link>
              <Link to={createPageUrl('AddProduct')}>
                <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-os-lg">
                  List Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Sellers Choose Afrikoni */}
      <div className="py-16 bg-afrikoni-offwhite">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-afrikoni-chestnut text-center mb-12">Why Sellers Choose Afrikoni</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border-os-accent/20 hover:shadow-os-md transition bg-afrikoni-offwhite">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${feature.iconBg} rounded-os-sm flex items-center justify-center mb-4`}>
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-afrikoni-chestnut text-os-xl mb-2">{feature.title}</h3>
                    <p className="text-afrikoni-deep text-os-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

