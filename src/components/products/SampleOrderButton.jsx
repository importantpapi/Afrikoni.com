/**
 * Sample Order Button & Modal
 *
 * Allows buyers to request product samples before committing
 * to bulk orders. Critical for B2B trust-building.
 *
 * Sample orders are tracked separately and linked to the product
 * for supplier response time metrics.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Loader2, MapPin, Package, CreditCard, Shield, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export function SampleOrderButton({ product, supplier, variant = 'outline', size = 'default', className = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`touch-manipulation ${className}`}
      >
        <FlaskConical className="w-4 h-4 mr-2" />
        Request Sample
      </Button>

      <SampleOrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={product}
        supplier={supplier}
      />
    </>
  );
}

export function SampleOrderModal({ open, onOpenChange, product, supplier }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    shippingAddress: {
      name: profile?.full_name || '',
      company: '',
      address: '',
      city: '',
      country: '',
      phone: ''
    },
    notes: ''
  });

  // Estimate sample cost (typically suppliers charge for samples)
  const estimatedSampleCost = product?.price_min || product?.price || 0;
  const estimatedShipping = 25; // Default estimate for cross-border

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      const returnUrl = `/product?id=${product.id}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}&intent=sample_order`);
      return;
    }

    // Validate address
    if (!formData.shippingAddress.address || !formData.shippingAddress.city || !formData.shippingAddress.country) {
      toast.error('Please fill in your shipping address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create sample order record
      // Note: This uses the orders table with a 'sample' type marker
      // A dedicated sample_orders table could be created for more features
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          buyer_company_id: profile?.company_id,
          seller_company_id: supplier?.id,
          quantity: formData.quantity,
          unit_price: estimatedSampleCost,
          total_amount: estimatedSampleCost * formData.quantity,
          status: 'pending',
          order_type: 'sample',
          shipping_address: formData.shippingAddress,
          notes: formData.notes,
          metadata: {
            is_sample_order: true,
            product_title: product.title,
            supplier_name: supplier?.company_name,
            estimated_shipping: estimatedShipping
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Notify supplier
      if (supplier?.id) {
        await supabase
          .from('notifications')
          .insert({
            recipient_company_id: supplier.id,
            type: 'sample_order_received',
            title: 'New Sample Request',
            message: `${profile?.full_name || 'A buyer'} requested a sample of "${product.title}" to be shipped to ${formData.shippingAddress.city}, ${formData.shippingAddress.country}`,
            data: {
              order_id: orderData.id,
              product_id: product.id,
              quantity: formData.quantity,
              destination: `${formData.shippingAddress.city}, ${formData.shippingAddress.country}`
            },
            link: `/dashboard/orders/${orderData.id}`
          });
      }

      toast.success('Sample request sent! The supplier will contact you with shipping details.');
      onOpenChange(false);

      // Navigate to order tracking
      navigate(`/dashboard/orders?highlight=${orderData.id}`);

    } catch (error) {
      console.error('Sample order error:', error);
      toast.error('Failed to submit sample request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAddress = (field, value) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-afrikoni-chestnut">
            <FlaskConical className="w-5 h-5 text-afrikoni-gold" />
            Request Product Sample
          </DialogTitle>
          <DialogDescription>
            Test product quality before bulk ordering. Supplier will confirm pricing and shipping.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Product Info */}
          <div className="bg-afrikoni-cream/50 rounded-lg p-3 border border-afrikoni-gold/20">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-afrikoni-gold/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-afrikoni-chestnut text-sm line-clamp-2">
                  {product?.title}
                </p>
                <p className="text-xs text-afrikoni-deep/70 mt-1">
                  {supplier?.company_name} • {supplier?.country}
                </p>
                <Badge variant="outline" className="mt-2 text-xs bg-amber-50 text-amber-700 border-amber-300">
                  <FlaskConical className="w-3 h-3 mr-1" />
                  Sample Order
                </Badge>
              </div>
            </div>
          </div>

          {/* Sample Quantity */}
          <div className="space-y-2">
            <Label htmlFor="sample-qty" className="text-sm font-medium text-afrikoni-chestnut">
              Sample Quantity
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="sample-qty"
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-24"
              />
              <span className="text-sm text-afrikoni-deep/70">
                {product?.moq_unit || product?.unit || 'units'}
              </span>
              <span className="text-xs text-afrikoni-deep/50 ml-auto">
                (Usually 1-3 for samples)
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-afrikoni-chestnut flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shipping Address
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Contact Name *"
                value={formData.shippingAddress.name}
                onChange={(e) => updateAddress('name', e.target.value)}
                required
              />
              <Input
                placeholder="Company Name"
                value={formData.shippingAddress.company}
                onChange={(e) => updateAddress('company', e.target.value)}
              />
            </div>

            <Input
              placeholder="Street Address *"
              value={formData.shippingAddress.address}
              onChange={(e) => updateAddress('address', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City *"
                value={formData.shippingAddress.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                required
              />
              <Input
                placeholder="Country *"
                value={formData.shippingAddress.country}
                onChange={(e) => updateAddress('country', e.target.value)}
                required
              />
            </div>

            <Input
              placeholder="Phone Number (for courier)"
              value={formData.shippingAddress.phone}
              onChange={(e) => updateAddress('phone', e.target.value)}
              type="tel"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="sample-notes" className="text-sm font-medium text-afrikoni-chestnut">
              Special Instructions (Optional)
            </Label>
            <textarea
              id="sample-notes"
              placeholder="Any specific requirements for the sample (color, size, etc.)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-afrikoni-gold/30 bg-afrikoni-offwhite focus:outline-none focus:ring-2 focus:ring-afrikoni-gold resize-none"
              maxLength={300}
            />
          </div>

          {/* Cost Estimate */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
              <CreditCard className="w-4 h-4" />
              Estimated Costs
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Sample ({formData.quantity}x)</span>
                <span>${(estimatedSampleCost * formData.quantity).toFixed(2)} (est.)</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${estimatedShipping}+ (est.)</span>
              </div>
              <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-semibold">
                <span>Total Estimate</span>
                <span>${(estimatedSampleCost * formData.quantity + estimatedShipping).toFixed(2)}+</span>
              </div>
            </div>
            <p className="text-[10px] text-blue-600 flex items-start gap-1 mt-2">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Final pricing confirmed by supplier. Shipping varies by destination.
            </p>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 text-xs text-afrikoni-deep/70 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Sample orders are protected by Afrikoni Trade Shield</span>
          </div>

          {/* Actions */}
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
              className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Request Sample
                </>
              )}
            </Button>
          </div>
        </form>

        <DialogClose onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default SampleOrderButton;
