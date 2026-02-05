/**
 * Supabase Edge Function: KoniAI+ Quote Analyzer
 *
 * Analyzes and compares supplier quotes with AI-powered recommendations.
 *
 * Endpoint: POST /functions/v1/koniai-analyze-quote
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface Quote {
  id: string
  supplier_name: string
  supplier_country?: string
  unit_price: number
  total_price: number
  currency: string
  quantity: number
  delivery_days: number
  payment_terms?: string
  quality_certification?: string
  supplier_rating?: number
  verification_status?: string
}

interface AnalyzeRequest {
  quotes: Quote[]
  rfq: {
    title: string
    quantity: number
    budget_max?: number
    delivery_timeline?: string
    quality_requirements?: string
  }
  preferences?: {
    priority: 'price' | 'quality' | 'delivery' | 'balanced'
    max_delivery_days?: number
    require_verified?: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const { quotes, rfq, preferences = { priority: 'balanced' } }: AnalyzeRequest = await req.json()

    if (!quotes || quotes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No quotes provided for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare quote summary for AI
    const quoteSummary = quotes.map((q, i) => `
Quote ${i + 1}:
- Supplier: ${q.supplier_name} (${q.supplier_country || 'Unknown location'})
- Unit Price: ${q.currency} ${q.unit_price}
- Total Price: ${q.currency} ${q.total_price}
- Quantity: ${q.quantity}
- Delivery: ${q.delivery_days} days
- Payment Terms: ${q.payment_terms || 'Not specified'}
- Certifications: ${q.quality_certification || 'None specified'}
- Supplier Rating: ${q.supplier_rating ? `${q.supplier_rating}/5` : 'New supplier'}
- Verification: ${q.verification_status || 'Unverified'}
`).join('\n')

    const systemPrompt = `You are KoniAI+, an expert trade analyst for the Afrikoni B2B marketplace. Your role is to help buyers make informed decisions by analyzing supplier quotes.

ANALYSIS FRAMEWORK:
1. Price Analysis: Compare unit prices, total costs, and value for money
2. Delivery Assessment: Lead times, reliability indicators
3. Quality Indicators: Certifications, supplier history, verification status
4. Risk Assessment: Payment terms, supplier location, verification status
5. Overall Recommendation: Best option based on buyer's priorities

IMPORTANT CONSIDERATIONS:
- Verified suppliers on Afrikoni have passed KYC/KYB checks
- African suppliers may have variable delivery times due to logistics
- Consider total landed cost, not just unit price
- Factor in payment security (Afrikoni escrow available)

Buyer's priority: ${preferences.priority}
${preferences.max_delivery_days ? `Max acceptable delivery: ${preferences.max_delivery_days} days` : ''}
${preferences.require_verified ? 'Buyer prefers verified suppliers only' : ''}

Respond ONLY with valid JSON in this format:
{
  "analysis": {
    "price_comparison": {
      "lowest_price_quote": "Quote number/ID",
      "highest_price_quote": "Quote number/ID",
      "price_spread_percent": 0,
      "best_value_quote": "Quote number/ID",
      "price_insights": ["insight 1", "insight 2"]
    },
    "delivery_comparison": {
      "fastest_quote": "Quote number/ID",
      "slowest_quote": "Quote number/ID",
      "average_delivery_days": 0,
      "delivery_insights": ["insight 1"]
    },
    "quality_comparison": {
      "best_quality_indicators": "Quote number/ID",
      "quality_insights": ["insight 1"]
    },
    "risk_assessment": {
      "lowest_risk": "Quote number/ID",
      "risk_factors": ["factor 1", "factor 2"]
    }
  },
  "recommendation": {
    "best_overall": "Quote number/ID",
    "reasoning": "Detailed explanation",
    "confidence": 0.85,
    "runner_up": "Quote number/ID",
    "runner_up_reason": "Why this is second choice"
  },
  "insights": [
    "Market insight or actionable advice",
    "Negotiation tip if applicable"
  ],
  "warnings": [
    "Any red flags or concerns"
  ],
  "negotiation_opportunities": [
    "Specific points to negotiate"
  ]
}`

    const userPrompt = `Analyze these quotes for this RFQ:

RFQ: ${rfq.title}
Requested Quantity: ${rfq.quantity}
${rfq.budget_max ? `Budget: Up to ${rfq.budget_max}` : ''}
${rfq.delivery_timeline ? `Desired Delivery: ${rfq.delivery_timeline}` : ''}
${rfq.quality_requirements ? `Quality Requirements: ${rfq.quality_requirements}` : ''}

QUOTES TO ANALYZE:
${quoteSummary}`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('[KoniAI Analyze] OpenAI error:', error)
      throw new Error('AI service temporarily unavailable')
    }

    const openaiResult = await openaiResponse.json()
    const aiContent = openaiResult.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('No response from AI service')
    }

    let analysis
    try {
      analysis = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('[KoniAI Analyze] Failed to parse AI response:', aiContent)
      throw new Error('Failed to process AI response')
    }

    // Map quote IDs back to the recommendation
    if (analysis.recommendation?.best_overall) {
      const quoteIndex = parseInt(analysis.recommendation.best_overall.replace(/\D/g, '')) - 1
      if (quotes[quoteIndex]) {
        analysis.recommendation.best_overall_id = quotes[quoteIndex].id
      }
    }

    analysis.analyzed_at = new Date().toISOString()
    analysis.quotes_analyzed = quotes.length

    return new Response(
      JSON.stringify(analysis),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[KoniAI Analyze] Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to analyze quotes',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
