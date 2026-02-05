/**
 * Supabase Edge Function: KoniAI+ RFQ Generator
 *
 * Converts natural language descriptions into structured RFQs using OpenAI.
 *
 * Endpoint: POST /functions/v1/koniai-generate-rfq
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface RFQRequest {
  description: string
  category?: string
  buyerCountry?: string
  context?: {
    budget?: string
    timeline?: string
    quality?: string
    quantity?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const { description, category, buyerCountry, context = {} }: RFQRequest = await req.json()

    if (!description || description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Description must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the system prompt for African B2B trade context
    const systemPrompt = `You are KoniAI+, an AI trade assistant specialized in African B2B commerce for the Afrikoni marketplace. Your role is to help buyers create professional, detailed RFQs (Request for Quotes) from natural language descriptions.

IMPORTANT CONTEXT:
- Afrikoni is a B2B marketplace connecting African suppliers with global buyers
- Common trade goods include: agricultural products (cocoa, coffee, shea butter, cassava), textiles, minerals, handicrafts
- Shipping typically involves African logistics corridors
- Prices should consider African market rates and export costs

When generating an RFQ, extract and structure:
1. Product details (name, specifications, quality grade)
2. Quantity (units, weight, or volume)
3. Delivery requirements (timeline, location, Incoterms)
4. Budget range (if mentioned)
5. Quality/certification requirements
6. Any special requirements

Respond ONLY with valid JSON in this exact format:
{
  "rfq": {
    "title": "Brief descriptive title",
    "product_name": "Specific product name",
    "category": "Product category",
    "description": "Detailed product description including specifications",
    "quantity": "Numerical quantity with unit",
    "unit": "Unit of measurement (kg, units, MT, etc.)",
    "quality_requirements": "Quality specs, certifications needed",
    "delivery_timeline": "Expected delivery timeframe",
    "delivery_location": "Destination country/city",
    "budget_range": { "min": 0, "max": 0, "currency": "USD" },
    "incoterms": "Suggested Incoterms (FOB, CIF, etc.)",
    "additional_requirements": "Any other specifications"
  },
  "suggestions": [
    "Helpful suggestion about the RFQ",
    "Market insight or recommendation"
  ],
  "confidence": 0.85,
  "clarification_needed": ["List of info that would improve the RFQ"]
}`

    const userPrompt = `Convert this request into a structured RFQ:

"${description}"

${category ? `Category hint: ${category}` : ''}
${buyerCountry ? `Buyer location: ${buyerCountry}` : ''}
${context.budget ? `Budget: ${context.budget}` : ''}
${context.timeline ? `Timeline: ${context.timeline}` : ''}
${context.quantity ? `Quantity: ${context.quantity}` : ''}
${context.quality ? `Quality requirements: ${context.quality}` : ''}`

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
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('[KoniAI RFQ] OpenAI error:', error)
      throw new Error('AI service temporarily unavailable')
    }

    const openaiResult = await openaiResponse.json()
    const aiContent = openaiResult.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('No response from AI service')
    }

    // Parse AI response
    let parsedRFQ
    try {
      parsedRFQ = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('[KoniAI RFQ] Failed to parse AI response:', aiContent)
      throw new Error('Failed to process AI response')
    }

    // Add metadata
    parsedRFQ.generated_at = new Date().toISOString()
    parsedRFQ.source = 'koniai_plus'

    return new Response(
      JSON.stringify(parsedRFQ),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[KoniAI RFQ] Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate RFQ',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
