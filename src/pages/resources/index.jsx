import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

const ARTICLES = [
  {
    slug: 'how-to-source-verified-african-suppliers',
    title: 'How to Source Verified African Suppliers',
    summary:
      'A step-by-step guide to finding and working with verified African suppliers using Afrikoni Shield™.',
    tags: ['Buyers', 'Verification', 'Afrikoni Shield'],
    estimatedRead: '6 min read',
  },
  {
    slug: 'kyc-kyb-and-aml-for-african-b2b-trade',
    title: 'KYC, KYB & AML for African B2B Trade',
    summary:
      'Understand how KYC, KYB, and AML work in African trade — and how Afrikoni automates these checks for you.',
    tags: ['Compliance', 'Risk', 'Afrikoni Shield'],
    estimatedRead: '7 min read',
  },
  {
    slug: 'escrow-vs-advance-payments-in-african-trade',
    title: 'Escrow vs Advance Payments in African Trade',
    summary:
      'Why escrow-protected payments are safer than traditional advance payments when buying from new suppliers.',
    tags: ['Payments', 'Escrow', 'Buyers', 'Suppliers'],
    estimatedRead: '5 min read',
  },
];

export default function ResourcesIndex() {
  return (
    <>
      <SEO
        title="Afrikoni Insights - Guides for African B2B Trade"
        description="Actionable guides on sourcing from Africa, supplier verification, escrow payments, and Afrikoni Shield™ best practices."
        url="/resources"
      />
      <div className="min-h-screen bg-afrikoni-offwhite py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-afrikoni-chestnut mb-3">
              Afrikoni Insights
            </h1>
            <p className="text-base md:text-lg text-afrikoni-deep max-w-2xl mx-auto">
              Practical guides on African B2B trade, supplier verification, escrow payments, and how to
              get the most from Afrikoni Shield™.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ARTICLES.map((article, idx) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="h-full border-afrikoni-gold/20 hover:shadow-lg transition-shadow bg-white">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-3">
                      <Badge className="bg-afrikoni-gold/15 text-afrikoni-gold border-afrikoni-gold/40 text-[11px] uppercase tracking-wide">
                        Afrikoni Shield™
                      </Badge>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-afrikoni-chestnut mb-2 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-afrikoni-deep/80 mb-4 line-clamp-3 flex-1">
                      {article.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-afrikoni-deep/60 mb-3">
                      <span>{article.estimatedRead}</span>
                    </div>
                    <Link to={`/resources/${article.slug}`}>
                      <Button
                        variant="outline"
                        className="w-full border-afrikoni-gold/40 text-afrikoni-gold hover:bg-afrikoni-gold/10 text-sm"
                      >
                        Read guide
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


