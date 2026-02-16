import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { UserCheck, Package, MessageCircle, TrendingUp, Star, Box, Leaf, Shirt } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function SellerGrowth() {
  const steps = [
    {
      number: 1,
      title: 'Create & Verify Account',
      description: 'Sign up with business details and complete our fast verification process.',
      time: '5 minutes',
      icon: UserCheck
    },
    {
      number: 2,
      title: 'List Your Products',
      description: 'Add high-quality photos, detailed descriptions, and competitive pricing.',
      time: '15 minutes',
      icon: Package
    },
    {
      number: 3,
      title: 'Connect with Buyers',
      description: 'Receive orders, communicate with buyers, and build lasting partnerships.',
      time: 'Ongoing',
      icon: MessageCircle
    },
    {
      number: 4,
      title: 'Scale Your Business',
      description: 'Use our logistics support and analytics to grow across Africa.',
      time: 'Continuous growth',
      icon: TrendingUp
    }
  ];

  const successStories = [
    {
      name: 'Kwame Asante',
      initials: 'KA',
      business: 'Golden Coast Exports',
      location: 'Ghana',
      growth: '300% Revenue Growth',
      countries: '15 Countries Reached',
      quote: 'Afrikoni helped me expand from selling locally to exporting across 15 African countries.',
      product: 'Cocoa Products',
      icon: Box
    },
    {
      name: 'Amara Diallo',
      initials: 'AD',
      business: 'Sahel Organics',
      location: 'Senegal',
      growth: '250% Revenue Growth',
      countries: '8 Countries Reached',
      quote: 'The trade finance solutions made it possible for us to fulfill large international orders.',
      product: 'Organic Shea Butter',
      icon: Leaf
    },
    {
      name: 'Fatou Kone',
      initials: 'FK',
      business: 'Ivory Textiles',
      location: "Côte d'Ivoire",
      growth: '400% Revenue Growth',
      countries: '12 Countries Reached',
      quote: 'Our traditional fabrics now reach customers across Africa thanks to Afrikoni\'s platform.',
      product: 'Traditional Fabrics',
      icon: Shirt
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-4">Start Selling in 4 Simple Steps</h1>
          <p className="text-os-lg text-afrikoni-deep max-w-3xl mx-auto">
            Get your products in front of thousands of African buyers in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8 mb-20">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-afrikoni-creamfont-bold text-os-lg z-10">
                  {step.number}
                </div>
                <Card className="border-os-accent/20 pt-8 pb-6 text-center h-full bg-afrikoni-offwhite">
                  <CardContent>
                    <Icon className="w-12 h-12 text-os-accent mx-auto mb-4" />
                    <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-3">{step.title}</h3>
                    <p className="text-afrikoni-deep text-os-sm mb-4">{step.description}</p>
                    <div className="inline-block bg-afrikoni-offwhite text-os-accent px-4 py-1 rounded-full text-os-xs font-semibold">
                      {step.time}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-4">Real Success Stories</h2>
            <p className="text-os-lg text-afrikoni-deep">
              See how African businesses are thriving with Afrikoni
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {successStories.map((story, idx) => {
              const ProductIcon = story.icon;
              return (
                <Card key={idx} className="border-os-accent/20 bg-afrikoni-offwhite">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-os-accent/20 text-os-accent rounded-full flex items-center justify-center font-bold text-os-lg flex-shrink-0">
                        {story.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-afrikoni-chestnut mb-1">{story.name}</h3>
                        <p className="text-os-sm text-afrikoni-deep">{story.business}, {story.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-os-xs font-semibold">
                        {story.growth}
                      </div>
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-os-xs font-semibold">
                        {story.countries}
                      </div>
                    </div>

                    <p className="text-afrikoni-deep mb-4 italic">"{story.quote}"</p>

                    <div className="flex items-center gap-2 text-os-sm text-afrikoni-deep">
                      <ProductIcon className="w-4 h-4" />
                      <span>{story.product}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-12 text-center text-afrikoni-cream">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Africa's Success Stories?</h2>
          <p className="text-os-lg mb-8 max-w-2xl mx-auto">
            Join thousands of successful African suppliers growing their business with Afrikoni
          </p>
          <Link to={createPageUrl('Signup')}>
            <Button className="bg-afrikoni-offwhite text-os-accent hover:bg-afrikoni-cream px-8 py-6 text-os-lg">
              <Package className="w-5 h-5 mr-2" />
              Start Selling Today →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

