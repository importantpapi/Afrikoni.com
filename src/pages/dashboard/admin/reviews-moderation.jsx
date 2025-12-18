/**
 * Admin Reviews Moderation Panel
 * Allows admins to approve/reject pending reviews
 * Critical for maintaining trust and quality on the platform
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, CheckCircle, XCircle, AlertTriangle, Eye, DollarSign, 
  Calendar, Building2, User, Package, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function ReviewsModerationInner() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadReviews();
  }, [filterStatus]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);

      // Get user to verify admin status
      const { user, profile } = await getCurrentUserAndRole(supabase);
      if (!user || !profile?.is_admin) {
        toast.error('Unauthorized access');
        return;
      }

      // Load reviews with order and company details
      let query = supabase
        .from('reviews')
        .select(`
          *,
          order:orders (
            id,
            total_amount,
            currency,
            status,
            created_at
          ),
          buyer_company:companies!reviews_buyer_company_id_fkey (
            id,
            company_name
          ),
          seller_company:companies!reviews_seller_company_id_fkey (
            id,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading reviews:', error);
        toast.error('Failed to load reviews');
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error in loadReviews:', error);
      toast.error('An error occurred while loading reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (review) => {
    if (!confirm(`Approve this review? This will make it public and update the seller's trust score.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', review.id);

      if (error) {
        console.error('Error approving review:', error);
        toast.error('Failed to approve review');
        return;
      }

      toast.success('Review approved! Trust score updated.');
      loadReviews();
    } catch (error) {
      console.error('Error in handleApprove:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (review) => {
    const reason = prompt('Reason for rejection (optional):');
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', review.id);

      if (error) {
        console.error('Error rejecting review:', error);
        toast.error('Failed to reject review');
        return;
      }

      toast.success('Review rejected');
      loadReviews();
    } catch (error) {
      console.error('Error in handleReject:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = [
    {
      label: 'Pending Reviews',
      value: reviews.filter(r => r.status === 'pending').length,
      icon: AlertTriangle,
      color: 'text-afrikoni-gold',
      bg: 'bg-afrikoni-gold/10'
    },
    {
      label: 'Approved Today',
      value: reviews.filter(r => 
        r.status === 'approved' && 
        new Date(r.approved_at).toDateString() === new Date().toDateString()
      ).length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      label: 'Total Reviews',
      value: reviews.length,
      icon: Star,
      color: 'text-afrikoni-purple',
      bg: 'bg-afrikoni-purple/10'
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-afrikoni-chestnut">Reviews Moderation</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-afrikoni-deep/60">Loading reviews...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Reviews Moderation</h1>
            <p className="text-afrikoni-deep/70">
              Verify and approve reviews from completed deals
            </p>
          </div>

          {/* Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-afrikoni-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-afrikoni-deep/70">{stat.label}</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-afrikoni-deep/30 mb-4" />
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                No {filterStatus !== 'all' ? filterStatus : ''} reviews
              </h3>
              <p className="text-afrikoni-deep/70">
                {filterStatus === 'pending' 
                  ? 'All caught up! No pending reviews to moderate.'
                  : 'No reviews match the current filter.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`border-2 ${
                  review.status === 'pending' 
                    ? 'border-afrikoni-gold/40 bg-afrikoni-gold/5' 
                    : review.status === 'approved'
                    ? 'border-green-200'
                    : 'border-red-200'
                }`}>
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={
                            review.status === 'pending' ? 'default' :
                            review.status === 'approved' ? 'success' : 'destructive'
                          } className={
                            review.status === 'pending' ? 'bg-afrikoni-gold' :
                            review.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                          }>
                            {review.status.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
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
                          </div>
                        </div>

                        {/* Deal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-afrikoni-gold" />
                            <div>
                              <p className="text-afrikoni-deep/60">Deal ID</p>
                              <p className="font-semibold text-afrikoni-chestnut">
                                {review.order_id?.slice(0, 8)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-afrikoni-green" />
                            <div>
                              <p className="text-afrikoni-deep/60">Deal Value</p>
                              <p className="font-semibold text-afrikoni-chestnut">
                                {review.order?.currency || 'USD'} {review.order?.total_amount?.toLocaleString() || '0'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-afrikoni-purple" />
                            <div>
                              <p className="text-afrikoni-deep/60">Buyer</p>
                              <p className="font-semibold text-afrikoni-chestnut">
                                {review.buyer_company?.company_name || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-afrikoni-gold" />
                            <div>
                              <p className="text-afrikoni-deep/60">Seller</p>
                              <p className="font-semibold text-afrikoni-chestnut">
                                {review.seller_company?.company_name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Review Content */}
                        {review.comment && (
                          <div className="mb-4 p-4 bg-white rounded-lg border border-afrikoni-gold/20">
                            <p className="text-afrikoni-deep/80 leading-relaxed">
                              "{review.comment}"
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {review.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-afrikoni-deep/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Submitted: {new Date(review.created_at).toLocaleDateString()}
                          </div>
                          {review.approved_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Approved: {new Date(review.approved_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {review.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApprove(review)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(review)}
                            disabled={isProcessing}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ReviewsModeration() {
  return (
    <RequireDashboardRole allow={['admin']}>
      <ReviewsModerationInner />
    </RequireDashboardRole>
  );
}

