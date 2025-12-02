import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Search, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const buyerFaqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse products, add them to your cart, and proceed to checkout. You can also create an RFQ to get quotes from multiple suppliers.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept multiple payment methods including bank transfers, credit cards, and escrow payments. All payments are secured through our escrow system.'
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is confirmed, you\'ll receive tracking information. You can view order status in your dashboard under "Orders".'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a money-back guarantee if products don\'t meet specifications. Contact support within 7 days of delivery to initiate a return.'
    }
  ];

  const sellerFaqs = [
    {
      question: 'How do I list my products?',
      answer: 'Sign up as a seller, complete your company profile, and start adding products through the "Add Product" page in your dashboard.'
    },
    {
      question: 'What are the fees?',
      answer: 'We charge a small transaction fee (3-5%) only when you successfully complete a sale. No upfront costs or monthly fees.'
    },
    {
      question: 'How do I get verified?',
      answer: 'Complete your company profile with business documents, certifications, and verification details. Our team will review and verify your account.'
    },
    {
      question: 'How do I receive payments?',
      answer: 'Payments are held in escrow until order completion. Once the buyer confirms delivery, funds are released to your account.'
    }
  ];

  return (
    <>
      <SEO
        title="Help Center - Afrikoni Support"
        description="Find answers to common questions or contact Afrikoni support. Learn how buying, selling, escrow and Afrikoni Shield™ protection work."
        url="/help"
      />
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">Help Center</h1>
          <p className="text-lg text-afrikoni-deep">
            Find answers to your questions or get in touch with our support team
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Live Chat</h3>
              <p className="text-sm text-afrikoni-deep mb-4">Get instant help from our support team</p>
              <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark">Online Now</Button>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Email Support</h3>
              <p className="text-sm text-afrikoni-deep mb-2">support@afrikoni.com</p>
              <p className="text-xs text-afrikoni-deep/70">Response within 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6 text-center">
              <Phone className="w-12 h-12 text-afrikoni-gold mx-auto mb-4" />
              <h3 className="font-bold text-afrikoni-chestnut mb-2">Phone Support</h3>
              <p className="text-sm text-afrikoni-deep mb-2">+234 (0) 123 456 7890</p>
              <p className="text-xs text-afrikoni-deep/70">Mon-Fri 9AM-6PM WAT</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Tabs */}
        <Tabs defaultValue="buyers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buyers">For Buyers</TabsTrigger>
            <TabsTrigger value="sellers">For Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="buyers" className="mt-6">
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Buyer FAQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyerFaqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-afrikoni-gold/20 pb-4 last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-semibold text-afrikoni-chestnut">{faq.question}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-5 h-5 text-afrikoni-deep/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-afrikoni-deep/70" />
                      )}
                    </button>
                    {openFaq === idx && (
                      <p className="mt-3 text-afrikoni-deep">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sellers" className="mt-6">
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Seller FAQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sellerFaqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-afrikoni-gold/20 pb-4 last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === `seller-${idx}` ? null : `seller-${idx}`)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-semibold text-afrikoni-chestnut">{faq.question}</span>
                      {openFaq === `seller-${idx}` ? (
                        <ChevronUp className="w-5 h-5 text-afrikoni-deep/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-afrikoni-deep/70" />
                      )}
                    </button>
                    {openFaq === `seller-${idx}` && (
                      <p className="mt-3 text-afrikoni-deep">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}

