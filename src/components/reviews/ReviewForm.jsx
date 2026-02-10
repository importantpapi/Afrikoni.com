import React, { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

export default function ReviewForm({ order, product, company, onSuccess, onCancel }) {
  // Use centralized AuthProvider
  const { user, profile, role, authReady } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    // GUARD: Wait for auth to be ready
    if (!authReady || !user) {
      toast.error('Please login first');
      return;
    }

    const companyId = profile?.company_id || null;
    if (!companyId) {
      toast.error('Please complete onboarding first');
      return;
    }

    setIsLoading(true);
    try {

      // Check if user already reviewed this product
      if (product?.id) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('product_id', product.id)
          .eq('reviewer_company_id', companyId)
          .maybeSingle();

        if (existingReview) {
          toast.error('You have already reviewed this product');
          setIsLoading(false);
          return;
        }
      }

      // Check if this is a verified purchase (has order)
      const isVerifiedPurchase = !!order?.id;

      const reviewData = {
        order_id: order?.id || null,
        product_id: product?.id || null,
        reviewed_company_id: company?.id || null,
        reviewer_company_id: companyId,
        rating,
        comment: comment.trim() || null,
        quality_rating: qualityRating || null,
        communication_rating: communicationRating || null,
        delivery_rating: deliveryRating || null,
        verified_purchase: isVerifiedPurchase
      };

      const { error } = await supabase.from('reviews').insert(reviewData);
      if (error) throw error;

      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      setQualityRating(0);
      setCommunicationRating(0);
      setDeliveryRating(0);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Overall Rating *</Label>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating) ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Quality</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQualityRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= qualityRating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Communication</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCommunicationRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= communicationRating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Delivery</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDeliveryRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= deliveryRating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading} 
            className={`${onCancel ? 'flex-1' : 'w-full'} bg-afrikoni-gold hover:bg-amber-700`}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

