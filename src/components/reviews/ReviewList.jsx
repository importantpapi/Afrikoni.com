import React, { useState, useEffect } from 'react';
import { Star, Plus } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { CheckCircle } from 'lucide-react';
import ReviewForm from './ReviewForm';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

const ReviewList = React.memo(function ReviewList({ reviews, companies, isSeller, product, supplier, onUpdate }) {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      return;
    }

    // Now safe to check review
    loadUserAndCheckReview();
  }, [product?.id, profile?.company_id, authReady, authLoading]);

  const loadUserAndCheckReview = async () => {
    try {
      const companyId = profile?.company_id || null;

      if (companyId && product?.id) {
        // Check if user has already reviewed this product
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('reviewer_company_id', companyId)
          .maybeSingle();

        if (existingReviews) {
          setHasReviewed(true);
          setExistingReview(existingReviews);
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const isBuyer = user && !isSeller;

  return (
    <div className="space-y-6">
      {/* Review Form Section - Show for buyers who haven't reviewed */}
      {isBuyer && !hasReviewed && !showReviewForm && (
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">
                {t('reviews.shareExperience') || 'Share Your Experience'}
              </h3>
              <p className="text-sm">
                {t('reviews.helpOthers') || 'Help other buyers by leaving a review'}
              </p>
            </div>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="hover:bg-afrikoni-goldDark"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('reviews.writeReview') || 'Write Review'}
            </Button>
          </div>
        </div>
      )}

      {/* Show existing review if user has reviewed */}
      {isBuyer && hasReviewed && existingReview && (
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">
              {t('reviews.yourReview') || 'Your Review'}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= existingReview.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          {existingReview.comment && (
            <p className="text-sm">{existingReview.comment}</p>
          )}
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && product && (
        <ReviewForm
          product={product}
          company={supplier}
          onSuccess={() => {
            setShowReviewForm(false);
            setHasReviewed(true);
            if (onUpdate) onUpdate();
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-3" />
          <p className="">
            {t('reviews.noReviews') || 'No reviews yet. Be the first to review this product!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const reviewerCompany = companies?.find(c => c.id === review.reviewer_company_id);
            const isUserReview = review.reviewer_company_id === userCompanyId;
            return (
              <div key={review.id} className={`border-b border-afrikoni-gold/20 pb-4 last:border-0 ${isUserReview ? 'bg-afrikoni-gold/5 p-4 rounded-lg' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">
                      {reviewerCompany?.company_name || 'Anonymous'}
                      {isUserReview && (
                        <span className="ml-2 text-xs">(You)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.verified_purchase && (
                    <Badge variant="secondary" className="">
                      <CheckCircle className="w-3 h-3 mr-1" /> {t('reviews.verifiedPurchase') || 'Verified Purchase'}
                    </Badge>
                  )}
                </div>
                {review.comment && <p className="text-sm mt-2">{review.comment}</p>}
                {review.quality_rating && (
                  <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                    <div>{t('reviews.quality') || 'Quality'}: {review.quality_rating}/5</div>
                    {review.communication_rating && <div>{t('reviews.communication') || 'Communication'}: {review.communication_rating}/5</div>}
                    {review.delivery_rating && <div>{t('reviews.delivery') || 'Delivery'}: {review.delivery_rating}/5</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ReviewList;
