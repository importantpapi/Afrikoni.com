/**
 * Quote Submission Form
 * Allows sellers/suppliers to submit a quote on an open RFQ.
 *
 * Props:
 *   - rfq: { id, title, quantity, quantity_unit, target_price, target_price_currency }
 *   - onQuoteSubmitted: callback fired after successful submission
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { toast } from 'sonner';
import { Loader2, Send, DollarSign, Lock } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { submitQuote } from '@/services/quoteService';
import SuccessScreen from '@/components/shared/ui/SuccessScreen';
import { MessageSquare, ShieldCheck, Cpu } from 'lucide-react';

const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'ZAR', 'EUR', 'GBP'];
const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'];
const PAYMENT_TERMS = ['Advance Payment', 'Net 15', 'Net 30', 'Net 60', 'LC at Sight', 'Escrow'];

export default function QuoteSubmissionForm({ rfq, onQuoteSubmitted }) {
  const { profileCompanyId, userId } = useDashboardKernel();

  const [unitPrice, setUnitPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [currency, setCurrency] = useState(rfq?.target_price_currency || 'USD');
  const [leadTime, setLeadTime] = useState('');
  const [deliveryIncoterms, setDeliveryIncoterms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleUnitPriceChange(value) {
    setUnitPrice(value);
    const parsed = parseFloat(value);
    const quantity = parseFloat(rfq?.quantity || 0);

    if (!Number.isNaN(parsed) && quantity > 0) {
      setTotalPrice((parsed * quantity).toFixed(2));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!unitPrice || !totalPrice || !leadTime || !deliveryIncoterms || !paymentTerms) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (parseFloat(unitPrice) <= 0 || parseFloat(totalPrice) <= 0) {
      toast.error('Prices must be greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitQuote({
        rfqId: rfq.id,
        supplierId: userId,
        supplierCompanyId: profileCompanyId,
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        currency,
        leadTime: parseInt(leadTime, 10),
        deliveryIncoterms,
        deliveryLocation: deliveryLocation || undefined,
        moq: minimumOrderQuantity ? parseInt(minimumOrderQuantity, 10) : undefined,
        paymentTerms,
        notes,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to submit quote.');
        return;
      }

      setSubmitted(true);
      onQuoteSubmitted?.();
    } catch (err) {
      console.error('[QuoteSubmissionForm] Submit error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border border-white/10 bg-white/5 rounded-os-md overflow-hidden">
        <SuccessScreen
          title="Institutional Offer Lodged"
          message={`Your sourcing capacity of ${rfq.quantity} ${rfq.quantity_unit} for ${rfq.title} has been committed to the Trade Rail.`}
          theme="blue"
          icon={ShieldCheck}
          nextSteps={[
            { label: "Institutional verification of terms by Afrikoni Officers", icon: <Lock className="w-4 h-4" /> },
            { label: "Direct negotiation channel initialized", icon: <MessageSquare className="w-4 h-4" /> },
            { label: "Trade Rail promotion pending buyer acceptance", icon: <Cpu className="w-4 h-4" /> }
          ]}
          primaryAction={() => window.location.href = '/dashboard/rfqs?view=sent'}
          primaryActionLabel="View Active Rails"
        />
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-white/5 rounded-os-md">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-os-2xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Submit Quote
          </h2>
          {rfq?.title && (
            <p className="text-os-sm mt-1">
              RFQ: <span className="font-medium">{rfq.title}</span>
              {rfq.quantity && rfq.quantity_unit && (
                <span className="ml-2">
                  — {rfq.quantity} {rfq.quantity_unit}
                </span>
              )}
              {rfq.target_price != null && (
                <span className="ml-2">
                  (Target: {rfq.target_price_currency || 'USD'}{' '}
                  {rfq.target_price.toLocaleString()})
                </span>
              )}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">
                Unit Price <span className="text-red-400">*</span>
              </Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">
                Total Price <span className="text-red-400">*</span>
              </Label>
              <Input
                id="totalPrice"
                name="totalPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto-calculated"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-red-400">*</span>
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terms Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadTime">
                Lead Time (days) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="leadTime"
                name="leadTime"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 14"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incoterms">
                Incoterms <span className="text-red-400">*</span>
              </Label>
              <Select value={deliveryIncoterms} onValueChange={setDeliveryIncoterms}>
                <SelectTrigger id="incoterms">
                  <SelectValue placeholder="Select incoterms" />
                </SelectTrigger>
                <SelectContent>
                  {INCOTERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">
                Payment Terms <span className="text-red-400">*</span>
              </Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger id="paymentTerms">
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Delivery Location</Label>
              <Input
                id="deliveryLocation"
                name="deliveryLocation"
                type="text"
                placeholder="e.g. Lagos, Nigeria"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity (MOQ)</Label>
              <Input
                id="minimumOrderQuantity"
                name="minimumOrderQuantity"
                type="number"
                min="1"
                step="1"
                placeholder="Optional"
                value={minimumOrderQuantity}
                onChange={(e) => setMinimumOrderQuantity(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional details, certifications, special conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full hover:bg-os-accent/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Quote...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Quote
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
