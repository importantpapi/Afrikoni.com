/**
 * Supabase Edge Function: KoniAI+ Chat Assistant
 *
 * Provides conversational AI assistance for African B2B trade.
 *
 * Endpoint: POST /functions/v1/koniai-chat
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
  context?: {
    currentPage?: string
    userProfile?: {
      full_name?: string
      company?: {
        company_name?: string
        country?: string
        verification_status?: string
      }
    }
    activeRFQ?: object
    activeQuote?: object
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

    const { message, history = [], context = {} }: ChatRequest = await req.json()

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build personalized system prompt
    const userName = context.userProfile?.full_name || 'there'
    const companyName = context.userProfile?.company?.company_name
    const companyCountry = context.userProfile?.company?.country
    const isVerified = context.userProfile?.company?.verification_status === 'VERIFIED'

    const systemPrompt = `You are KoniAI+, the intelligent trade assistant for Afrikoni - Africa's premier B2B marketplace connecting African suppliers with global buyers.

YOUR PERSONALITY:
- Warm, professional, and knowledgeable about African trade
- Use clear, concise language suitable for business communication
- Be helpful but not overly formal - think trusted business advisor
- Reference African trade context when relevant

YOUR CAPABILITIES:
1. Help create and optimize RFQs (Request for Quotes)
2. Analyze and compare supplier quotes
3. Provide market insights on African trade goods
4. Assist with shipping and logistics questions
5. Guide users through the Afrikoni platform
6. Explain trade documentation and compliance
7. Offer negotiation strategies and tips

AFRIKONI PLATFORM CONTEXT:
- Verified suppliers have passed KYC/KYB checks via Smile ID
- Escrow payments protect both buyers and sellers
- Platform fee is 8% on successful transactions
- Supports cross-border African trade
- Common categories: Agriculture, Textiles, Minerals, Crafts

${companyName ? `USER CONTEXT:
- User: ${userName}
- Company: ${companyName}
- Country: ${companyCountry || 'Not specified'}
- Verification: ${isVerified ? 'Verified Supplier/Buyer' : 'Pending verification'}` : ''}

${context.currentPage ? `Current page: ${context.currentPage}` : ''}

RESPONSE FORMAT:
Always respond in JSON format:
{
  "response": "Your helpful response text here",
  "actions": [
    {
      "type": "navigate|create_rfq|view_quotes|contact_support",
      "label": "Button label",
      "data": {}
    }
  ],
  "suggestions": ["Follow-up question 1", "Follow-up question 2"],
  "confidence": 0.9
}

Keep responses concise (2-3 paragraphs max). Use bullet points for lists. Suggest relevant actions when appropriate.`

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('[KoniAI Chat] OpenAI error:', error)
      throw new Error('AI service temporarily unavailable')
    }

    const openaiResult = await openaiResponse.json()
    const aiContent = openaiResult.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('No response from AI service')
    }

    let chatResponse
    try {
      chatResponse = JSON.parse(aiContent)
    } catch (parseError) {
      // If JSON parsing fails, wrap the response
      chatResponse = {
        response: aiContent,
        actions: [],
        suggestions: [],
        confidence: 0.8
      }
    }

    // Ensure required fields exist
    chatResponse.actions = chatResponse.actions || []
    chatResponse.suggestions = chatResponse.suggestions || []
    chatResponse.timestamp = new Date().toISOString()

    return new Response(
      JSON.stringify(chatResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[KoniAI Chat] Error:', error)

    return new Response(
      JSON.stringify({
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact Afrikoni support if the issue persists.",
        actions: [
          {
            type: 'contact_support',
            label: 'Contact Support',
            data: {}
          }
        ],
        suggestions: ['Try asking your question again', 'Browse our help center'],
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
