import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * RFQ Quality Helper
 * Guides buyers to submit complete, actionable RFQs that get better supplier responses
 * Reduces admin review time and increases match quality
 */

export function RFQQualityHelper({ formData = {}, onTemplateSelect }) {
  const [qualityScore, setQualityScore] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showHelper, setShowHelper] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const { score, issues } = analyzeRFQQuality(formData);
    setQualityScore(score);
    setSuggestions(issues);
  }, [formData]);

  const templates = [
    {
      id: 'bulk-commodities',
      name: 'Bulk Commodities (Food/Raw Materials)',
      example: {
        product: 'Cocoa Beans',
        quantity: '20',
        unit: 'tons',
        specifications: 'Grade A cocoa beans\n- Moisture content: max 7%\n- Bean size: min 1.2g\n- Fermentation: fully fermented\n- Origin: West Africa preferred',
        budget: '3500-4000 USD per ton',
        certifications: ['Organic', 'Fair Trade'],
        incoterms: 'FOB',
        timeline: '30 days'
      }
    },
    {
      id: 'manufactured-goods',
      name: 'Manufactured Goods',
      example: {
        product: 'Industrial Water Pumps',
        quantity: '50',
        unit: 'units',
        specifications: '2HP submersible water pumps\n- Flow rate: 8000 L/h minimum\n- Max head: 80m\n- Power: 220V, 50Hz\n- Materials: Stainless steel housing\n- Warranty: 2 years minimum',
        budget: '200-280 USD per unit',
        certifications: ['CE Certified', 'ISO 9001'],
        incoterms: 'CIF',
        timeline: 'ASAP'
      }
    },
    {
      id: 'textiles-apparel',
      name: 'Textiles & Apparel',
      example: {
        product: 'Corporate Polo Shirts',
        quantity: '500',
        unit: 'pieces',
        specifications: '100% cotton polo shirts with company logo\n- Colors: Navy blue, white\n- Sizes: S, M, L, XL (detailed breakdown available)\n- Logo: Embroidered on left chest (artwork to be provided)\n- Quality: 200GSM fabric minimum',
        budget: '8-12 USD per piece',
        certifications: [],
        incoterms: 'EXW',
        timeline: 'Flexible'
      }
    }
  ];

  return (
    <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-amber-50 to-white">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-afrikoni-gold mt-0.5" />
            <div>
              <h3 className="font-semibold text-afrikoni-chestnut text-sm">
                RFQ Quality Score: {qualityScore}%
              </h3>
              <p className="text-xs text-afrikoni-deep/70 mt-0.5">
                Complete RFQs get 3x more supplier responses
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelper(!showHelper)}
            className="h-auto p-1"
          >
            {showHelper ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Quality Suggestions */}
        {showHelper && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-afrikoni-deep">Suggestions to improve your RFQ:</p>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-afrikoni-deep/80">{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Good Score Confirmation */}
        {showHelper && qualityScore >= 80 && (
          <div className="flex items-start gap-2 text-xs bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Great RFQ!</p>
              <p className="text-green-700 mt-0.5">
                This request has all the details suppliers need to provide accurate quotes.
              </p>
            </div>
          </div>
        )}

        {/* Templates */}
        {showHelper && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full text-xs h-auto py-2"
            >
              {showTemplates ? 'Hide' : 'Show'} RFQ Templates
            </Button>

            {showTemplates && (
              <div className="mt-3 space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onTemplateSelect && onTemplateSelect(template.example)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white border border-afrikoni-gold/20 hover:border-afrikoni-gold hover:bg-afrikoni-gold/5 transition-colors"
                  >
                    <p className="text-xs font-medium text-afrikoni-chestnut">{template.name}</p>
                    <p className="text-xs text-afrikoni-deep/60 mt-0.5">
                      Click to use this template
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Analyze RFQ quality and provide actionable feedback
 * Returns score (0-100) and list of improvement suggestions
 */
function analyzeRFQQuality(formData) {
  const issues = [];
  let score = 20; // Start at 20 for having initiated the form

  // Product name
  if (!formData.product_name || formData.product_name.trim().length < 3) {
    issues.push('Add a clear product name (e.g., "Cocoa Beans" not "beans")');
  } else {
    score += 15;
  }

  // Quantity
  if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
    issues.push('Specify the quantity you need');
  } else {
    score += 10;
  }

  // Unit
  if (!formData.unit || formData.unit.trim().length === 0) {
    issues.push('Add unit (e.g., tons, pieces, kg)');
  } else {
    score += 5;
  }

  // Specifications (most important for quality matching)
  if (!formData.specifications || formData.specifications.trim().length < 20) {
    issues.push('Add detailed specifications - quality, size, standards, etc. (this is critical for accurate quotes)');
  } else if (formData.specifications.trim().length < 50) {
    issues.push('Add more specification details for better supplier matching');
    score += 10;
  } else {
    score += 20;
  }

  // Budget range
  if (!formData.budget_min && !formData.budget_max && !formData.target_budget) {
    issues.push('Include a budget range to get more realistic quotes');
  } else {
    score += 10;
  }

  // Delivery location
  if (!formData.delivery_country || formData.delivery_country === '') {
    issues.push('Specify delivery destination');
  } else {
    score += 10;
  }

  // Timeline
  if (!formData.timeline || formData.timeline === '') {
    issues.push('Indicate when you need delivery (ASAP, 30 days, flexible)');
  } else {
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    issues
  };
}

