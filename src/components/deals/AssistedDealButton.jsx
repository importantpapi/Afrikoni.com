import React, { useState } from 'react';
import { Headphones, Send, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

/**
 * Assisted Deal Button
 * "Need help closing this deal?"
 * 
 * This is how you:
 * - Increase close rate
 * - Learn the market
 * - Justify higher commission (10-15%)
 * - Create case studies
 */

export function AssistedDealButton({ 
  rfqId, 
  orderId, 
  dealValue,
  userCompanyId,
  context = 'rfq', // 'rfq' | 'order' | 'quote'
  variant = 'default' // 'default' | 'prominent'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleRequestAssistance = async () => {
    if (!message.trim()) {
      toast.error('Please describe how we can help');
      return;
    }

    setIsSending(true);
    try {
      // Create assistance request
      const { data, error } = await supabase
        .from('assisted_deal_requests')
        .insert({
          rfq_id: rfqId || null,
          order_id: orderId || null,
          requesting_company_id: userCompanyId,
          deal_value: dealValue || null,
          context,
          message: message.trim(),
          status: 'pending',
          priority: dealValue > 10000 ? 'high' : 'medium',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for admin/founder
      await supabase.from('notifications').insert({
        company_id: null, // System notification
        user_id: null,
        type: 'assisted_deal_request',
        category: 'ALERT',
        title: 'Assisted Deal Request',
        message: `${userCompanyId} requested assistance: ${message.substring(0, 100)}`,
        priority: 'HIGH',
        link: context === 'order' ? `/dashboard/orders/${orderId}` : `/dashboard/rfqs/${rfqId}`,
        context_id: rfqId || orderId
      });

      // Send email to founder (you)
      // TODO: Implement email notification to your email address

      toast.success('Request sent! Our team will reach out within 24 hours.');
      setIsOpen(false);
      setMessage('');
    } catch (error) {
      console.error('Error requesting assistance:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant === 'prominent' ? 'default' : 'outline'}
        className={variant === 'prominent' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
      >
        <Headphones className="w-4 h-4 mr-2" />
        Need Help Closing This Deal?
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-blue-600" />
              Request Afrikoni Assistance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* What We Do */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                How We Help Close Deals:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>✓ Direct supplier vetting and negotiation</li>
                <li>✓ Timeline coordination and follow-up</li>
                <li>✓ Documentation and compliance support</li>
                <li>✓ Payment and logistics coordination</li>
                <li>✓ Risk mitigation and quality assurance</li>
              </ul>
            </div>

            {/* Commission Transparency */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 font-medium">
                    Assisted Deal Commission: 12%
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Higher service fee for hands-on support. Only charged on successful completion.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-afrikoni-chestnut mb-2">
                What do you need help with?
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Example: I need help negotiating better terms with the supplier, coordinating shipment, or ensuring quality standards are met..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-afrikoni-deep/60 mt-1 italic">
                Be specific so we can help faster
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestAssistance}
                disabled={!message.trim() || isSending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-1" />
                {isSending ? 'Sending...' : 'Request Assistance'}
              </Button>
            </div>

            {/* Response Time */}
            <p className="text-xs text-afrikoni-deep/60 text-center">
              Our team typically responds within 24 hours
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact version for cards and listings
 */
export function AssistedDealLink({ rfqId, orderId, dealValue, userCompanyId, context }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
      >
        <Headphones className="w-3.5 h-3.5" />
        Need help?
      </button>

      {isOpen && (
        <AssistedDealButton
          rfqId={rfqId}
          orderId={orderId}
          dealValue={dealValue}
          userCompanyId={userCompanyId}
          context={context}
        />
      )}
    </>
  );
}

/**
 * Migration SQL for assisted_deal_requests table
 */
export const ASSISTED_DEAL_REQUESTS_MIGRATION = `
-- Assisted deal requests table
CREATE TABLE IF NOT EXISTS public.assisted_deal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  requesting_company_id UUID REFERENCES public.companies(id),
  deal_value NUMERIC(15, 2),
  context TEXT CHECK (context IN ('rfq', 'order', 'quote')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'declined')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assisted_deal_requests_status ON public.assisted_deal_requests(status);
CREATE INDEX IF NOT EXISTS idx_assisted_deal_requests_priority ON public.assisted_deal_requests(priority);
CREATE INDEX IF NOT EXISTS idx_assisted_deal_requests_requested_at ON public.assisted_deal_requests(requested_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_assisted_deal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assisted_deal_requests_updated_at
BEFORE UPDATE ON public.assisted_deal_requests
FOR EACH ROW
EXECUTE FUNCTION update_assisted_deal_requests_updated_at();
`;

