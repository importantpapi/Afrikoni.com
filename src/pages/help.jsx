import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Search, FileText, HelpCircle, Shield, CreditCard, Truck, AlertTriangle, User, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { sanitizeHTML } from '@/utils/sanitizeHTML';

export default function Help() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqCategories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: HelpCircle,
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Click "Sign Up" in the top right corner. Choose whether you want to buy or sell (or both). Complete your profile with basic information. You can start browsing immediately, but you\'ll need to complete onboarding to list products or place orders.'
        },
        {
          question: 'What information do I need to sign up?',
          answer: 'You\'ll need: Your name, email address, phone number, and basic business information. For sellers, you\'ll also need company details and verification documents.'
        },
        {
          question: 'Can I be both a buyer and seller?',
          answer: 'Yes! Many businesses on Afrikoni are both buyers and sellers. During signup, you can select "Both" or add the other role later in your dashboard settings.'
        },
        {
          question: 'How long does account verification take?',
          answer: 'Basic verification is instant. Enhanced verification (for sellers) typically takes 1-3 business days after you submit all required documents.'
        }
      ]
    },
    {
      id: 'buying',
      name: 'For Buyers',
      icon: User,
      faqs: [
        {
          question: 'How do I place an order?',
          answer: 'Browse products or search for what you need. Click on a product to view details. Click "Contact Supplier" to send an inquiry, or "Add to Cart" if the product has fixed pricing. You can also create an RFQ (Request for Quotation) to get quotes from multiple suppliers.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept multiple payment methods including bank transfers, credit cards, and escrow payments through Flutterwave. All payments are secured through our Trade Shield escrow system, which holds funds until you confirm delivery.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order is confirmed, you\'ll receive tracking information via email and in your dashboard. Go to Dashboard → Orders to see all your orders and their status. You can also communicate directly with the supplier through the order chat.'
        },
        {
          question: 'What is your return policy?',
          answer: 'We offer a money-back guarantee if products don\'t meet specifications or are damaged. Contact support within 7 days of delivery to initiate a return. Our dispute resolution team will review your case within 48 hours.'
        },
        {
          question: 'What is Trade Shield escrow?',
          answer: 'Trade Shield is our escrow protection system. When you pay for an order, funds are held securely until you confirm delivery and satisfaction. This protects you from fraud and ensures you receive what you ordered. Learn more on our <Link to="/escrow-policy" className="text-os-accent hover:underline">Escrow Policy</Link> page.'
        },
        {
          question: 'How do I create an RFQ?',
          answer: 'Go to "Create RFQ" from the main menu or your dashboard. Fill in what you\'re looking for, quantity, specifications, and deadline. Verified suppliers will submit quotes. You can compare and choose the best offer.'
        }
      ]
    },
    {
      id: 'selling',
      name: 'For Sellers',
      icon: Settings,
      faqs: [
        {
          question: 'How do I list my products?',
          answer: 'Sign up as a seller, complete your company profile, and start adding products through the "Add Product" page in your dashboard. Include high-quality photos, detailed descriptions, pricing, and specifications. Products go through a review process before going live.'
        },
        {
          question: 'What are the fees?',
          answer: 'We offer transparent pricing: Bronze (Free, 3% transaction fee), Silver ($49/month or 2% fee), Gold ($199/month or 1% fee), and Enterprise (custom pricing). First 10 transactions are FREE for Bronze sellers. See our <Link to="/pricing" className="text-os-accent hover:underline">Pricing</Link> page for details.'
        },
        {
          question: 'How do I get verified?',
          answer: 'Complete your company profile with business documents, certifications, and verification details. Go to Dashboard → Verification Center to upload required documents. Our team will review and verify your account within 1-3 business days.'
        },
        {
          question: 'How do I receive payments?',
          answer: 'Payments are held in Trade Shield escrow until order completion. Once the buyer confirms delivery, funds are automatically released to your account. You can withdraw to your bank account or use funds for future purchases on the platform.'
        },
        {
          question: 'How do I respond to RFQs?',
          answer: 'Browse active RFQs in the RFQ marketplace. Click on an RFQ to see details, then submit a quote with your pricing, delivery terms, and timeline. Buyers will review and may contact you for negotiations.'
        },
        {
          question: 'What happens if a buyer disputes an order?',
          answer: 'Our dispute resolution team will review the case within 48 hours. We\'ll examine evidence from both sides and make a fair decision. Funds remain in escrow until resolution. See our <Link to="/disputes" className="text-os-accent hover:underline">Dispute Resolution</Link> page for more information.'
        }
      ]
    },
    {
      id: 'payments',
      name: 'Payment & Escrow',
      icon: CreditCard,
      faqs: [
        {
          question: 'How does escrow work?',
          answer: 'When you pay for an order, funds are held securely in our Trade Shield escrow account. The supplier ships your order. Once you confirm delivery and satisfaction, funds are released to the supplier. If there\'s an issue, our dispute team will help resolve it.'
        },
        {
          question: 'When do I get paid as a seller?',
          answer: 'Funds are released to your account once the buyer confirms delivery. This typically happens within 1-3 days after delivery. You\'ll receive a notification when funds are available.'
        },
        {
          question: 'What payment methods are supported?',
          answer: 'We support bank transfers, credit/debit cards, and mobile money through Flutterwave. All payments are processed securely and held in escrow until order completion.'
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees! Our pricing is completely transparent. You only pay the transaction fee shown (1-3% depending on your tier) or your monthly subscription. See our <Link to="/pricing" className="text-os-accent hover:underline">Pricing</Link> page for full details.'
        },
        {
          question: 'What is Afrikoni\'s fee?',
          answer: 'Afrikoni charges a small transaction fee (1-3% depending on your seller tier) on successful orders. This fee covers escrow protection, dispute resolution, payment processing, customer support, and platform maintenance. First 10 transactions are FREE for Bronze sellers.'
        }
      ]
    },
    {
      id: 'shipping',
      name: 'Shipping & Logistics',
      icon: Truck,
      faqs: [
        {
          question: 'Who handles shipping?',
          answer: 'Shipping is typically arranged by the supplier, but you can discuss logistics options during order negotiation. We also offer logistics services through our partners for consolidated shipping and better rates.'
        },
        {
          question: 'How long does shipping take?',
          answer: 'Shipping times vary by location and shipping method. Domestic shipping within African countries typically takes 3-7 days. International shipping can take 7-21 days depending on the destination and shipping method chosen.'
        },
        {
          question: 'What about customs and duties?',
          answer: 'Buyers are typically responsible for customs duties and import taxes. These are not included in the product price. Make sure to factor these costs into your budget when ordering internationally.'
        },
        {
          question: 'Can I track my shipment?',
          answer: 'Yes! Once your order ships, you\'ll receive tracking information. You can view it in your order details in the dashboard. Suppliers are required to provide tracking for all orders.'
        }
      ]
    },
    {
      id: 'disputes',
      name: 'Disputes & Protection',
      icon: Shield,
      faqs: [
        {
          question: 'What is Trade Shield?',
          answer: 'Trade Shield is our comprehensive protection system that includes escrow payments, dispute resolution, fraud prevention, and quality assurance. It protects both buyers and sellers throughout the transaction process.'
        },
        {
          question: 'How do I open a dispute?',
          answer: 'Go to your order details and click "Open Dispute". Describe the issue and provide evidence (photos, documents, etc.). Our dispute resolution team will review your case within 48 hours and work to resolve it fairly.'
        },
        {
          question: 'What can I dispute?',
          answer: 'You can dispute orders that don\'t match the description, are damaged, arrive late beyond agreed terms, or if the supplier doesn\'t fulfill their obligations. See our <Link to="/disputes" className="text-os-accent hover:underline">Dispute Resolution</Link> page for full details.'
        },
        {
          question: 'How long does dispute resolution take?',
          answer: 'We aim to resolve disputes within 48 hours. Simple cases may be resolved faster, while complex cases may take up to 5 business days. We\'ll keep you updated throughout the process.'
        },
        {
          question: 'What if I\'m not satisfied with the resolution?',
          answer: 'You can appeal a dispute resolution decision by contacting our support team with additional evidence. Our team will review the appeal and make a final decision.'
        }
      ]
    },
    {
      id: 'account',
      name: 'Account & Settings',
      icon: User,
      faqs: [
        {
          question: 'How do I update my profile?',
          answer: 'Go to Dashboard → Settings to update your personal information, company details, payment methods, and notification preferences.'
        },
        {
          question: 'Can I change my account type?',
          answer: 'Yes! You can add buyer or seller roles at any time in your dashboard settings. If you\'re already verified as a seller, you can also upgrade your tier (Bronze → Silver → Gold) anytime.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'Contact our support team to request account deletion. We\'ll process your request within 7 days. Note: You must resolve any open orders or disputes before account deletion.'
        },
        {
          question: 'How do I change my password?',
          answer: 'Go to Dashboard → Settings → Security to change your password. You can also reset your password from the login page if you\'ve forgotten it.'
        }
      ]
    }
  ];

  // Filter FAQs based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <>
      <SEO
        title="Help Center - Afrikoni Support"
        description="Find answers to common questions or contact Afrikoni support. Learn how buying, selling, escrow and Trade Shield protection work."
        url="/help"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-4">
              Help Center
            </h1>
            <p className="text-os-lg text-afrikoni-deep/80 max-w-2xl mx-auto">
              Find answers to your questions or get in touch with our support team
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-os-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
            </div>
          </div>

          {/* Support Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-os-accent/20 hover:shadow-os-md transition-shadow">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Live Chat</h3>
                <p className="text-os-sm text-afrikoni-deep mb-4">Get instant help from our support team</p>
                <Button className="w-full bg-os-accent hover:bg-os-accentDark">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-os-accent/20 hover:shadow-os-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Email Support</h3>
                <p className="text-os-sm text-afrikoni-deep mb-2">
                  <a href="mailto:hello@afrikoni.com" className="text-os-accent hover:underline">
                    hello@afrikoni.com
                  </a>
                </p>
                <p className="text-os-xs text-afrikoni-deep/70">Response within 24 hours</p>
              </CardContent>
            </Card>

            <Card className="border-os-accent/20 hover:shadow-os-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Phone className="w-12 h-12 text-os-accent mx-auto mb-4" />
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Phone Support</h3>
                <p className="text-os-sm text-afrikoni-deep mb-2">
                  <a href="tel:+32456779368" className="text-os-accent hover:underline">
                    +32 456 77 93 68
                  </a>
                </p>
                <p className="text-os-xs text-afrikoni-deep/70">Mon-Fri 9AM-6PM CET</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Categories */}
          {searchQuery ? (
            <div className="space-y-6">
              <h2 className="text-os-2xl font-bold text-afrikoni-chestnut">
                Search Results
              </h2>
              {filteredCategories.map((category) => (
                <Card key={category.id} className="border-os-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="w-5 h-5" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.faqs.map((faq, idx) => {
                      const faqId = `${category.id}-${idx}`;
                      return (
                        <div key={idx} className="border-b border-os-accent/20 pb-4 last:border-0">
                          <button
                            onClick={() => setOpenFaq(openFaq === faqId ? null : faqId)}
                            className="w-full flex items-center justify-between text-left"
                          >
                            <span className="font-semibold text-afrikoni-chestnut pr-4">
                              {faq.question}
                            </span>
                            {openFaq === faqId ? (
                              <ChevronUp className="w-5 h-5 text-afrikoni-deep/70 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-afrikoni-deep/70 flex-shrink-0" />
                            )}
                          </button>
                          {openFaq === faqId && (
                            <div className="mt-3 text-afrikoni-deep" dangerouslySetInnerHTML={{ __html: sanitizeHTML(faq.answer) }} />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
              {filteredCategories.length === 0 && (
                <Card className="border-os-accent/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-afrikoni-deep/80">
                      No results found for "{searchQuery}". Try different keywords or{' '}
                      <Link to="/contact" className="text-os-accent hover:underline">
                        contact support
                      </Link>.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {faqCategories.map((category) => (
                <Card key={category.id} className="border-os-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-os-xl">
                      <category.icon className="w-6 h-6" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.faqs.map((faq, idx) => {
                      const faqId = `${category.id}-${idx}`;
                      return (
                        <div key={idx} className="border-b border-os-accent/20 pb-4 last:border-0">
                          <button
                            onClick={() => setOpenFaq(openFaq === faqId ? null : faqId)}
                            className="w-full flex items-center justify-between text-left group"
                          >
                            <span className="font-semibold text-afrikoni-chestnut group-hover:text-os-accent transition-colors pr-4">
                              {faq.question}
                            </span>
                            {openFaq === faqId ? (
                              <ChevronUp className="w-5 h-5 text-afrikoni-deep/70 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-afrikoni-deep/70 flex-shrink-0" />
                            )}
                          </button>
                          {openFaq === faqId && (
                            <div className="mt-3 text-afrikoni-deep leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(faq.answer) }} />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Still Need Help */}
          <Card className="mt-12 bg-afrikoni-cream/50 border-os-accent/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">
                Still Need Help?
              </h2>
              <p className="text-afrikoni-deep/80 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:hello@afrikoni.com">Email Us</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
