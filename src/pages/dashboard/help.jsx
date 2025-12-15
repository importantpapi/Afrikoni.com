import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RequireDashboardRole from '@/guards/RequireDashboardRole';
import { useDashboardRole } from '@/context/DashboardRoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  BookOpen,
  Video,
  Download,
  ExternalLink,
} from 'lucide-react';

export default function DashboardHelp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();
  const { role: currentRole } = useDashboardRole();

  const buyerFaqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse products on the marketplace, add them to your cart, and proceed to checkout. You can also create an RFQ (Request for Quotation) to get quotes from multiple suppliers before placing an order.',
      category: 'Orders'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept multiple payment methods including bank transfers, credit cards, and escrow payments. All payments are secured through our Trade Shield escrow system, which protects both buyers and sellers.',
      category: 'Payments'
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is confirmed, you\'ll receive tracking information via email and in your dashboard. Navigate to "Orders" in your dashboard to view real-time order status and shipment tracking.',
      category: 'Orders'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a money-back guarantee if products don\'t meet specifications. Contact support within 7 days of delivery to initiate a return. Our Trade Shield protection covers quality issues and disputes.',
      category: 'Protection'
    },
    {
      question: 'How do I create an RFQ?',
      answer: 'Go to "RFQs" in your dashboard and click "Create RFQ". Fill in product details, quantity, target price, and delivery requirements. Suppliers will submit quotes, and you can compare and award the best one.',
      category: 'RFQs'
    },
    {
      question: 'What is Trade Shield protection?',
      answer: 'Trade Shield is our escrow protection system that holds payment until order delivery is confirmed. It protects buyers from non-delivery and sellers from non-payment, ensuring secure B2B transactions.',
      category: 'Protection'
    }
  ];

  const sellerFaqs = [
    {
      question: 'How do I list my products?',
      answer: 'Navigate to "Products & Listings" in your dashboard and click "Add Product". Fill in product details, upload images, set pricing and MOQ (Minimum Order Quantity), and publish your listing.',
      category: 'Products'
    },
    {
      question: 'How do I respond to RFQs?',
      answer: 'Browse "RFQs" in your dashboard to see buyer requests. Click on an RFQ to view details, then submit a quote with your price, delivery terms, and any additional information. Buyers will review and may award you the order.',
      category: 'RFQs'
    },
    {
      question: 'When do I get paid?',
      answer: 'Payment is released from escrow once the buyer confirms receipt and quality of the order. You can track payment status in the "Payments" section of your dashboard.',
      category: 'Payments'
    },
    {
      question: 'How do I manage my orders?',
      answer: 'Go to "Sales" in your dashboard to view all orders. Update order status (Processing, Shipped, Delivered) and communicate with buyers through the Messages feature.',
      category: 'Sales'
    },
    {
      question: 'How can I get verified?',
      answer: 'Complete your company profile with all required information, upload business documents, and apply for verification. Verified sellers get priority in search results and buyer trust badges.',
      category: 'Verification'
    },
    {
      question: 'What are the fees?',
      answer: 'Afrikoni charges a small transaction fee on completed orders. There are no listing fees or monthly subscriptions. Fees are transparent and shown before order confirmation.',
      category: 'Pricing'
    }
  ];

  const logisticsFaqs = [
    {
      question: 'How do I register as a logistics partner?',
      answer: 'Contact our support team to register as a logistics partner. Once approved, you\'ll have access to the logistics dashboard where you can view and manage shipments.',
      category: 'Registration'
    },
    {
      question: 'How do I track shipments?',
      answer: 'Navigate to "Shipments" in your dashboard to view all assigned shipments. Update shipment status, add tracking numbers, and communicate with buyers and sellers.',
      category: 'Shipments'
    },
    {
      question: 'What information do I need to provide?',
      answer: 'You\'ll need to provide carrier details, tracking numbers, origin and destination addresses, estimated delivery dates, and real-time status updates.',
      category: 'Shipments'
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', icon: BookOpen, link: '/help#getting-started' },
    { title: 'Video Tutorials', icon: Video, link: '/help#tutorials' },
    { title: 'Download Resources', icon: Download, link: '/help#resources' },
    { title: 'Contact Support', icon: MessageCircle, link: '/contact' }
  ];

  const supportOptions = [
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      action: 'Start Chat',
      available: true
    },
    {
      title: 'Email Support',
      description: 'hello@afrikoni.com',
      icon: Mail,
      action: 'Send Email',
      available: true
    },
    {
      title: 'Phone Support',
      description: '+32 456 77 93 68',
      icon: Phone,
      action: 'Call Now',
      available: true
    }
  ];

  const filteredFaqs = (faqs) => {
    if (!searchQuery) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    );
  };

  const handleSupportAction = (title) => {
    if (title === 'Live Chat') {
      navigate('/dashboard/support-chat');
      return;
    }

    if (title === 'Email Support') {
      if (typeof window !== 'undefined') {
        window.location.href =
          'mailto:hello@afrikoni.com?subject=Afrikoni%20Support&body=Hi%20Afrikoni%20team,%0D%0A%0D%0A';
      }
      return;
    }

    if (title === 'Phone Support') {
      if (typeof window !== 'undefined') {
        window.location.href = 'tel:+32456779368';
      }
    }
  };

  return (
    <RequireDashboardRole allow={['buyer', 'seller', 'hybrid', 'logistics']}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut">
            Help Center
          </h1>
          <p className="text-afrikoni-deep mt-1 text-sm md:text-base">
            Find answers to your questions or get in touch with our support team
          </p>
        </motion.div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-4">
          {supportOptions.map((option, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.1 }}
            >
              <Card className="hover:shadow-afrikoni-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-afrikoni-gold/10 rounded-full">
                      <option.icon className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-afrikoni-deep/70 mb-4">
                    {option.description}
                  </p>
                  <Button
                    variant={option.available ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    disabled={!option.available}
                    onClick={() => handleSupportAction(option.title)}
                  >
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {quickLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.link}
                  className="flex items-center gap-3 p-4 rounded-lg border border-afrikoni-gold/20 hover:bg-afrikoni-gold/5 transition-colors"
                >
                  <link.icon className="w-5 h-5 text-afrikoni-gold" />
                  <span className="text-sm font-medium text-afrikoni-chestnut">
                    {link.title}
                  </span>
                  <ExternalLink className="w-4 h-4 text-afrikoni-deep/50 ml-auto" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={currentRole === 'seller' ? 'seller' : currentRole === 'logistics' ? 'logistics' : 'buyer'}>
              <TabsList>
                {(currentRole === 'buyer' || currentRole === 'hybrid') && (
                  <TabsTrigger value="buyer">For Buyers</TabsTrigger>
                )}
                {(currentRole === 'seller' || currentRole === 'hybrid') && (
                  <TabsTrigger value="seller">For Sellers</TabsTrigger>
                )}
                {currentRole === 'logistics' && (
                  <TabsTrigger value="logistics">For Logistics</TabsTrigger>
                )}
              </TabsList>

              {(currentRole === 'buyer' || currentRole === 'hybrid') && (
                <TabsContent value="buyer" className="space-y-3 mt-4">
                  {filteredFaqs(buyerFaqs).length === 0 ? (
                    <div className="text-center py-8 text-afrikoni-deep/70">
                      No FAQs found matching your search.
                    </div>
                  ) : (
                    filteredFaqs(buyerFaqs).map((faq, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <button
                              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-afrikoni-gold/5 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Badge variant="outline" className="text-xs">
                                  {faq.category}
                                </Badge>
                                <span className="font-medium text-afrikoni-chestnut">
                                  {faq.question}
                                </span>
                              </div>
                              {openFaq === idx ? (
                                <ChevronUp className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-afrikoni-deep/50 flex-shrink-0" />
                              )}
                            </button>
                            {openFaq === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-afrikoni-deep/80">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>
              )}

              {(currentRole === 'seller' || currentRole === 'hybrid') && (
                <TabsContent value="seller" className="space-y-3 mt-4">
                  {filteredFaqs(sellerFaqs).length === 0 ? (
                    <div className="text-center py-8 text-afrikoni-deep/70">
                      No FAQs found matching your search.
                    </div>
                  ) : (
                    filteredFaqs(sellerFaqs).map((faq, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <button
                              onClick={() => setOpenFaq(openFaq === `seller-${idx}` ? null : `seller-${idx}`)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-afrikoni-gold/5 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Badge variant="outline" className="text-xs">
                                  {faq.category}
                                </Badge>
                                <span className="font-medium text-afrikoni-chestnut">
                                  {faq.question}
                                </span>
                              </div>
                              {openFaq === `seller-${idx}` ? (
                                <ChevronUp className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-afrikoni-deep/50 flex-shrink-0" />
                              )}
                            </button>
                            {openFaq === `seller-${idx}` && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-afrikoni-deep/80">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>
              )}

              {currentRole === 'logistics' && (
                <TabsContent value="logistics" className="space-y-3 mt-4">
                  {filteredFaqs(logisticsFaqs).length === 0 ? (
                    <div className="text-center py-8 text-afrikoni-deep/70">
                      No FAQs found matching your search.
                    </div>
                  ) : (
                    filteredFaqs(logisticsFaqs).map((faq, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <button
                              onClick={() => setOpenFaq(openFaq === `logistics-${idx}` ? null : `logistics-${idx}`)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-afrikoni-gold/5 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Badge variant="outline" className="text-xs">
                                  {faq.category}
                                </Badge>
                                <span className="font-medium text-afrikoni-chestnut">
                                  {faq.question}
                                </span>
                              </div>
                              {openFaq === `logistics-${idx}` ? (
                                <ChevronUp className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-afrikoni-deep/50 flex-shrink-0" />
                              )}
                            </button>
                            {openFaq === `logistics-${idx}` && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-afrikoni-deep/80">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Still Need Help */}
        <Card className="bg-afrikoni-gold/5 border-afrikoni-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-afrikoni-gold/10 rounded-full">
                <HelpCircle className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                  Still need help?
                </h3>
                <p className="text-sm text-afrikoni-deep/70">
                  Our support team is available 24/7 to assist you.
                </p>
              </div>
              <Link to="/contact">
                <Button variant="primary">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireDashboardRole>
  );
}

