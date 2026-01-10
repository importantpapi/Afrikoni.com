/**
 * Success Stories Component
 * Showcase successful trades and supplier stories
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';
import { supabase } from '@/api/supabaseClient';

export default function SuccessStories({ limit = 3 }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const config = getCountryConfig();
      
      // Get completed orders with reviews (success stories)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          currency,
          created_at,
          seller_company:companies!orders_seller_company_id_fkey(
            company_name,
            country,
            verified
          ),
          buyer_company:companies!orders_buyer_company_id_fkey(
            company_name,
            country
          ),
          reviews(rating, comment)
        `)
        .eq('status', 'completed')
        .eq('seller_company.country', TARGET_COUNTRY)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Handle 401 errors gracefully (user not authenticated)
      if (ordersError) {
        if (ordersError.status === 401 || ordersError.message?.includes('JWT')) {
          // User not authenticated - show empty state
          setStories([]);
          setLoading(false);
          return;
        }
        // For other errors, show empty state
        setStories([]);
        setLoading(false);
        return;
      }

      if (orders && orders.length > 0) {
        const formattedStories = orders
          .filter(o => o.reviews && o.reviews.length > 0)
          .map(order => ({
            id: order.id,
            supplier: order.seller_company?.company_name || 'Supplier',
            buyer: order.buyer_company?.company_name || 'Buyer',
            amount: order.total_amount,
            currency: order.currency || 'USD',
            rating: order.reviews[0]?.rating || 5,
            comment: order.reviews[0]?.comment || 'Great experience!',
            date: order.created_at,
            verified: order.seller_company?.verified
          }));

        if (formattedStories.length > 0) {
          setStories(formattedStories);
          setLoading(false);
          return;
        }
      }

      // If no real stories, show empty state
      setStories([]);
    } catch (error) {
      // Silently handle errors - show empty state
      console.debug('Error loading stories (non-critical):', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading success stories...</div>;
  }

  if (stories.length === 0) {
    return (
      <Card className="border-afrikoni-gold/20">
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 text-afrikoni-text-dark/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-afrikoni-text-dark mb-2">
            Early Adopters — Join Now to Be Featured First!
          </h3>
          <p className="text-afrikoni-text-dark/70">
            Complete your first trade and become one of our success stories
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {stories.map((story, idx) => (
        <motion.div
          key={story.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-afrikoni-text-dark">{story.supplier}</h3>
                    {story.verified && (
                      <Badge className="bg-afrikoni-green text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-afrikoni-text-dark/70">to {story.buyer}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < story.rating
                          ? 'fill-afrikoni-gold text-afrikoni-gold'
                          : 'text-afrikoni-text-dark/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-afrikoni-text-dark/70 mb-4 italic">
                "{story.comment}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-afrikoni-gold/10">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-afrikoni-gold" />
                  <span className="font-semibold text-afrikoni-text-dark">
                    {story.currency} {parseFloat(story.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/60">
                  <TrendingUp className="w-3 h-3" />
                  <span>Success</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
