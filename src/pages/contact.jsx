import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('Contact');
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', category: '', subject: '', message: '' });
      setIsLoading(false);
    }, 1000);
  };

  const offices = [
    {
      city: 'Lagos, Nigeria',
      address: 'Victoria Island Business District',
      phone: '+234 1 234 5678',
      email: 'lagos@afrikoni.com'
    },
    {
      city: 'Nairobi, Kenya',
      address: 'Westlands Business Park',
      phone: '+254 20 123 4567',
      email: 'nairobi@afrikoni.com'
    },
    {
      city: 'Cairo, Egypt',
      address: 'New Administrative Capital',
      phone: '+20 2 1234 5678',
      email: 'cairo@afrikoni.com'
    }
  ];

  return (
    <>
      <SEO 
        title="Contact Us - Get in Touch"
        description="Contact AFRIKONI for support, partnerships, or inquiries. We're here to help you grow your business across Africa."
        url="/contact"
      />
      <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-center text-afrikoni-creammb-12">
          <div className="w-16 h-16 bg-afrikoni-offwhite/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Contact & Support</h1>
          <p className="text-lg text-afrikoni-cream90">
            We're here to help you succeed on Afrikoni. Get in touch with our support team.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Email Support</h3>
              <p className="text-sm text-afrikoni-deep mb-2">Get detailed help via email</p>
              <a href="mailto:support@afrikoni.com" className="text-blue-600 hover:underline">
                support@afrikoni.com
              </a>
              <div className="mt-4">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Within 24 hours
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Live Chat</h3>
              <p className="text-sm text-afrikoni-deep mb-2">Chat with our support team</p>
              <p className="text-xs text-afrikoni-deep/70 mb-4">Available on dashboard</p>
              <div>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Immediate response
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <Phone className="w-12 h-12 text-afrikoni-gold mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Phone Support</h3>
              <p className="text-sm text-afrikoni-deep mb-2">Speak directly with our team</p>
              <a href="tel:+234800AFRIKONI" className="text-afrikoni-gold hover:underline">
                +234 800 AFRIKONI
              </a>
              <div className="mt-4">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Business hours
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="border-afrikoni-gold/20">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your inquiry"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your question or issue in detail..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Office Locations */}
          <Card className="border-afrikoni-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Our Offices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {offices.map((office, idx) => (
                <div key={idx} className="border-b border-afrikoni-gold/20 pb-6 last:border-0 last:pb-0">
                  <h3 className="font-bold text-afrikoni-chestnut mb-2">{office.city}</h3>
                  <div className="space-y-2 text-sm text-afrikoni-deep">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {office.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {office.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {office.email}
                    </div>
                  </div>
                </div>
              ))}

              {/* Support Hours */}
              <div className="pt-6 border-t border-afrikoni-gold/20">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-afrikoni-deep" />
                  <h3 className="font-bold text-afrikoni-chestnut">Support Hours</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-afrikoni-deep">Email Support</span>
                    <span className="text-green-600 font-semibold">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-afrikoni-deep">Live Chat</span>
                    <span className="text-green-600 font-semibold">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-afrikoni-deep">Phone Support</span>
                    <span className="text-afrikoni-chestnut">Mon-Fri 8AM-6PM WAT</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

