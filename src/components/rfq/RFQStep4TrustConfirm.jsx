/**
 * RFQ Step 4: Trust & Confirm
 * 
 * Final step showing:
 * - Trust badges and protection info
 * - RFQ summary
 * - Send RFQ button (sticky CTA)
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Star, MapPin, Package, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function RFQStep4TrustConfirm({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
          Review & Send
        </h1>
        <p className="text-afrikoni-deep/70 text-base">
          Review your RFQ and send it to verified suppliers
        </p>
      </div>

      {/* Trust & Protection Info */}
      <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-cream/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-afrikoni-gold flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                Protected by Afrikoni
              </h3>
              <p className="text-sm text-afrikoni-deep/70">
                Your RFQ will only be shared with verified suppliers. All communications and deals are protected.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-afrikoni-deep">Verified suppliers only</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-afrikoni-deep">Secure messaging</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-afrikoni-deep">Payment protection available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFQ Summary */}
      <Card className="border-afrikoni-gold/20">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-afrikoni-chestnut mb-3">Your RFQ Summary</h3>
          
          {/* Product/Service */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide">
              What you need
            </div>
            <div className="text-base font-medium text-afrikoni-chestnut">
              {formData.title || 'Not specified'}
            </div>
            {formData.description && (
              <div className="text-sm text-afrikoni-deep/70 mt-1">
                {formData.description}
              </div>
            )}
          </div>

          {/* Quantity & Unit */}
          {(formData.quantity || formData.unit) && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide flex items-center gap-1">
                <Package className="w-3 h-3" />
                Quantity
              </div>
              <div className="text-base font-medium text-afrikoni-chestnut">
                {formData.quantity} {formData.unit || 'units'}
              </div>
            </div>
          )}

          {/* Destination */}
          {formData.delivery_location && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Destination
              </div>
              <div className="text-base font-medium text-afrikoni-chestnut">
                {formData.delivery_location}
              </div>
            </div>
          )}

          {/* Urgency */}
          {formData.urgency && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Urgency
              </div>
              <Badge variant="outline" className="border-afrikoni-gold/40">
                {formData.urgency === 'flexible' ? 'Flexible' :
                 formData.urgency === 'normal' ? 'Normal' :
                 formData.urgency === 'urgent' ? 'Urgent' :
                 'Very Urgent'}
              </Badge>
            </div>
          )}

          {/* Budget */}
          {formData.target_price && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Budget
              </div>
              <div className="text-base font-medium text-afrikoni-chestnut">
                ${parseFloat(formData.target_price).toLocaleString()}
              </div>
            </div>
          )}

          {/* Deadline */}
          {formData.delivery_deadline && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Deadline
              </div>
              <div className="text-base font-medium text-afrikoni-chestnut">
                {format(formData.delivery_deadline, 'PPP')}
              </div>
            </div>
          )}

          {/* Attachments */}
          {formData.attachments && formData.attachments.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-afrikoni-deep/60 uppercase tracking-wide">
                Photos
              </div>
              <div className="text-sm text-afrikoni-deep/70">
                {formData.attachments.length} photo(s) attached
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
          <div>
            <div className="font-semibold text-afrikoni-chestnut text-sm">
              Verified Suppliers Only
            </div>
            <div className="text-xs text-afrikoni-deep/60">
              Only show to verified suppliers
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.verified_only ?? true}
            onChange={(e) => updateFormData({ verified_only: e.target.checked })}
            className="w-5 h-5 rounded border-afrikoni-gold/40 text-afrikoni-gold focus:ring-afrikoni-gold"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
          <div>
            <div className="font-semibold text-afrikoni-chestnut text-sm">
              Afrikoni Managed
            </div>
            <div className="text-xs text-afrikoni-deep/60">
              Let Afrikoni help match you with suppliers
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.afrikoni_managed ?? true}
            onChange={(e) => updateFormData({ afrikoni_managed: e.target.checked })}
            className="w-5 h-5 rounded border-afrikoni-gold/40 text-afrikoni-gold focus:ring-afrikoni-gold"
          />
        </div>
      </div>
    </div>
  );
}

