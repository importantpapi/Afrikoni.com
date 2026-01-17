/**
 * Seller Reviews Dashboard
 * Shows sellers their trust score, average rating, and received reviews
 * Read-only view - sellers cannot edit or delete reviews
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { 
  Star, TrendingUp, Award, Calendar, Package, MessageSquare,
  Shield, Heart, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import RequireCapability from '@/guards/RequireCapability';

function ReviewsDashboardInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [stats, setStats] = useState({
    trustScore: 50,
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[ReviewsDashboard] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → return early
    if (!user) {
      console.log('[ReviewsDashboard] No user');
      return;
    }

    // Now safe to load data
    loadReviewsData();
  }, [authReady, authLoading, user, profile, role]);

  const loadReviewsData = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const companyId = profile?.company_id || null;
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      // Load company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('Error loading company:', companyError);
        return;
      }

      setCompany(companyData);

      // Load approved reviews for this seller
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          order:orders (
            id,
            total_amount,
            currency
          ),
          buyer_company:companies!reviews_buyer_company_id_fkey (
            company_name
          )
        `)
        .eq('seller_company_id', companyId)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
        return;
      }

      setReviews(reviewsData || []);

      // Calculate stats
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsData?.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          breakdown[review.rating]++;
        }
      });

      setStats({
        trustScore: companyData.trust_score || 50,
        averageRating: companyData.average_rating || 0,
        totalReviews: companyData.approved_reviews_count || 0,
        breakdown
      });

    } catch (error) {
      console.error('Error in loadReviewsData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading reviews..." />;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut">Reviews & Trust Score</h1>
          <div className="text-center py-12">
            <p className="text-afrikoni-deep/60">Loading reviews...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Trust & Reviews</h1>
          <p className="text-afrikoni-deep/70">
            Your reputation is built through completed and verified trades
          </p>
        </div>

        {/* How Reviews Work - Transparency Section */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-3">How We Verify Reviews</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Only completed orders:</strong> Buyers can only review deals they've actually completed on Afrikoni</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p><strong>One review per deal:</strong> Each transaction can only be reviewed once (no fake duplicates)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Admin verification:</strong> Every review is manually checked by our team before it becomes public</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Immutable:</strong> Once approved, reviews cannot be edited or deleted (protects authenticity)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Weighted trust score:</strong> Recent, high-value, dispute-free deals count more in your score</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-blue-700 italic">
                    💡 This system ensures your trust score reflects real trade performance, not marketing.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trust Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-purple/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-afrikoni-gold rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-afrikoni-deep/70 mb-1">Trust Score</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-afrikoni-chestnut">
                        {stats.trustScore}
                      </p>
                      <span className="text-lg text-afrikoni-deep/60">/100</span>
                    </div>
                    <p className="text-xs text-afrikoni-deep/60 mt-1">
                      Based on {stats.totalReviews} verified {stats.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Rating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-2 border-afrikoni-purple/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-afrikoni-purple" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-afrikoni-deep/70 mb-1">Average Rating</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-afrikoni-chestnut">
                        {stats.averageRating.toFixed(1)}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(stats.averageRating)
                                ? 'text-afrikoni-gold fill-afrikoni-gold'
                                : 'text-afrikoni-deep/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Reviews */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-2 border-afrikoni-green/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-afrikoni-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-afrikoni-deep/70 mb-1">Approved Reviews</p>
                    <p className="text-4xl font-black text-afrikoni-chestnut">
                      {stats.totalReviews}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Rating Breakdown */}
        <Card className="border-2 border-afrikoni-gold/20">
          <CardHeader className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 border-b border-afrikoni-gold/20">
            <CardTitle className="flex items-center gap-2 text-afrikoni-chestnut">
              <TrendingUp className="w-5 h-5 text-afrikoni-gold" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.breakdown[rating] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium text-afrikoni-chestnut">{rating}</span>
                      <Star className="w-4 h-4 text-afrikoni-gold fill-afrikoni-gold" />
                    </div>
                    <div className="flex-1 h-3 bg-afrikoni-offwhite rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-afrikoni-gold to-afrikoni-gold/80 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-afrikoni-deep/70 w-16 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card className="border-2 border-afrikoni-gold/20">
          <CardHeader className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 border-b border-afrikoni-gold/20">
            <CardTitle className="flex items-center gap-2 text-afrikoni-chestnut">
              <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-purple/20 rounded-full flex items-center justify-center">
                  <Heart className="w-10 h-10 text-afrikoni-gold" />
                </div>
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                  No reviews yet
                </h3>
                <p className="text-afrikoni-deep/70 max-w-md mx-auto">
                  Your trust score will be built through completed and verified trades. 
                  Focus on delivering quality products and excellent service to earn great reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 bg-gradient-to-r from-white to-afrikoni-offwhite rounded-lg border border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? 'text-afrikoni-gold fill-afrikoni-gold'
                                : 'text-afrikoni-deep/20'
                            }`}
                          />
                        ))}
                        <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-green-700 shadow-sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified Order
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white">
                          {new Date(review.approved_at).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Badge>
                      </div>
                      <span className="text-sm text-afrikoni-deep/60">
                        {new Date(review.approved_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-afrikoni-deep/80 leading-relaxed mb-3">
                        "{review.comment}"
                      </p>
                    )}

                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {review.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-afrikoni-deep/60">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Deal: {review.order_id?.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {review.order?.currency || 'USD'} {review.order?.total_amount?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function ReviewsDashboard() {
  return (
    <>
      {/* PHASE 5B: Reviews requires sell capability (approved) */}
      <RequireCapability canSell={true} requireApproved={true}>
        <ReviewsDashboardInner />
      </RequireCapability>
    </>
  );
}
