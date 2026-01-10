import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { toast } from 'sonner';

/**
 * Supplier Quote Templates
 * Helps suppliers write professional, complete quotes that win business
 * Reduces back-and-forth and increases buyer confidence
 */

const QUOTE_TEMPLATES = [
  {
    id: 'bulk-commodities',
    name: 'Bulk Commodities',
    category: 'Agriculture & Raw Materials',
    template: {
      notes: `Dear Buyer,

Thank you for your RFQ. We are pleased to offer the following:

**Product Specifications:**
- Grade: [Specify grade/quality]
- Origin: [Country/region]
- Packaging: [Bag size, container specs]
- Quality standards: [International standards met]

**Pricing & Terms:**
- Unit price: [Price per unit]
- Minimum order quantity: [MOQ]
- Delivery time: [Days/weeks from order confirmation]
- Payment terms: [e.g., 30% advance, 70% on delivery]

**Certifications:**
- [List relevant certifications: Organic, Fair Trade, ISO, etc.]

**Logistics:**
- Incoterms: [FOB/CIF/EXW]
- Port of loading: [Port name]
- Estimated shipping time: [Days]

We have supplied similar orders successfully across Africa and can provide references upon request.

Please let us know if you need any clarifications.

Best regards,
[Your Company Name]`,
      fields: ['grade', 'origin', 'packaging', 'certifications', 'incoterms', 'port']
    }
  },
  {
    id: 'manufactured-goods',
    name: 'Manufactured Goods',
    category: 'Industrial & Equipment',
    template: {
      notes: `Dear Buyer,

We are pleased to quote for your requirement:

**Product Details:**
- Model/Type: [Model number and specifications]
- Technical specs: [Key technical specifications]
- Warranty: [Warranty period and coverage]
- After-sales support: [Support details]

**Pricing:**
- Unit price: [Price per unit]
- Volume discounts: [If applicable]
- Installation/training: [Cost if applicable]

**Delivery:**
- Lead time: [Weeks from order confirmation]
- Incoterms: [CIF/FOB/EXW]
- Packaging: [Export-grade packaging details]

**Quality Assurance:**
- Quality certifications: [ISO, CE, etc.]
- Testing: [Pre-shipment testing offered]
- Inspection: [Third-party inspection welcome]

**Additional Services:**
- Installation support: [Available/Not available]
- Training: [Available/Not available]
- Spare parts: [Availability]

We have successfully delivered to [X] countries and can provide case studies.

Please feel free to contact us for any clarifications.

Best regards,
[Your Company Name]`,
      fields: ['model', 'warranty', 'lead_time', 'certifications', 'after_sales']
    }
  },
  {
    id: 'textiles-apparel',
    name: 'Textiles & Apparel',
    category: 'Fashion & Textiles',
    template: {
      notes: `Dear Buyer,

Thank you for your interest. We are pleased to offer:

**Product Specifications:**
- Material: [Cotton/Polyester/Blend - with percentages]
- Fabric weight: [GSM]
- Colors available: [List colors]
- Sizes available: [Size range]
- Customization: [Logo printing/embroidery options]

**Pricing:**
- Unit price: [Price per piece/kg]
- MOQ: [Minimum order quantity]
- Bulk discounts: [If applicable]
- Sampling: [Sample cost and lead time]

**Production & Delivery:**
- Production time: [Days/weeks]
- Quality control: [Inspection process]
- Packaging: [Packaging details]
- Shipping: [Delivery terms]

**Customization Details:**
- Logo placement: [Options]
- Color matching: [Pantone matching available]
- Label requirements: [Custom labels available]

**Quality Standards:**
- Certifications: [OEKO-TEX, organic, etc.]
- Fabric testing: [Shrinkage, color fastness]

We can provide fabric swatches and samples before bulk production.

Looking forward to working with you.

Best regards,
[Your Company Name]`,
      fields: ['material', 'fabric_weight', 'colors', 'sizes', 'moq', 'customization']
    }
  },
  {
    id: 'general-professional',
    name: 'General Professional Quote',
    category: 'All Categories',
    template: {
      notes: `Dear Buyer,

Thank you for your RFQ. We are pleased to provide the following quotation:

**Product/Service Details:**
[Provide clear description matching the RFQ requirements]

**Specifications:**
[List key specifications that match buyer's requirements]

**Pricing:**
- Unit price: [Amount]
- Quantity: [As requested]
- Total value: [Calculated total]
- Currency: [USD/EUR/Local currency]

**Delivery Terms:**
- Lead time: [Time from order confirmation]
- Incoterms: [FOB/CIF/EXW/DDP]
- Delivery location: [As per RFQ]

**Payment Terms:**
- Payment method: [Escrow via Afrikoni / Other]
- Payment schedule: [e.g., 30% advance, 70% on delivery]

**Quality Assurance:**
- Quality standards: [Relevant certifications or standards]
- Inspection: [Available upon request]

**Company Credentials:**
- Years in business: [X years]
- Export experience: [Countries served]
- References: [Available upon request]

**Validity:**
This quote is valid for [30 days] from the date of issue.

We look forward to serving you and building a long-term business relationship.

Best regards,
[Your Name]
[Your Company Name]
[Contact Information]`,
      fields: ['product_description', 'specifications', 'pricing', 'lead_time', 'payment_terms']
    }
  }
];

export function SupplierQuoteTemplates({ onTemplateSelect, rfqCategory }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyTemplate = (template) => {
    navigator.clipboard.writeText(template.notes);
    setCopiedId(template.id);
    toast.success('Template copied! Paste and customize for your quote.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template.notes);
    }
    toast.success('Template applied! Please customize with your specific details.');
  };

  // Filter templates based on RFQ category if provided
  const relevantTemplates = rfqCategory 
    ? QUOTE_TEMPLATES.filter(t => 
        t.category.toLowerCase().includes(rfqCategory.toLowerCase()) || 
        t.id === 'general-professional'
      )
    : QUOTE_TEMPLATES;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-afrikoni-chestnut text-sm">
                Professional Quote Templates
              </h3>
              <p className="text-xs text-afrikoni-deep/70 mt-0.5">
                Use these templates to write complete, professional quotes that win business
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="h-auto p-1"
          >
            {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {showTemplates && (
          <div className="space-y-3 mt-3">
            <p className="text-xs text-afrikoni-deep/60 italic">
              💡 Complete quotes get 2x more buyer responses. Include all details below.
            </p>

            {relevantTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-afrikoni-gold/20 rounded-lg p-3 bg-white hover:border-afrikoni-gold/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-afrikoni-chestnut text-sm">
                      {template.name}
                    </h4>
                    <p className="text-xs text-afrikoni-deep/60">{template.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyTemplate(template.template)}
                      className="text-xs h-auto py-1 px-2"
                    >
                      {copiedId === template.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template.template)}
                      className="text-xs h-auto py-1 px-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-afrikoni-deep/70 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">
                    {template.template.notes.substring(0, 200)}...
                  </pre>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-medium text-afrikoni-deep/70 mb-1">
                    Key fields to customize:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.template.fields.map((field) => (
                      <span
                        key={field}
                        className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700"
                      >
                        {field.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-3 pt-3 border-t border-amber-200">
              <h4 className="text-xs font-semibold text-afrikoni-chestnut mb-2">
                ✅ Quote Checklist (Include all):
              </h4>
              <ul className="text-xs text-afrikoni-deep/70 space-y-1">
                <li>✓ Clear product specifications matching the RFQ</li>
                <li>✓ Competitive pricing with breakdown</li>
                <li>✓ Realistic delivery timeline</li>
                <li>✓ Payment terms (Afrikoni escrow recommended)</li>
                <li>✓ Quality certifications or standards</li>
                <li>✓ Company credentials and references</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quick tips component for quote form
 */
export function QuoteWritingTips({ className = '' }) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs ${className}`}>
      <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for winning quotes:</h4>
      <ul className="space-y-1 text-blue-800">
        <li>• Be specific: Match all RFQ requirements exactly</li>
        <li>• Be realistic: Don't promise what you can't deliver</li>
        <li>• Be professional: Use complete sentences and proper formatting</li>
        <li>• Show credentials: Mention certifications, past projects, references</li>
        <li>• Offer flexibility: Show willingness to accommodate special requirements</li>
      </ul>
    </div>
  );
}

