import React, { useState } from 'react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';

export default function ReviewModal({ isOpen, onClose, trade, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('reviews').insert({
                trade_id: trade.id,
                reviewer_id: user?.id,
                reviewee_id: trade.seller_id || trade.seller?.id,
                rating,
                comment,
                created_at: new Date().toISOString(),
            });

            if (error) throw new Error(error.message);

            if (onSubmit) {
                await onSubmit({ rating, comment, tradeId: trade.id });
            }

            toast.success('Review Submitted', {
                description: 'Thank you for your feedback! This helps build trust in the network.'
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg"
                >
                    <Surface variant="panel" className="p-6 md:p-8 bg-white shadow-2xl border-os-stroke rounded-xl overflow-hidden">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
                            <p className="text-gray-500">
                                How was your trade with <strong className="text-gray-900">{trade.seller?.company_name || 'the supplier'}</strong>?
                            </p>
                        </div>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'fill-gray-100 text-gray-300'
                                            } transition-colors duration-200`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Comments (Optional)
                                </label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share details about product quality, communication, and delivery..."
                                    className="min-h-[100px] resize-none border-gray-200 focus:border-os-accent focus:ring-os-accent/20"
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || rating === 0}
                                className="w-full h-12 text-lg font-bold bg-os-accent hover:bg-os-accent/90 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </div>
                    </Surface>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
