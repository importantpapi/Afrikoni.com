/**
 * AI INTELLIGENCE SERVICE - 2026
 * Real AI-powered intelligence for RFQ matching, behavior analysis, fraud detection
 * 
 * Philosophy: AI as assistant, not replacement for human judgment
 * Strategy: Build behavioral data → Train models → Automate what works
 */

import { supabase } from '@/api/supabaseClient';

/**
 * AI-POWERED RFQ PARSER
 * Extracts structured data from natural language RFQ descriptions
 * Uses GPT-4 for intelligent parsing
 */
export async function parseRFQFromText(text, userContext = {}) {
  try {
    // Call OpenAI GPT-4 for parsing (if available)
    const systemPrompt = `You are an expert trade analyst for African B2B marketplace Afrikoni.
Extract structured RFQ data from user input. Return JSON ONLY with these fields:
{
  "product": "product name",
  "category": "Agriculture|Manufacturing|Construction|Textiles|Electronics|Other",
  "quantity": number,
  "quantity_unit": "units|kg|tons|pieces|meters|liters",
  "target_country": "country name or 'Any'",
  "budget_per_unit": number or null,
  "currency": "USD|EUR|GHS|NGN|KES|ZAR",
  "urgency": "Low|Medium|High|Critical",
  "delivery_deadline": "YYYY-MM-DD or null",
  "specifications": ["spec1", "spec2"],
  "confidence": 0-100
}

Context:
- User country: ${userContext.country || 'Unknown'}
- User industry: ${userContext.industry || 'Unknown'}
- Previous RFQs: ${userContext.previousCategories?.join(', ') || 'None'}

Be smart about African market context:
- If user says "cocoa", they likely mean raw cocoa beans
- "cement" usually means bulk construction materials
- "textiles" could be fabric rolls or finished garments
- Quantities in tons are common for commodities
- USD is default currency unless African currency mentioned
`;

    const userPrompt = `Parse this RFQ:\n\n"${text}"`;

    // Check if OpenAI API key exists
    // ⚡ PERFORMANCE: 5s Safety Timeout for all AI calls
    const withTimeout = (promise, ms = 5000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), ms))
      ]);

    // Check if OpenAI API key exists (Internal Admin Row)
    const { data: config } = await withTimeout(supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'openai_api_key')
      .single(), 3000);

    let parsed = null;

    if (config?.value) {
      // Real AI parsing with OpenAI
      const response = await withTimeout(fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      }));

      if (response.ok) {
        const result = await response.json();
        parsed = JSON.parse(result.choices[0].message.content);
      }
    }

    // Fallback: Rule-based parsing if AI unavailable
    if (!parsed) {
      parsed = ruleBasedParsing(text, userContext);
    }

    // Enrich with behavioral intelligence
    const enriched = await enrichWithBehavioralData(parsed, userContext);

    return {
      success: true,
      data: enriched,
      source: parsed.confidence ? 'ai' : 'rules'
    };

  } catch (error) {
    console.error('[AI] Parse error:', error);

    // Always return something usable
    return {
      success: false,
      data: ruleBasedParsing(text, userContext),
      source: 'fallback'
    };
  }
}

/**
 * RULE-BASED PARSING FALLBACK
 * When AI unavailable, use smart regex + heuristics
 */
function ruleBasedParsing(text, userContext) {
  const lowerText = text.toLowerCase();

  // Extract quantity
  const quantityMatch = text.match(/(\d+[\.,]?\d*)\s*(kg|tons?|pieces?|units?|meters?|litres?|liters?|mt|cubic\s?meters?)/i);
  const quantity = quantityMatch ? parseFloat(quantityMatch[1].replace(',', '')) : null;
  const quantity_unit = quantityMatch ? quantityMatch[2].toLowerCase() : 'units';

  // Extract product (first noun phrase or explicit keywords)
  const productKeywords = [
    'cocoa', 'coffee', 'cotton', 'cement', 'steel', 'iron', 'aluminum',
    'wheat', 'rice', 'maize', 'fertilizer', 'timber', 'textiles', 'fabric',
    'electronics', 'machinery', 'equipment', 'crude oil', 'refined oil'
  ];

  let product = null;
  for (const keyword of productKeywords) {
    if (lowerText.includes(keyword)) {
      product = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  if (!product) {
    // Extract first capitalized word as product guess
    const wordMatch = text.match(/\b([A-Z][a-z]+)\b/);
    product = wordMatch ? wordMatch[1] : 'Product';
  }

  // Extract country
  const countries = [
    'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Tanzania', 'Uganda',
    'Ethiopia', 'Egypt', 'Morocco', 'Algeria', 'Senegal', 'Ivory Coast',
    'Côte d\'Ivoire', 'Cameroon', 'Zambia', 'Zimbabwe', 'Botswana'
  ];

  let target_country = userContext.country || 'Any';
  for (const country of countries) {
    if (lowerText.includes(country.toLowerCase())) {
      target_country = country;
      break;
    }
  }

  // Extract budget
  const budgetMatch = text.match(/\$(\d+[\.,]?\d*)/);
  const budget_per_unit = budgetMatch ? parseFloat(budgetMatch[1].replace(',', '')) : null;

  // Detect urgency
  let urgency = 'Medium';
  if (/(urgent|asap|immediately|rush)/i.test(text)) urgency = 'Critical';
  else if (/(soon|quickly|fast)/i.test(text)) urgency = 'High';
  else if (/(flexible|no rush|when available)/i.test(text)) urgency = 'Low';

  // Extract deadline
  const dateMatch = text.match(/by\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
  let delivery_deadline = null;
  if (dateMatch) {
    try {
      delivery_deadline = new Date(dateMatch[1]).toISOString().split('T')[0];
    } catch (e) {
      // Invalid date
    }
  }

  // Determine category from product
  const categoryMap = {
    cocoa: 'Agriculture', coffee: 'Agriculture', cotton: 'Agriculture',
    wheat: 'Agriculture', rice: 'Agriculture', maize: 'Agriculture',
    cement: 'Construction', steel: 'Construction', iron: 'Construction',
    timber: 'Construction', textiles: 'Textiles', fabric: 'Textiles',
    electronics: 'Electronics', machinery: 'Manufacturing',
    equipment: 'Manufacturing'
  };

  const category = categoryMap[product?.toLowerCase()] || 'Other';

  return {
    product: product || 'Product',
    category,
    quantity: quantity || 1,
    quantity_unit,
    target_country,
    budget_per_unit,
    currency: 'USD',
    urgency,
    delivery_deadline,
    specifications: [],
    confidence: 60 // Rule-based is less confident
  };
}

/**
 * BEHAVIORAL INTELLIGENCE
 * Enrich RFQ data with user behavior patterns
 */
async function enrichWithBehavioralData(parsed, userContext) {
  try {
    if (!userContext.userId) return parsed;

    // Get user's historical behavior
    // Get user's historical behavior (3s timeout)
    const { data: userHistory } = await Promise.race([
      supabase
        .from('trades')
        .select('title, quantity, target_price, status, created_at')
        .eq('buyer_id', userContext.companyId)
        .order('created_at', { ascending: false })
        .limit(10),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Enrichment Timeout')), 3000))
    ]);

    if (!userHistory || userHistory.length === 0) return parsed;

    // Calculate average order value
    const avgQuantity = userHistory.reduce((sum, t) => sum + (t.quantity || 0), 0) / userHistory.length;
    const avgPrice = userHistory.reduce((sum, t) => sum + (t.target_price || 0), 0) / userHistory.length;

    // Detect unusual behavior
    const isLargerThanUsual = parsed.quantity > avgQuantity * 2;
    const isMoreExpensiveThanUsual = parsed.budget_per_unit && avgPrice > 0 &&
      parsed.budget_per_unit > avgPrice * 2;

    // Add behavioral metadata
    return {
      ...parsed,
      behavioral_insights: {
        is_repeat_buyer: userHistory.length > 0,
        avg_order_quantity: avgQuantity,
        avg_order_value: avgPrice,
        unusual_size: isLargerThanUsual,
        unusual_budget: isMoreExpensiveThanUsual,
        similar_past_orders: userHistory.filter(t =>
          t.title?.toLowerCase().includes(parsed.product.toLowerCase())
        ).length
      }
    };

  } catch (error) {
    console.error('[AI] Behavioral enrichment error:', error);
    return parsed;
  }
}

/**
 * FRAUD DETECTION AI
 * Detect suspicious RFQ patterns
 */
export async function detectFraudRisk(rfqData, userContext) {
  try {
    let riskScore = 0;
    const flags = [];

    // Check 1: Unverified company posting high-value RFQ
    if (!userContext.verified && rfqData.budget_per_unit * rfqData.quantity > 50000) {
      riskScore += 30;
      flags.push('High-value RFQ from unverified company');
    }

    // Check 2: Unrealistic quantities
    if (rfqData.quantity > 10000 && userContext.companyAge < 90) {
      riskScore += 25;
      flags.push('Large quantity from new company');
    }

    // Check 3: Suspicious urgency + high value
    if (rfqData.urgency === 'Critical' && rfqData.budget_per_unit * rfqData.quantity > 100000) {
      riskScore += 20;
      flags.push('Critical urgency with very high value');
    }

    // Check 4: Multiple similar RFQs in short time
    const { data: recentRFQs } = await supabase
      .from('trades')
      .select('id')
      .eq('buyer_id', userContext.companyId)
      .eq('trade_type', 'rfq')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentRFQs && recentRFQs.length > 5) {
      riskScore += 15;
      flags.push('Excessive RFQ posting (5+ in 24h)');
    }

    // Check 5: Budget seems too good to be true
    const { data: marketData } = await supabase
      .from('quotes')
      .select('unit_price')
      .ilike('title', `%${rfqData.product}%`)
      .limit(20);

    if (marketData && marketData.length > 0) {
      const avgMarketPrice = marketData.reduce((sum, q) => sum + (q.unit_price || 0), 0) / marketData.length;
      if (rfqData.budget_per_unit && rfqData.budget_per_unit < avgMarketPrice * 0.5) {
        riskScore += 20;
        flags.push('Budget 50% below market average');
      }
    }

    // Check 6: No company details
    if (!userContext.companyDescription || userContext.companyDescription.length < 50) {
      riskScore += 10;
      flags.push('Incomplete company profile');
    }

    return {
      risk_level: riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
      risk_score: riskScore,
      flags,
      should_block: riskScore >= 70,
      should_flag_for_review: riskScore >= 40
    };

  } catch (error) {
    console.error('[AI] Fraud detection error:', error);
    return {
      risk_level: 'UNKNOWN',
      risk_score: 0,
      flags: [],
      should_block: false,
      should_flag_for_review: false
    };
  }
}

/**
 * INTELLIGENT SUPPLIER RANKING
 * Re-rank matched suppliers based on behavioral success patterns
 */
export async function reRankSuppliersWithAI(suppliers, rfqData) {
  try {
    // Get historical performance data for each supplier
    const enrichedSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        const { data: performance } = await supabase
          .from('quotes')
          .select('status, created_at, response_time_hours')
          .eq('supplier_company_id', supplier.supplier_id)
          .limit(50);

        if (!performance || performance.length === 0) {
          return { ...supplier, ai_score: supplier.match_score };
        }

        // Calculate behavioral metrics
        const acceptanceRate = performance.filter(q => q.status === 'accepted').length / performance.length;
        const avgResponseTime = performance.reduce((sum, q) => sum + (q.response_time_hours || 24), 0) / performance.length;
        const recentActivity = performance.filter(q =>
          new Date(q.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        // AI scoring adjustments
        let aiScore = supplier.match_score;

        // Boost suppliers with high acceptance rate
        aiScore += acceptanceRate * 20;

        // Boost fast responders
        if (avgResponseTime < 6) aiScore += 15;
        else if (avgResponseTime < 12) aiScore += 10;
        else if (avgResponseTime < 24) aiScore += 5;

        // Boost recently active suppliers
        if (recentActivity > 5) aiScore += 10;
        else if (recentActivity > 2) aiScore += 5;

        // Cap at 100
        aiScore = Math.min(aiScore, 100);

        return {
          ...supplier,
          ai_score: Math.round(aiScore),
          behavioral_data: {
            acceptance_rate: Math.round(acceptanceRate * 100),
            avg_response_hours: Math.round(avgResponseTime),
            recent_quotes: recentActivity
          }
        };
      })
    );

    // Re-sort by AI score
    return enrichedSuppliers.sort((a, b) => b.ai_score - a.ai_score);

  } catch (error) {
    console.error('[AI] Re-ranking error:', error);
    return suppliers; // Return original if AI fails
  }
}

/**
 * PREDICTIVE ANALYTICS
 * Predict RFQ success probability
 */
export async function predictRFQSuccess(rfqData, userContext) {
  try {
    let successProbability = 50; // Base 50%
    const factors = [];

    // Factor 1: User verification
    if (userContext.verified) {
      successProbability += 20;
      factors.push('Verified buyer (+20%)');
    }

    // Factor 2: Complete RFQ details
    const completeness = [
      rfqData.product,
      rfqData.quantity,
      rfqData.target_country,
      rfqData.budget_per_unit,
      rfqData.delivery_deadline
    ].filter(Boolean).length / 5;

    const completenessBonus = Math.round(completeness * 15);
    successProbability += completenessBonus;
    factors.push(`RFQ completeness ${Math.round(completeness * 100)}% (+${completenessBonus}%)`);

    // Factor 3: Market availability
    const { data: supplierCount } = await supabase
      .from('companies')
      .select('id', { count: 'exact' })
      .eq('role', 'seller')
      .ilike('supplier_category', `%${rfqData.category}%`);

    if (supplierCount && supplierCount > 10) {
      successProbability += 15;
      factors.push('Strong supplier availability (+15%)');
    } else if (supplierCount && supplierCount > 5) {
      successProbability += 10;
      factors.push('Moderate supplier availability (+10%)');
    }

    // Factor 4: Realistic budget
    if (rfqData.budget_per_unit && rfqData.budget_per_unit > 0) {
      successProbability += 10;
      factors.push('Budget specified (+10%)');
    }

    // Factor 5: Urgency alignment
    if (rfqData.urgency === 'Medium' || rfqData.urgency === 'High') {
      successProbability += 5;
      factors.push('Reasonable urgency (+5%)');
    }

    // Cap at 95% (never 100% certain)
    successProbability = Math.min(successProbability, 95);

    return {
      success_probability: Math.round(successProbability),
      confidence: 'medium',
      factors,
      recommendation: successProbability >= 70
        ? 'High chance of success'
        : successProbability >= 50
          ? 'Moderate chance of success'
          : 'Low chance - may need manual intervention'
    };

  } catch (error) {
    console.error('[AI] Prediction error:', error);
    return {
      success_probability: 50,
      confidence: 'low',
      factors: [],
      recommendation: 'Unable to predict'
    };
  }
}

/**
 * QUOTE QUALITY SCORER
 * AI-powered quote quality assessment
 */
export async function scoreQuoteQuality(quoteData, rfqData) {
  try {
    let qualityScore = 0;
    const strengths = [];
    const weaknesses = [];

    // Check 1: Price competitiveness
    if (rfqData.budget_per_unit && quoteData.unit_price) {
      const priceRatio = quoteData.unit_price / rfqData.budget_per_unit;
      if (priceRatio <= 1) {
        qualityScore += 25;
        strengths.push('Within budget');
      } else if (priceRatio <= 1.2) {
        qualityScore += 15;
        weaknesses.push('Slightly over budget');
      } else {
        weaknesses.push('Significantly over budget');
      }
    }

    // Check 2: Lead time
    if (quoteData.lead_time_days && quoteData.lead_time_days <= 30) {
      qualityScore += 20;
      strengths.push('Fast delivery');
    } else if (quoteData.lead_time_days && quoteData.lead_time_days <= 60) {
      qualityScore += 10;
      strengths.push('Reasonable delivery');
    }

    // Check 3: Supplier verification
    if (quoteData.supplier_verified) {
      qualityScore += 20;
      strengths.push('Verified supplier');
    }

    // Check 4: Detailed specifications
    if (quoteData.specifications && quoteData.specifications.length > 3) {
      qualityScore += 15;
      strengths.push('Detailed specifications');
    }

    // Check 5: Payment terms flexibility
    if (quoteData.payment_terms && quoteData.payment_terms.includes('flexible')) {
      qualityScore += 10;
      strengths.push('Flexible payment terms');
    }

    // Check 6: Certifications
    if (quoteData.certifications && quoteData.certifications.length > 0) {
      qualityScore += 10;
      strengths.push('Has certifications');
    }

    return {
      quality_score: qualityScore,
      quality_grade: qualityScore >= 80 ? 'A' : qualityScore >= 60 ? 'B' : qualityScore >= 40 ? 'C' : 'D',
      strengths,
      weaknesses,
      recommendation: qualityScore >= 70 ? 'Recommended' : qualityScore >= 50 ? 'Consider' : 'Review carefully'
    };

  } catch (error) {
    console.error('[AI] Quote scoring error:', error);
    return {
      quality_score: 50,
      quality_grade: 'C',
      strengths: [],
      weaknesses: [],
      recommendation: 'Unable to score'
    };
  }
}

export default {
  parseRFQFromText,
  detectFraudRisk,
  reRankSuppliersWithAI,
  predictRFQSuccess,
  scoreQuoteQuality
};
