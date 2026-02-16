/**
 * Quick Quote Modal
 *
 * A lightweight quote request form that allows buyers to quickly
 * request pricing from suppliers without creating a full RFQ.
 *
 * Reduces friction for simple inquiries while still capturing
 * key information needed for suppliers to respond.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Package, MapPin, MessageSquare, Loader2, Zap, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function QuickQuoteModal({
  open,
  onOpenChange,
  product,
  supplier
}) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: product?.min_order_quantity || '',
    unit: product?.moq_unit || product?.unit || 'units',
    destination: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/product?id=${product.id}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&intent=quick_quote`);
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a quick quote request (stored as a mini-RFQ)
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert({
          title: `Quick Quote: ${product.title}`,
          description: formData.message || `Quick quote request for ${product.title}`,
          quantity: parseInt(formData.quantity),
          quantity_unit: formData.unit,
          category_id: product.category_id,
          target_price: product.price_min || product.price || null,
          delivery_location: formData.destination || null,
          status: 'open',
          buyer_company_id: profile?.company_id,
          created_by: user.id,
          // Mark as quick quote for tracking
          metadata: {
            type: 'quick_quote',
            product_id: product.id,
            product_title: product.title,
            supplier_id: supplier?.id,
            supplier_name: supplier?.company_name
          }
        })
        .select()
        .single();

      if (rfqError) throw rfqError;

      // Send notification to supplier
      if (supplier?.id) {
        await supabase
          .from('notifications')
          .insert({
            recipient_company_id: supplier.id,
            type: 'quick_quote_received',
            title: 'New Quick Quote Request',
            message: `${profile?.full_name || 'A buyer'} requested a quick quote for "${product.title}" (${formData.quantity} ${formData.unit})`,
            data: {
              rfq_id: rfqData.id,
              product_id: product.id,
              quantity: formData.quantity,
              unit: formData.unit
            },
            link: `/dashboard/rfqs/${rfqData.id}`
          });
      }

      toast.success('Quote request sent! The supplier will respond soon.');
      onOpenChange(false);

      // Reset form
      setFormData({
        quantity: product?.min_order_quantity || '',
        unit: product?.moq_unit || product?.unit || 'units',
        destination: '',
        message: ''
      });

    } catch (error) {
      console.error('Quick quote error:', error);
      toast.error('Failed to send quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-afrikoni-chestnut">
            <Zap className="w-5 h-5 text-os-accent" />
            Quick Quote Request
          </DialogTitle>
          <DialogDescription>
            Get a fast quote from the supplier. They'll respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Product Summary */}
          <div className="bg-afrikoni-cream/50 rounded-lg p-3 border border-os-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-os-accent/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-os-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-afrikoni-chestnut text-os-sm line-clamp-2">
                  {product?.title}
                </p>
                <p className="text-os-xs text-afrikoni-deep/70 mt-1">
                  {supplier?.company_name} • {supplier?.country}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-os-sm font-medium text-afrikoni-chestnut">
              Quantity Needed *
            </Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder={`Min: ${product?.min_order_quantity || 1}`}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="flex-1"
                required
              />
              <Input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-24"
                placeholder="units"
              />
            </div>
            {product?.min_order_quantity && (
              <p className="text-os-xs text-afrikoni-deep/60">
                MOQ: {product.min_order_quantity} {product.moq_unit || product.unit || 'units'}
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-os-sm font-medium text-afrikoni-chestnut">
              Delivery Destination
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-deep/50" />
              <Input
                id="destination"
                type="text"
                placeholder="City, Country (e.g., Lagos, Nigeria)"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-os-sm font-medium text-afrikoni-chestnut">
              Additional Details (Optional)
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-afrikoni-deep/50" />
              <textarea
                id="message"
                placeholder="Any specific requirements, timeline, or questions..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full min-h-[80px] pl-10 pr-3 py-2 text-os-sm rounded-md border border-os-accent/30 bg-afrikoni-offwhite focus:outline-none focus:ring-2 focus:ring-os-accent resize-none"
                maxLength={500}
              />
            </div>
            <p className="text-os-xs text-afrikoni-deep/50 text-right">
              {formData.message.length}/500
            </p>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 text-os-xs text-afrikoni-deep/70 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Your request is protected by Afrikoni Trade Shield</span>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-os-accent hover:bg-os-accentDark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
