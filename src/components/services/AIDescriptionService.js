// AI Description Service - Converted from Base44 to use direct API calls
// Replace with your preferred LLM service (OpenAI, Anthropic, etc.)
import { callChatAsJson } from '@/ai/aiClient';

export const AIDescriptionService = {
  // Detect category from product title and description
  detectCategory: async (title, description = '') => {
    try {
      // Use AI to detect category from product information
      const system = `You are a category detection assistant for Afrikoni B2B marketplace.
Given a product title and description, determine the most appropriate B2B product category.
Respond with a JSON object containing:
{
  "category": "string - the category name (e.g., 'Agricultural Products', 'Textiles', 'Food & Beverages', 'Raw Materials', 'Handicrafts', 'Electronics', 'Machinery', 'Chemicals', 'Metals & Minerals', 'Packaging', 'Beauty & Personal Care', 'Home & Garden', 'Sports & Recreation', 'Automotive', 'Construction Materials')",
  "confidence": "number between 0 and 1",
  "alternative_categories": ["string array of alternative category names"]
}`;

      const user = `Product Title: ${title}
Description: ${description || 'No description provided'}

Determine the best B2B category for this product.`;

      const { success, data } = await callChatAsJson(
        { system, user },
        { 
          fallback: { 
            category: 'General Products', 
            confidence: 0.5, 
            alternative_categories: [] 
          }
        }
      );

      if (success && data) {
        return {
          category: data.category || 'General Products',
          confidence: data.confidence || 0.5,
          alternatives: data.alternative_categories || []
        };
      }

      // Fallback: Simple keyword matching
      const titleLower = (title || '').toLowerCase();
      const descLower = (description || '').toLowerCase();
      const combined = `${titleLower} ${descLower}`;

      if (combined.match(/\b(cocoa|cacao|coffee|tea|spices|herbs|grains|rice|wheat|maize|corn|beans|nuts|seeds|fruits|vegetables|agricultural|farming|crop)\b/)) {
        return { category: 'Agricultural Products', confidence: 0.8, alternatives: ['Food & Beverages'] };
      }
      if (combined.match(/\b(textile|fabric|cloth|garment|apparel|clothing|woven|yarn|cotton|silk|leather)\b/)) {
        return { category: 'Textiles', confidence: 0.8, alternatives: ['Fashion & Apparel'] };
      }
      if (combined.match(/\b(food|beverage|drink|snack|ingredient|organic|processed)\b/)) {
        return { category: 'Food & Beverages', confidence: 0.8, alternatives: ['Agricultural Products'] };
      }
      if (combined.match(/\b(handicraft|artisan|handmade|traditional|art|sculpture|pottery|basket|woodwork)\b/)) {
        return { category: 'Handicrafts', confidence: 0.8, alternatives: ['Home & Garden'] };
      }
      if (combined.match(/\b(mineral|metal|ore|gold|diamond|copper|iron|steel|aluminum|mining)\b/)) {
        return { category: 'Metals & Minerals', confidence: 0.8, alternatives: ['Raw Materials'] };
      }
      if (combined.match(/\b(machine|equipment|tool|industrial|manufacturing|automation)\b/)) {
        return { category: 'Machinery', confidence: 0.8, alternatives: ['Industrial Equipment'] };
      }

      return { category: 'General Products', confidence: 0.5, alternatives: [] };
    } catch (error) {
      console.error('Category detection error:', error);
      return { category: 'General Products', confidence: 0.3, alternatives: [] };
    }
  },

  generateProductDescription: async (productInfo) => {
    try {
      const system = `You are an Afrikoni B2B listing writer for cross-border African trade.
Return JSON with:
{
  "optimized_title": "string",
  "full_description": "string",
  "selling_points": ["string", "string", "string", "string"]
}
Rules:
- Keep language simple and trust-oriented.
- Mention quality, lead time clarity, and trade reliability.
- Do not invent certifications.`;

      const user = `Create a B2B product listing.
Title: ${productInfo.title || 'Product'}
Category: ${productInfo.category || 'General Products'}
Country: ${productInfo.country || 'Africa'}
Description context: ${productInfo.description || ''}`;

      const fallback = {
        optimized_title: productInfo.title,
        full_description: `Reliable ${productInfo.title || 'product'} supply from ${productInfo.country || 'Africa'} with clear specs and delivery timelines for B2B buyers.`,
        selling_points: [
          'Quality checks before shipment',
          'Clear lead-time commitments',
          'Transparent pricing terms',
          'Bulk order support'
        ]
      };

      const { success, data } = await callChatAsJson({ system, user }, { fallback });
      if (!success || !data) return fallback;

      return {
        optimized_title: data.optimized_title || fallback.optimized_title,
        full_description: data.full_description || fallback.full_description,
        selling_points: Array.isArray(data.selling_points) && data.selling_points.length > 0
          ? data.selling_points.slice(0, 4)
          : fallback.selling_points
      };
    } catch (error) {
      // Error logged (removed for production)
      throw error;
    }
  },

  generateRFQFromBrief: async (brief) => {
    try {
      const qty = brief.quantity || '';
      const unit = brief.unit || 'pieces';
      const country = brief.target_country || brief.delivery_location?.split(',').pop()?.trim() || '';

      const fallback = {
        title: brief.title || `Request for ${qty ? `${qty} ${unit}` : 'quotation'}`,
        description:
          brief.description ||
          `We are sourcing reliable supply with clear quality specs and delivery timeline${country ? ` to ${country}` : ''}. Include price, lead time, and available certifications.`,
        quantity: qty || '',
        unit,
        delivery_location: brief.delivery_location || '',
        target_country: country || ''
      };

      const system = `You structure buyer briefs into clear B2B RFQs for African cross-border trade.
Return JSON:
{
  "title": "string",
  "description": "string",
  "quantity": "string|number",
  "unit": "string",
  "delivery_location": "string",
  "target_country": "string"
}
Rules:
- Keep language simple and operational.
- Do not invent product certifications or legal guarantees.
- Keep title under 90 characters.`;

      const user = `Convert this buyer brief into RFQ JSON:
title: ${brief.title || ''}
description: ${brief.description || ''}
quantity: ${brief.quantity || ''}
unit: ${brief.unit || ''}
delivery_location: ${brief.delivery_location || ''}
target_country: ${brief.target_country || ''}`;

      const { success, data } = await callChatAsJson(
        { system, user, temperature: 0.2 },
        { fallback }
      );

      if (!success || !data) return fallback;

      return {
        title: data.title || fallback.title,
        description: data.description || fallback.description,
        quantity: data.quantity ?? fallback.quantity,
        unit: data.unit || fallback.unit,
        delivery_location: data.delivery_location || fallback.delivery_location,
        target_country: data.target_country || fallback.target_country,
      };
    } catch (error) {
      return {
        title: brief.title || 'Request for quotation',
        description: brief.description || 'Please share your best quote including lead time and quality details.',
        quantity: brief.quantity || '',
        unit: brief.unit || 'pieces',
        delivery_location: brief.delivery_location || '',
        target_country: brief.target_country || ''
      };
    }
  },

  generateMessageSuggestions: async ({ role, context }) => {
    try {
      // Simple rule-based suggestions for now; swap with LLM later.
      const suggestions = [];

      if (role === 'buyer') {
        suggestions.push(
          'Hello, I am interested in this product. Could you please confirm the minimum order quantity, unit price, and available shipping options to my country?',
          'Can you share more details on quality standards, certifications, and typical lead time for this product?',
          'If I order a larger quantity, is there a discount? Please share your best price for different volume tiers.'
        );
      } else {
        suggestions.push(
          'Thank you for your interest. Please let me know your target quantity, destination country, and preferred delivery date so I can send an accurate quote.',
          'We can provide this product with consistent quality. I will share price, MOQ, and lead time below. Please tell me if you have special packaging or labelling requirements.',
          'For smoother trade, we can use Afrikoni Trade Shield for protected payment and logistics support. Are you open to this flow?'
        );
      }

      if (context?.type === 'rfq') {
        suggestions.unshift(
          'I saw your RFQ on Afrikoni. I would like to submit a quote and can meet your quantity and quality requirements. May I confirm the delivery address and preferred Incoterms?'
        );
      }

      return suggestions;
    } catch (error) {
      throw error;
    }
  },
};
