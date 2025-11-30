import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Zap, DollarSign } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Investors() {
  const milestones = [
    {
      year: '2024',
      text: 'Reached 50,000+ active users across 54 African countries'
    },
    {
      year: '2024',
      text: 'Processed $120M in trade volume with 250% YoY growth'
    },
    {
      year: '2023',
      text: 'Launched AI-powered supplier matching and trade finance solutions'
    },
    {
      year: '2023',
      text: 'Secured partnerships with major logistics providers across Africa'
    },
    {
      year: '2022',
      text: 'Achieved profitability with positive unit economics'
    },
    {
      year: '2022',
      text: 'Expanded to all 54 African countries'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">For Investors</h1>
          <p className="text-lg text-afrikoni-deep max-w-3xl mx-auto">
            Partner with us to unlock Africa's trade potential and generate exceptional returns
          </p>
        </div>

        {/* Key Milestones */}
        <Card className="border-afrikoni-gold/20 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-afrikoni-gold" />
              <h2 className="text-2xl font-bold text-afrikoni-chestnut">Key Milestones</h2>
            </div>
            <div className="space-y-4">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="bg-orange-600 text-afrikoni-creampx-4 py-1 rounded-full text-sm font-semibold flex-shrink-0">
                    {milestone.year}
                  </div>
                  <p className="text-afrikoni-deep pt-1">{milestone.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-12 text-center text-afrikoni-creammb-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Journey?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Partner with us to unlock Africa's trade potential and generate exceptional returns.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-afrikoni-offwhite text-afrikoni-gold hover:bg-afrikoni-cream px-8 py-6 text-lg">
              <Mail className="w-5 h-5 mr-2" />
              Contact Investor Relations
            </Button>
          </div>
        </div>

        {/* Investor Contact */}
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-6">Investor Contact</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-4">Investor Relations Team</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-afrikoni-deep/70" />
                    <a href="mailto:investors@afrikoni.com" className="text-blue-600 hover:text-blue-700">
                      investors@afrikoni.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-afrikoni-deep/70" />
                    <a href="tel:+2341234567890" className="text-afrikoni-deep">
                      +234 (0) 123 456 7890
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-4">Headquarters</h3>
                <div className="space-y-2 text-afrikoni-deep">
                  <p className="font-medium">Afrikoni Limited</p>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-afrikoni-deep/70 mt-0.5" />
                    <div>
                      <p>Victoria Island, Lagos</p>
                      <p>Nigeria</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

