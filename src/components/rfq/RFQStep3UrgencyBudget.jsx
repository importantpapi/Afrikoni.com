/**
 * RFQ Step 3: Urgency & Budget
 * 
 * Mobile-first optional inputs:
 * - Urgency level (chips)
 * - Budget range (optional)
 * - Delivery deadline (optional)
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible', description: 'No rush' },
  { value: 'normal', label: 'Normal', description: 'Standard timeline' },
  { value: 'urgent', label: 'Urgent', description: 'Within 30 days' },
  { value: 'very_urgent', label: 'Very Urgent', description: 'Within 2 weeks' },
];

const BUDGET_RANGES = [
  { label: 'Under $1K', min: 0, max: 1000 },
  { label: '$1K - $10K', min: 1000, max: 10000 },
  { label: '$10K - $50K', min: 10000, max: 50000 },
  { label: '$50K - $100K', min: 50000, max: 100000 },
  { label: '$100K+', min: 100000, max: null },
  { label: 'Custom', min: null, max: null, custom: true },
];

export default function RFQStep3UrgencyBudget({ formData, updateFormData }) {
  const [showCustomBudget, setShowCustomBudget] = useState(false);
  const [customBudget, setCustomBudget] = useState(formData.target_price || '');

  const handleUrgencyChange = (urgency) => {
    updateFormData({ urgency });
  };

  const handleBudgetRangeSelect = (range) => {
    if (range.custom) {
      setShowCustomBudget(true);
      return;
    }
    setShowCustomBudget(false);
    updateFormData({ target_price: range.max ? `${range.max}` : '' });
  };

  const handleCustomBudgetChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomBudget(value);
    updateFormData({ target_price: value });
  };

  const handleDeadlineChange = (date) => {
    updateFormData({ delivery_deadline: date });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
          Urgency & Budget
        </h1>
        <p className="text-afrikoni-deep/70 text-base">
          Help suppliers understand your timeline and budget (optional)
        </p>
      </div>

      {/* Urgency Level */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-3 block flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Urgency Level
        </Label>
        <div className="space-y-2">
          {URGENCY_OPTIONS.map((option) => (
            <div
              key={option.value}
              onClick={() => handleUrgencyChange(option.value)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[60px] flex items-center justify-between ${
                formData.urgency === option.value
                  ? 'border-afrikoni-gold bg-afrikoni-gold/10'
                  : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
              }`}
            >
              <div>
                <div className="font-semibold text-afrikoni-chestnut">
                  {option.label}
                </div>
                <div className="text-sm text-afrikoni-deep/60">
                  {option.description}
                </div>
              </div>
              {formData.urgency === option.value && (
                <div className="w-5 h-5 rounded-full bg-afrikoni-gold flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-3 block flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Budget Range (Optional)
        </Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {BUDGET_RANGES.map((range, idx) => (
            <Badge
              key={idx}
              variant={showCustomBudget && range.custom ? 'default' : 'outline'}
              className={`min-h-[44px] px-4 py-2 cursor-pointer transition-all ${
                !showCustomBudget && formData.target_price && 
                parseFloat(formData.target_price) >= (range.min || 0) &&
                (!range.max || parseFloat(formData.target_price) <= range.max)
                  ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                  : 'border-afrikoni-gold/40 hover:bg-afrikoni-gold/10'
              }`}
              onClick={() => handleBudgetRangeSelect(range)}
            >
              {range.label}
            </Badge>
          ))}
        </div>
        
        {showCustomBudget && (
          <Input
            type="text"
            inputMode="numeric"
            value={customBudget}
            onChange={handleCustomBudgetChange}
            placeholder="Enter amount (e.g., 5000)"
            className="text-base min-h-[52px] px-4"
          />
        )}
      </div>

      {/* Delivery Deadline (Optional) */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-2 block">
          Delivery Deadline (Optional)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full min-h-[52px] justify-start text-left font-normal border-afrikoni-gold/40"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.delivery_deadline ? (
                format(formData.delivery_deadline, 'PPP')
              ) : (
                <span className="text-afrikoni-deep/50">Select a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.delivery_deadline}
              onSelect={handleDeadlineChange}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

