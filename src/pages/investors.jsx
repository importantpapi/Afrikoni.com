import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Zap, DollarSign } from 'lucide-react';
import { createPageUrl } from '../utils';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Investors() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('Investors');
  }, []);

  const [email, setEmail] = React.useState('');

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

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Stub: in future, send to investor updates list
    console.log('Investor updates subscription:', email);
    setEmail('');
  };

  return (
    <>
      <SEO
        title="Investors - Afrikoni Growth, Metrics & Vision"
        description="Learn about Afrikoni's traction, growth metrics and vision for building the AI-powered B2B trade infrastructure for Africa."
        url="/investors"
      />
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
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-12 text-center text-afrikoni-cream mb-8">
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
                    <a href="tel:+32456779368" className="text-afrikoni-deep">
                      +32 456 77 93 68
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

        {/* Investor Updates Subscribe */}
        <Card className="border-afrikoni-gold/30 mt-8">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                Receive Afrikoni investor updates
              </h3>
              <p className="text-sm text-afrikoni-deep/80 max-w-xl">
                Join our investor mailing list to get periodic updates on traction, product roadmap and fundraising.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="sm:w-64"
              />
              <Button type="submit" className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight">
                Subscribe
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

