/**
 * RFQ Creation & Publishing Panel
 * State: DRAFT → RFQ_OPEN
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

export default function RFQCreationPanel({ trade, onNextStep, isTransitioning }) {
  const [formData, setFormData] = useState({
    title: trade?.title || '',
    description: trade?.description || '',
    quantity: trade?.quantity || '',
    quantity_unit: trade?.quantity_unit || 'pieces',
    target_price: trade?.target_price || ''
  });

  const [errors, setErrors] = useState({});

  const isPublished = trade?.status === 'rfq_open';

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

    await onNextStep(TRADE_STATE.RFQ_OPEN, {
      title: formData.title,
      description: formData.description,
      quantity: formData.quantity,
      quantity_unit: formData.quantity_unit,
      target_price: formData.target_price
    });
  }

  return (
    <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
            {isPublished ? 'RFQ Published' : 'Create RFQ'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isPublished
              ? 'Your RFQ is live. Suppliers will send quotes below.'
              : 'Fill in product details and publish to find suppliers.'}
          </p>
        </div>

        {!isPublished ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Premium Grade A Cocoa Beans"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the product in detail..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="100"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <select
                  value={formData.quantity_unit}
                  onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
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
              <Label htmlFor="target_price">Target Price (Optional)</Label>
              <Input
                id="target_price"
                type="number"
                value={formData.target_price}
                onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                placeholder="Leave blank to see all offers"
              />
            </div>

            {/* Publish Button */}
            <Button
              onClick={handlePublish}
              disabled={isTransitioning}
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold mt-6"
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              RFQ published on {new Date(trade?.published_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Waiting for supplier quotes...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
