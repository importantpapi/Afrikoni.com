/**
 * Leave Review Modal
 * Allows buyers to leave reviews for completed orders
 * Implements strict validation: only for completed orders, one review per order
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

const REVIEW_TAGS = [
  { value: 'communication', label: 'Communication' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'reliability', label: 'Reliability' }
];

export default function LeaveReviewModal({ isOpen, onClose, order, buyerCompanyId }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment && comment.length > 500) {
      toast.error('Comment must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          buyer_company_id: buyerCompanyId,
          seller_company_id: order.seller_company_id,
          rating: rating,
          comment: comment.trim() || null,
          tags: selectedTags,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting review:', error);
        
        // Check for duplicate review error
        if (error.code === '23505') {
          toast.error('You have already reviewed this order');
        } else {
          toast.error('Failed to submit review. Please try again.');
        }
        return;
      }

      toast.success('Review submitted! It will be visible after admin approval.');
      
      // Reset form
      setRating(0);
      setComment('');
      setSelectedTags([]);
      
      // Close modal and refresh parent
      onClose(true); // true indicates review was submitted
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
            Leave a Review
          </DialogTitle>
          <DialogDescription>
            Share your experience with this supplier. Your review will be verified and published after admin approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="p-4 bg-afrikoni-offwhite rounded-lg border border-afrikoni-gold/20">
            <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-1">
              <CheckCircle className="w-4 h-4 text-afrikoni-green" />
              <span>Verified Order</span>
            </div>
            <p className="font-semibold text-afrikoni-chestnut">
              Order #{order.id.slice(0, 8)}
            </p>
            <p className="text-sm text-afrikoni-deep/80">
              {order.currency} {order.total_amount?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-afrikoni-chestnut mb-3">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-afrikoni-gold fill-afrikoni-gold'
                        : 'text-afrikoni-deep/20'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-lg font-bold text-afrikoni-chestnut">
                  {rating}.0
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-afrikoni-chestnut mb-2">
              Comment (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience..."
              className="min-h-[120px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-afrikoni-deep/60 mt-1 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-afrikoni-chestnut mb-3">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    selectedTags.includes(tag.value)
                      ? 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white'
                      : 'hover:bg-afrikoni-gold/10'
                  }`}
                  onClick={() => !isSubmitting && handleTagToggle(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your review will be pending verification by our admin team. 
              Only verified reviews from completed orders are published to maintain trust and quality.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

