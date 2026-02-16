/**
 * AI Product Recommendations Carousel
 * Displays AI-powered product recommendations
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import OptimizedImage from '@/components/OptimizedImage';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import { getProductRecommendations } from '@/lib/supabaseQueries/ai';
import { trackProductView } from '@/lib/supabaseQueries/products';
import EmptyState from '@/components/shared/ui/EmptyState';

export default function ProductRecommendations({ productId, currentUserId, currentCompanyId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4;

  useEffect(() => {
    loadRecommendations();
  }, [productId]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const recs = await getProductRecommendations(productId, 12);
      setRecommendations(recs || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProduct = async (product) => {
    // Track product view
    if (currentUserId || currentCompanyId) {
      try {
        await trackProductView(product.id, {
          profile_id: currentUserId,
          company_id: currentCompanyId,
          source_page: 'product_recommendation'
        });
      } catch (error) {
        // Silent fail - tracking is non-critical
      }
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= recommendations.length ? 0 : prev + itemsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev - itemsPerView < 0 
        ? Math.max(0, Math.floor((recommendations.length - 1) / itemsPerView) * itemsPerView)
        : prev - itemsPerView
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-os-accent" />
          <h2 className="text-os-2xl font-bold text-afrikoni-chestnut">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-afrikoni-cream rounded-lg mb-3" />
                <div className="h-4 bg-afrikoni-cream rounded mb-2" />
                <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show empty state, just don't render
  }

  const visibleProducts = recommendations.slice(currentIndex, currentIndex + itemsPerView);
  const canGoNext = currentIndex + itemsPerView < recommendations.length;
  const canGoPrev = currentIndex > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-os-accent" />
          <h2 className="text-os-2xl font-bold text-afrikoni-chestnut">Recommended for You</h2>
          <span className="text-os-sm text-afrikoni-deep/60">({recommendations.length})</span>
        </div>
        {recommendations.length > itemsPerView && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={!canGoPrev}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={!canGoNext}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
          {visibleProducts.map((product, idx) => {
            const imageUrl = getPrimaryImageFromProduct(product);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/product?id=${product.id}`}
                  onClick={() => handleViewProduct(product)}
                >
                  <Card hover className="h-full">
                    <div className="relative h-48 bg-afrikoni-cream rounded-t-xl overflow-hidden">
                      {imageUrl ? (
                        <OptimizedImage
                          src={imageUrl}
                          alt={product.title || product.name || 'Product'}
                          className="w-full h-full object-cover"
                          width={400}
                          height={300}
                          placeholder="/product-placeholder.svg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-os-accent/20 to-afrikoni-cream flex items-center justify-center">
                          <Package className="w-12 h-12 text-os-accent/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-afrikoni-chestnut mb-2 line-clamp-2">
                        {product.title || product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-os-lg font-bold text-os-accent">
                          {product.currency || 'USD'} {product.price_min || product.price || 'N/A'}
                        </span>
                        {product.country_of_origin && (
                          <span className="text-os-xs text-afrikoni-deep/60">
                            {product.country_of_origin}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

