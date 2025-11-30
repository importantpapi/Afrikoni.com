import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function ReviewForm({ order, product, company, onSuccess }) {
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

    setIsLoading(true);
    try {
      const user = await supabaseHelpers.auth.me();
      if (!user || !user.company_id) {
        toast.error('Please login first');
        return;
      }

      const reviewData = {
        order_id: order?.id,
        product_id: product?.id,
        reviewed_company_id: company?.id,
        reviewer_company_id: user.company_id,
        rating,
        comment: comment.trim() || null,
        quality_rating: qualityRating || null,
        communication_rating: communicationRating || null,
        delivery_rating: deliveryRating || null,
        verified_purchase: true
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
      // Error logged (removed for production)
      toast.error('Failed to submit review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-afrikoni-gold/20">
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

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-afrikoni-gold hover:bg-amber-700">
          {isLoading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
}

