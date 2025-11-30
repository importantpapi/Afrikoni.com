import React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export default function ReviewList({ reviews, companies, isSeller, onUpdate }) {
  if (reviews.length === 0) {
    return <p className="text-afrikoni-deep/70">No reviews yet</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => {
        const reviewerCompany = companies?.find(c => c.id === review.reviewer_company_id);
        return (
          <div key={review.id} className="border-b border-afrikoni-gold/20 pb-4 last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-afrikoni-chestnut">{reviewerCompany?.company_name || 'Anonymous'}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.verified_purchase && (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified Purchase
                </Badge>
              )}
            </div>
            {review.comment && <p className="text-sm text-afrikoni-deep mt-2">{review.comment}</p>}
            {review.quality_rating && (
              <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-afrikoni-deep/70">
                <div>Quality: {review.quality_rating}/5</div>
                {review.communication_rating && <div>Communication: {review.communication_rating}/5</div>}
                {review.delivery_rating && <div>Delivery: {review.delivery_rating}/5</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

