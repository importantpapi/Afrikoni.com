/**
 * Afrikoni Shield™ - Admin Review Moderation
 * Admin-only page for moderating reviews and ratings
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Star, Eye, EyeOff, Trash2, CheckCircle2, XCircle,
  Search, Filter, MessageSquare, Package, Building2
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminReviews() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    verified: 0,
    flagged: 0
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadReviews();
      loadStats();
    }
  }, [hasAccess, ratingFilter, statusFilter]);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setHasAccess(isAdmin(userData));
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('rating, verified_purchase');

      if (data && data.length > 0) {
        const total = data.length;
        const averageRating = data.reduce((sum, r) => sum + (r.rating || 0), 0) / total;
        const verified = data.filter(r => r.verified_purchase).length;

        setStats({
          total,
          averageRating: averageRating.toFixed(1),
          verified,
          flagged: 0 // Could add a flagged field later
        });
      }
    } catch (error) {
      // Silently fail
    }
  };

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          products(title, images),
          companies!reviews_reviewed_company_id_fkey(company_name, logo_url),
          companies!reviews_reviewer_company_id_fkey(company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter));
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (statusFilter === 'verified') {
        filtered = filtered.filter(r => r.verified_purchase);
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(r => !r.verified_purchase);
      }

      if (searchQuery) {
        filtered = filtered.filter(r =>
          r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.companies?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.products?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setReviews(filtered);
    } catch (error) {
      console.log('Reviews table not yet set up:', error.message);
      // Set empty data - feature not yet available
      setReviews([]);
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      // In a real system, you'd add a 'hidden' or 'status' field to reviews table
      // For now, we'll just show a toast
      toast.success('Review hidden (feature requires database field)');
      loadReviews();
    } catch (error) {
      toast.error('Failed to hide review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      toast.success('Review deleted');
      loadReviews();
      loadStats();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/admin" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Review Moderation
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Moderate reviews, ratings, and feedback across the platform
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.total}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total Reviews
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.averageRating}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Average Rating
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.verified}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Verified Reviews
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-afrikoni-red" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {stats.flagged}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Flagged Reviews
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
              All Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-afrikoni-ivory">
                  <tr className="border-b border-afrikoni-gold/20">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Review</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Supplier</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Rating</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-afrikoni-text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-afrikoni-text-dark/70">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr key={review.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-afrikoni-text-dark line-clamp-2">
                              {review.comment || 'No comment'}
                            </p>
                            {review.quality_rating && (
                              <div className="text-xs text-afrikoni-text-dark/70 mt-1">
                                Quality: {review.quality_rating}/5 | 
                                Comm: {review.communication_rating || 'N/A'}/5 | 
                                Delivery: {review.delivery_rating || 'N/A'}/5
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {review.products?.images?.[0] && (
                              <img 
                                src={review.products.images[0]} 
                                alt={review.products.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="text-sm text-afrikoni-text-dark">
                              {review.products?.title || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {review.companies?.logo_url && (
                              <img 
                                src={review.companies.logo_url} 
                                alt={review.companies.company_name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div className="text-sm text-afrikoni-text-dark">
                              {review.companies?.company_name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold">{review.rating}/5</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={review.verified_purchase ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                            {review.verified_purchase ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-afrikoni-text-dark/70">
                          {review.created_at ? format(new Date(review.created_at), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {review.products?.id && (
                              <Link to={`/product?id=${review.products.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                              onClick={() => handleHideReview(review.id)}
                            >
                              <EyeOff className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

