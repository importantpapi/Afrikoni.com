/**
 * Reviews & Trust Score Dashboard
 * View and manage company reviews
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Shield, Award, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { 
  getCompanyReviews, 
  getCompanyTrustHistory,
  getCompanyRanking
} from '@/lib/supabaseQueries/reviews';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';

export default function ReviewsDashboard() {
  const [reviews, setReviews] = useState([]);
  const [trustHistory, setTrustHistory] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [userRole, setUserRole] = useState('buyer');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, role, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);
      setUserRole(role);

      // Load reviews
      const reviewsList = await getCompanyReviews(userCompanyId);
      setReviews(reviewsList);

      // Load trust history
      const history = await getCompanyTrustHistory(userCompanyId);
      setTrustHistory(history);

      // Load ranking
      const companyRanking = await getCompanyRanking(userCompanyId);
      setRanking(companyRanking);
    } catch (error) {
      console.error('Error loading reviews data:', error);
      toast.error('Failed to load reviews data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) / reviews.length;
  };

  const getRankingBadge = (rankBucket) => {
    if (!rankBucket) return null;
    const colors = {
      'gold': 'bg-yellow-500',
      'silver': 'bg-gray-400',
      'bronze': 'bg-orange-600'
    };
    return colors[rankBucket.toLowerCase()] || 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  const avgRating = calculateAverageRating();
  const company = reviews[0]?.reviewed_company || reviews[0]?.reviewer_company;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Reviews & Trust Score</h1>
            <p className="text-afrikoni-text-dark/70">Manage your company reviews and trust metrics</p>
          </div>
        </motion.div>

        {/* Trust Score & Ranking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-cream border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">Trust Score</p>
                  <h2 className="text-4xl font-bold text-afrikoni-text-dark">
                    {company?.trust_score || 0}
                  </h2>
                  <p className="text-xs text-afrikoni-text-dark/60 mt-2">Out of 100</p>
                </div>
                <div className="p-4 bg-afrikoni-gold/20 rounded-full">
                  <Shield className="w-8 h-8 text-afrikoni-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl font-bold text-afrikoni-text-dark">
                      {avgRating.toFixed(1)}
                    </h2>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(avgRating)
                              ? 'fill-afrikoni-gold text-afrikoni-gold'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-afrikoni-text-dark/60 mt-2">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
                <div className="p-4 bg-afrikoni-gold/20 rounded-full">
                  <Star className="w-8 h-8 text-afrikoni-gold fill-afrikoni-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {ranking && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-1">Company Ranking</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getRankingBadge(ranking.rank_bucket)} text-white px-3 py-1`}>
                        {ranking.rank_bucket?.toUpperCase() || 'STANDARD'}
                      </Badge>
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/60 mt-2">
                      Score: {ranking.rank_score?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-afrikoni-gold/20 rounded-full">
                    <Award className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reviews">
          <TabsList>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="trust">Trust History</TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description="Reviews from your trading partners will appear here"
                  />
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating_overall
                                        ? 'fill-afrikoni-gold text-afrikoni-gold'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.verified_purchase && (
                                <Badge variant="success" className="text-xs">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold">
                              {review.reviewer_company?.name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-afrikoni-text-dark/60">
                              {format(new Date(review.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-afrikoni-text-dark/80 mb-3">{review.comment}</p>
                        )}
                        {review.rating_quality || review.rating_communication || review.rating_shipping ? (
                          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                            {review.rating_quality && (
                              <div>
                                <p className="text-xs text-afrikoni-text-dark/70 mb-1">Quality</p>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating_quality
                                          ? 'fill-afrikoni-gold text-afrikoni-gold'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.rating_communication && (
                              <div>
                                <p className="text-xs text-afrikoni-text-dark/70 mb-1">Communication</p>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating_communication
                                          ? 'fill-afrikoni-gold text-afrikoni-gold'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.rating_shipping && (
                              <div>
                                <p className="text-xs text-afrikoni-text-dark/70 mb-1">Shipping</p>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating_shipping
                                          ? 'fill-afrikoni-gold text-afrikoni-gold'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust History Tab */}
          <TabsContent value="trust" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trust Score History</CardTitle>
              </CardHeader>
              <CardContent>
                {trustHistory.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No trust history"
                    description="Trust score changes will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {trustHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">
                            {entry.old_score || 0} → {entry.new_score}
                          </p>
                          <p className="text-sm text-afrikoni-text-dark/60">
                            {entry.reason || 'Score update'}
                          </p>
                          <p className="text-xs text-afrikoni-text-dark/50 mt-1">
                            {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${
                          (entry.new_score || 0) > (entry.old_score || 0) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {(entry.new_score || 0) > (entry.old_score || 0) ? '+' : ''}
                          {(entry.new_score || 0) - (entry.old_score || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

