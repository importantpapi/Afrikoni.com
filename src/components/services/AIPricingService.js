import { callChatAsJson } from '@/ai/aiClient';

// AI Pricing Service - backed by secured Edge Function AI proxy

export const AIPricingService = {
  getOptimalPricing: async (productData) => {
    const unavailable = {
      available: false,
      reason: 'AI pricing guidance is currently not available.',
      suggestions: []
    };

    try {
      const basePrice = Number(productData.price || 0);
      const fallbackBase = basePrice > 0 ? basePrice : 0;

      const system = `You are a B2B pricing analyst for African trade corridors.
Return JSON:
{
  "suggestions": [{"price":"number","reason":"string","confidence":"number(0-1)"}]
}
Rules:
- 2 suggestions only.
- Prices in same currency context as input.
- Keep reasons practical, no hype.`;

      const user = `Create pricing suggestions.
product: ${productData.name || productData.title || 'Product'}
category: ${productData.category || ''}
basePrice: ${fallbackBase}
currency: ${productData.currency || 'USD'}
countryOfOrigin: ${productData.country || ''}
targetMarket: ${productData.targetMarket || ''}`;

      const { success, data } = await callChatAsJson(
        { system, user, temperature: 0.2 },
        { fallback: null }
      );

      if (!success || !data || !Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        return unavailable;
      }

      return {
        available: true,
        suggestions: data.suggestions.slice(0, 2).map((suggestion, index) => {
          const fallbackSuggestion = {
            price: fallbackBase,
            reason: 'AI suggestion available',
            confidence: 0.5
          };
          return {
            price: Number(suggestion.price) || fallbackSuggestion.price,
            reason: suggestion.reason || fallbackSuggestion.reason,
            confidence: Math.max(0, Math.min(1, Number(suggestion.confidence) || fallbackSuggestion.confidence))
          };
        })
      };
    } catch (error) {
      return unavailable;
    }
  }
};
