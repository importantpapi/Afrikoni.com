import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Search, FileText, Shield, CreditCard, Truck, MessageSquare } from 'lucide-react';
import SEO from '@/components/SEO';
import { SystemPageHero, SystemPageSection, SystemPageCard, SystemPageCTA } from '@/components/system/SystemPageLayout';

const ARTICLES = [
  {
    slug: 'how-to-source-verified-african-suppliers',
    title: 'How to Source Verified African Suppliers',
    summary: 'A step-by-step guide to finding and working with verified African suppliers using Afrikoni Shield™.',
    tags: ['Buyers', 'Verification', 'Afrikoni Shield'],
    category: 'Verification',
    estimatedRead: '6 min read',
  },
  {
    slug: 'kyc-kyb-and-aml-for-african-b2b-trade',
    title: 'KYC, KYB & AML for African B2B Trade',
    summary: 'Understand how KYC, KYB, and AML work in African trade — and how Afrikoni automates these checks for you.',
    tags: ['Compliance', 'Risk', 'Afrikoni Shield'],
    category: 'Verification',
    estimatedRead: '7 min read',
  },
  {
    slug: 'escrow-vs-advance-payments-in-african-trade',
    title: 'Escrow vs Advance Payments in African Trade',
    summary: 'Why escrow-protected payments are safer than traditional advance payments when buying from new suppliers.',
    tags: ['Payments', 'Escrow', 'Buyers', 'Suppliers'],
    category: 'Payments',
    estimatedRead: '5 min read',
  },
  {
    slug: 'rfq-best-practices',
    title: 'RFQ Best Practices for Suppliers',
    summary: 'Learn how to write compelling RFQ responses that win more deals and build buyer trust.',
    tags: ['RFQ', 'Sales', 'Best Practices'],
    category: 'RFQ',
    estimatedRead: '5 min read',
  },
  {
    slug: 'logistics-shipping-guide',
    title: 'Logistics & Shipping Guide',
    summary: 'Complete guide to shipping products across Africa using Afrikoni\'s logistics network.',
    tags: ['Logistics', 'Shipping', 'Transport'],
    category: 'Logistics',
    estimatedRead: '8 min read',
  },
  {
    slug: 'trade-shield-protection',
    title: 'Understanding Trade Shield Protection',
    summary: 'Everything you need to know about Afrikoni Trade Shield and how it protects your transactions.',
    tags: ['Trade Shield', 'Protection', 'Security'],
    category: 'Trade Shield',
    estimatedRead: '6 min read',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: FileText },
  { id: 'Verification', label: 'Verification', icon: Shield },
  { id: 'Payments', label: 'Payments', icon: CreditCard },
  { id: 'Logistics', label: 'Logistics', icon: Truck },
  { id: 'RFQ', label: 'RFQ', icon: MessageSquare },
  { id: 'Trade Shield', label: 'Trade Shield', icon: Shield },
];

export default function ResourcesIndex() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = ARTICLES.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SEO
        title="Supplier Resources - Guides for African B2B Trade | Afrikoni"
        description="Actionable guides on sourcing from Africa, supplier verification, escrow payments, and Afrikoni Shield™ best practices."
        url="/resources"
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <SystemPageHero
          eyebrow="Supplier Resources"
          eyebrowIcon={FileText}
          title="Afrikoni Insights & Resources"
          subtitle="Practical guides, best practices, and insights to help you succeed on Afrikoni. Learn about verification, payments, escrow, and how to maximize your sales."
          primaryCTA={{ label: 'Browse Resources', to: '#resources' }}
        />

        {/* Resources Section */}
        <SystemPageSection
          title="Resources & Guides"
          subtitle="Everything you need to succeed on Afrikoni"
          className="pt-12"
        >
          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-chestnut/50" />
              <Input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border-afrikoni-gold/30 focus:border-afrikoni-gold"
              />
            </div>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-meta font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-afrikoni-gold text-white border-afrikoni-gold'
                        : 'bg-white border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resource Cards */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                No resources found matching your search.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredArticles.map((article, idx) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card className="h-full border-afrikoni-gold/30 hover:shadow-lg transition-shadow bg-afrikoni-cream">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-3">
                        <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/40 text-[11px] uppercase tracking-wide">
                          {article.category}
                        </Badge>
                      </div>
                      <h2 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-3 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80 mb-4 line-clamp-3 flex-1">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[11px] border-afrikoni-gold/30">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-meta font-medium text-afrikoni-chestnut/60 mb-3">
                        <span>{article.estimatedRead}</span>
                      </div>
                      <Link to={`/resources/${article.slug}`}>
                        <Button
                          variant="outline"
                          className="w-full border-afrikoni-gold/40 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                        >
                          Read guide
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </SystemPageSection>

        {/* CTA Footer */}
        <SystemPageCTA
          title="Need Help?"
          description="Can't find what you're looking for? Contact Afrikoni Support for personalized assistance"
          ctaLabel="Contact Support"
          ctaTo="/contact"
        />
      </div>
    </>
  );
}
