import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { FileText, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Blog/News placeholder page
 * SEO-ready architecture for future blog posts
 */
export default function Blog() {
  const { t } = useLanguage();

  // Placeholder blog posts
  const placeholderPosts = [
    {
      id: 1,
      title: 'How to Source Verified African Suppliers',
      excerpt: 'Learn the best practices for finding and working with verified suppliers across Africa.',
      date: 'Coming Soon',
      category: 'Sourcing',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca8849d1?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Understanding Escrow Payments in B2B Trade',
      excerpt: 'A comprehensive guide to secure payment methods for cross-border transactions.',
      date: 'Coming Soon',
      category: 'Payments',
      image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Logistics Solutions for African Trade',
      excerpt: 'Explore efficient shipping and logistics options for your African B2B transactions.',
      date: 'Coming Soon',
      category: 'Logistics',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop'
    }
  ];

  return (
    <>
      <SEO 
        title="Blog & News - Afrikoni Insights | AFRIKONI"
        description="Stay updated with the latest insights, guides, and news about B2B trade in Africa. Learn about sourcing, payments, logistics, and more."
        url="/blog"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-gold/20 via-afrikoni-cream to-afrikoni-offwhite border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6">
                Afrikoni Blog & News
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep mb-8">
                Insights, guides, and updates about B2B trade across Africa
              </p>
            </motion.div>
          </div>
        </section>

        {/* Coming Soon CTA */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 rounded-2xl p-8 md:p-12"
            >
              <FileText className="w-16 h-16 text-afrikoni-gold mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-4">
                Content Coming Soon
              </h2>
              <p className="text-afrikoni-deep mb-6 max-w-2xl mx-auto">
                We're preparing valuable content about B2B trade, sourcing strategies, payment solutions, and logistics across Africa. 
                Join our community to stay updated!
              </p>
              <Button
                onClick={() => openWhatsAppCommunity('blog_cta')}
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Join WhatsApp Community
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Placeholder Posts */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Upcoming Articles
              </h2>
              <p className="text-lg text-afrikoni-deep/80">
                Preview of content we're working on
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placeholderPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all flex flex-col">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-afrikoni-gold text-afrikoni-chestnut px-3 py-1 rounded-full text-xs font-semibold">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <h3 className="font-bold text-afrikoni-chestnut text-xl mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-afrikoni-deep leading-relaxed mb-4 flex-1 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center text-afrikoni-gold font-semibold text-sm">
                        <span>Coming Soon</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


