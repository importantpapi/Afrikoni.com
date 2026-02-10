/**
 * KoniAIService - AI Trade Assistant Service (KoniAI+)
 *
 * Provides AI-powered trade assistance for African B2B marketplace:
 * - RFQ Generation: Convert natural language to structured RFQs
 * - Quote Analysis: AI-powered quote comparison and recommendations
 * - Trade Intelligence: Market insights and pricing suggestions
 * - Negotiation Support: AI-assisted negotiation guidance
 *
 * Architecture:
 * - Frontend service calls Supabase Edge Functions
 * - Edge Functions securely call OpenAI API
 * - Results are processed and returned to the UI
 */

import { supabase } from '@/api/supabaseClient';

// KoniAI Edge Function base URL
const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Generate a structured RFQ from natural language description
 * @param {Object} params - RFQ generation parameters
 * @param {string} params.description - Natural language description of what the user needs
 * @param {string} params.category - Product category (optional)
 * @param {string} params.buyerCountry - Buyer's country for shipping calculations
 * @param {Object} params.context - Additional context (budget, timeline, etc.)
 * @returns {Promise<{rfq: Object, suggestions: Array, confidence: number}>}
 */
export async function generateRFQ({ description, category, buyerCountry, context = {} }) {
  try {
    if (!description || description.trim().length < 10) {
      throw new Error('Please provide a more detailed description of what you need');
    }

    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_FUNCTION_BASE}/koniai-generate-rfq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({
        description,
        category,
        buyerCountry,
        context
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate RFQ');
    }

    const result = await response.json();

    // Log AI interaction for analytics
    await logAIInteraction('generate_rfq', { description, category }, result);

    return result;

  } catch (error) {
    console.error('[KoniAIService] generateRFQ error:', error);
    throw error;
  }
}

/**
 * Analyze and compare quotes with AI recommendations
 * @param {Object} params - Quote analysis parameters
 * @param {Array} params.quotes - Array of quote objects to analyze
 * @param {Object} params.rfq - Original RFQ for context
 * @param {Object} params.preferences - Buyer preferences (price, quality, delivery time)
 * @returns {Promise<{analysis: Object, recommendation: Object, insights: Array}>}
 */
export async function analyzeQuotes({ quotes, rfq, preferences = {} }) {
  try {
    if (!quotes || quotes.length === 0) {
      throw new Error('No quotes provided for analysis');
    }

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_FUNCTION_BASE}/koniai-analyze-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({
        quotes,
        rfq,
        preferences
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze quotes');
    }

    const result = await response.json();

    // Log AI interaction
    await logAIInteraction('analyze_quotes', { quoteCount: quotes.length }, result);

    return result;

  } catch (error) {
    console.error('[KoniAIService] analyzeQuotes error:', error);
    throw error;
  }
}

/**
 * Get AI-powered trade chat response
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {Array} params.history - Previous chat history
 * @param {Object} params.context - Current page/action context
 * @returns {Promise<{response: string, actions: Array, suggestions: Array}>}
 */
export async function chat({ message, history = [], context = {} }) {
  try {
    if (!message || message.trim().length === 0) {
      throw new Error('Please enter a message');
    }

    const { data: { session } } = await supabase.auth.getSession();

    // Get user profile for personalization
    let userProfile = null;
    if (session?.user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company_id')
        .eq('id', session.user.id)
        .single();
      userProfile = data;

      // Get company info if available
      if (data?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('id, company_name, country, verification_status')
          .eq('id', data.company_id)
          .maybeSingle();
        if (company) {
          userProfile.company = company;
        }
      }
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE}/koniai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({
        message,
        history: history.slice(-10), // Keep last 10 messages for context
        context: {
          ...context,
          userProfile
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get AI response');
    }

    const result = await response.json();

    return result;

  } catch (error) {
    console.error('[KoniAIService] chat error:', error);
    throw error;
  }
}

/**
 * Get pricing suggestions based on market data
 * @param {Object} params - Pricing parameters
 * @param {string} params.productName - Product name
 * @param {string} params.category - Product category
 * @param {number} params.quantity - Order quantity
 * @param {string} params.sourceCountry - Supplier country
 * @param {string} params.destinationCountry - Buyer country
 * @returns {Promise<{suggestedPrice: Object, marketRange: Object, factors: Array}>}
 */
export async function getPricingSuggestion({
  productName,
  category,
  quantity,
  sourceCountry,
  destinationCountry
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_FUNCTION_BASE}/koniai-pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({
        productName,
        category,
        quantity,
        sourceCountry,
        destinationCountry
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get pricing suggestion');
    }

    return await response.json();

  } catch (error) {
    console.error('[KoniAIService] getPricingSuggestion error:', error);
    throw error;
  }
}

/**
 * Get negotiation guidance
 * @param {Object} params - Negotiation parameters
 * @param {Object} params.quote - Current quote
 * @param {Object} params.rfq - Original RFQ
 * @param {string} params.goal - Negotiation goal (better price, faster delivery, etc.)
 * @returns {Promise<{suggestions: Array, talkingPoints: Array, counterOfferRange: Object}>}
 */
export async function getNegotiationGuidance({ quote, rfq, goal }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_FUNCTION_BASE}/koniai-negotiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({
        quote,
        rfq,
        goal
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get negotiation guidance');
    }

    return await response.json();

  } catch (error) {
    console.error('[KoniAIService] getNegotiationGuidance error:', error);
    throw error;
  }
}

/**
 * Log AI interaction for analytics and improvement
 * @param {string} action - Type of AI action
 * @param {Object} input - Input data (sanitized)
 * @param {Object} output - Output data (sanitized)
 */
async function logAIInteraction(action, input, output) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    await supabase.from('activity_logs').insert({
      entity_type: 'ai_interaction',
      entity_id: session?.user?.id || 'anonymous',
      action: `koniai_${action}`,
      metadata: {
        input_summary: typeof input === 'object' ? Object.keys(input) : input,
        output_type: output?.success ? 'success' : 'failure',
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Don't throw - logging should not break main flow
    console.warn('[KoniAIService] Failed to log interaction:', error);
  }
}

/**
 * Quick actions available in KoniAI+ chat
 */
export const QuickActions = [
  {
    id: 'create_rfq',
    label: 'Create RFQ',
    icon: 'FileText',
    prompt: 'Help me create a new Request for Quote'
  },
  {
    id: 'compare_quotes',
    label: 'Compare Quotes',
    icon: 'BarChart2',
    prompt: 'Help me compare quotes I received'
  },
  {
    id: 'find_suppliers',
    label: 'Find Suppliers',
    icon: 'Search',
    prompt: 'Help me find verified suppliers for my needs'
  },
  {
    id: 'shipping_estimate',
    label: 'Shipping Estimate',
    icon: 'Truck',
    prompt: 'Help me estimate shipping costs'
  },
  {
    id: 'market_insights',
    label: 'Market Insights',
    icon: 'TrendingUp',
    prompt: 'What are the current market trends?'
  },
  {
    id: 'negotiate_help',
    label: 'Negotiation Help',
    icon: 'MessageCircle',
    prompt: 'Help me negotiate better terms'
  }
];

/**
 * Suggested prompts for new users
 */
export const SuggestedPrompts = [
  "I need to source 500kg of raw shea butter from West Africa",
  "Compare these supplier quotes and recommend the best one",
  "What's the average price for cocoa beans from Ghana?",
  "Help me write a professional RFQ for textile fabrics",
  "What documents do I need for importing goods to Nigeria?",
  "Find verified cassava suppliers in Tanzania"
];

export default {
  generateRFQ,
  analyzeQuotes,
  chat,
  getPricingSuggestion,
  getNegotiationGuidance,
  QuickActions,
  SuggestedPrompts
};
