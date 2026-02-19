/**
 * RFQ Creation & Publishing Panel
 * State: DRAFT → RFQ_CREATED
 * 
 * Buyer creates an RFQ, fills in details, and publishes to find suppliers.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function RFQCreationPanel({ trade, onNextStep, isTransitioning, capabilities }) {
  const [formData, setFormData] = useState({
    title: trade?.title || '',
    description: trade?.description || '',
    quantity: trade?.quantity || '',
    quantity_unit: trade?.quantity_unit || 'pieces',
    target_price: trade?.target_price || ''
  });

  const [errors, setErrors] = useState({});

  const isPublished = trade?.status === TRADE_STATE.RFQ_CREATED;

  function validate() {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Title required';
    if (!formData.description?.trim()) newErrors.description = 'Description required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePublish() {
    if (!validate()) return;

    try {
      const { data: limitData, error: limitError } = await supabase.functions.invoke('evaluate-rfq-rate');

      if (limitError || (limitData && !limitData.allowed)) {
        toast.error('Verification Limit Reached', {
          description: limitData?.message || 'Institutional rate limits apply to RFQ creation. Please contact support to increase your capacity.'
        });
        return;
      }

      await onNextStep(TRADE_STATE.RFQ_CREATED, {
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        quantity_unit: formData.quantity_unit,
        target_price: formData.target_price
      });
    } catch (err) {
      toast.error('Publishing failed', { description: err.message });
    }
  }

  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-os-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-os-2xl font-semibold">
            {isPublished ? 'RFQ Published' : 'Create RFQ'}
          </h2>
          <p className="text-os-sm mt-1">
            {isPublished
              ? 'Your RFQ is live. Suppliers will send quotes below.'
              : 'Fill in product details and publish to find suppliers.'}
          </p>
        </div>

        {!isPublished ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Premium Grade A Cocoa Beans"
                className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-os-xs mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the product in detail..."
                rows={4}
                className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-os-xs mt-1">{errors.description}</p>}
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.quantity ? 'border-red-500' : ''}`}
                />
                {errors.quantity && <p className="text-os-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <Label htmlFor="unit" className="">Unit</Label>
                <select
                  value={formData.quantity_unit}
                  onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>pieces</option>
                  <option>kg</option>
                  <option>tons</option>
                  <option>liters</option>
                  <option>containers</option>
                </select>
              </div>
            </div>

            {/* Target Price (Optional) */}
            <div>
              <Label htmlFor="target_price" className="">Target Price (Optional)</Label>
              <Input
                id="target_price"
                type="number"
                value={formData.target_price}
                onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                placeholder="Leave blank to see all offers"
                className="placeholder:text-white/40"
              />
            </div>

            {/* Publish Button */}
            {!capabilities?.can_buy && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-os-sm flex items-center gap-3 mt-4">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-os-xs text-amber-200">Buyer capabilities required to publish RFQs.</p>
              </div>
            )}
            <Button
              onClick={handlePublish}
              disabled={isTransitioning || !capabilities?.can_buy}
              className="w-full hover:bg-os-accent/90 font-semibold mt-6"
            >
              {isTransitioning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Publish RFQ</>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-os-md mb-4 border">
              <span className="text-os-2xl">✓</span>
            </div>
            <p className="">
              RFQ published on {new Date(trade?.published_at).toLocaleDateString()}
            </p>
            <p className="text-os-xs mt-2">
              Waiting for supplier quotes...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
