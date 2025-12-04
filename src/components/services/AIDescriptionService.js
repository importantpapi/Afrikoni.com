// AI Description Service - Converted from Base44 to use direct API calls
// Replace with your preferred LLM service (OpenAI, Anthropic, etc.)

export const AIDescriptionService = {
  // Detect category from product title and description
  detectCategory: async (title, description = '') => {
    try {
      // Use AI to detect category from product information
      const { callChatAsJson } = await import('@/ai/aiClient');
      
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
      // TODO: Replace with your LLM API call
      // Example with OpenAI:
      /*
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'You are a professional B2B product description writer for African markets.'
          }, {
            role: 'user',
            content: `Generate a professional B2B product description for: ${productInfo.title} in category ${productInfo.category} from ${productInfo.country}`
          }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
      */

      // Placeholder response for now
      return {
        optimized_title: productInfo.title,
        full_description: `High-quality ${productInfo.title} from ${productInfo.country || 'Africa'}. Perfect for B2B buyers looking for reliable suppliers.`,
        selling_points: [
          'Premium quality',
          'Competitive pricing',
          'Fast delivery',
          'Bulk discounts available'
        ]
      };
    } catch (error) {
      // Error logged (removed for production)
      throw error;
    }
  },

  generateRFQFromBrief: async (brief) => {
    try {
      // TODO: Replace with your LLM API call for RFQ structuring.
      // For now, return a simple, Africa-focused placeholder.
      const qty = brief.quantity || '';
      const unit = brief.unit || 'pieces';
      const country = brief.target_country || brief.delivery_location?.split(',').pop()?.trim() || 'an African country';

      return {
        title: brief.title || `Request for ${qty ? `${qty} ${unit} of goods` : 'quotation'}`,
        description:
          brief.description ||
          `We are looking for reliable suppliers who can provide this product with consistent quality, clear packaging and on-time delivery to ${country}. Please include pricing, lead time and available certifications in your quote.`,
        quantity: qty || '',
        unit,
        delivery_location: brief.delivery_location || '',
        target_country: brief.target_country || country,
      };
    } catch (error) {
      throw error;
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

