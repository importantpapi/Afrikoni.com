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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    const { message, history = [], context = {} }: ChatRequest = await req.json()

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Authentication & Initialize User-Scoped Client
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a client with the user's token to respect RLS and fetch trusted data
    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('[KoniAI Chat] Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    console.log(`[KoniAI Chat] Secured Request from user: ${userId}`)

    // 🔒 SECURITY PATCH: Fetch trusted context from Database (Forensic Audit Fix)
    // We NO LONGER trust context.userProfile from the client for identity or verification status.
    const { data: dbProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
            full_name,
            company:companies (
                company_name,
                country,
                verification_status
            )
        `)
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[KoniAI Security] Failed to fetch trusted profile:', profileError)
      // Proceed with degraded context rather than failing, but DO NOT trust client
    }

    // Build personalized system prompt with TRUSTED DB DATA ONLY
    const userName = dbProfile?.full_name || 'Trader'
    const companyName = dbProfile?.company?.company_name
    const companyCountry = dbProfile?.company?.country

    // STRICT SERVER-SIDE VERIFICATION CHECK
    // Normalized to handle 'verified', 'VERIFIED', etc.
    const dbStatus = dbProfile?.company?.verification_status?.toLowerCase() || 'pending'
    const isVerified = dbStatus === 'verified'

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

SECURE USER CONTEXT (Verified by System):
- User: ${userName}
${companyName ? `- Company: ${companyName}` : ''}
${companyCountry ? `- Region: ${companyCountry}` : ''}
- Status: ${isVerified ? '✅ VERIFIED TRUSTED ENTITY' : '⚠️ Unverified / Pending Verification'}
${isVerified ? '(Treat this user as a trusted partner with access to premium insights)' : '(Advise this user to complete verification for full platform access)'}

${context.currentPage ? `Current Context: User is viewing ${context.currentPage}` : ''}
${context.activeRFQ ? `Active RFQ Context: ${JSON.stringify(context.activeRFQ).slice(0, 500)}` : ''}

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


    // Map history to Gemini format
    const geminiHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Current interaction
    const contents = [
      ...geminiHistory,
      { role: 'user', parts: [{ text: message }] }
    ]

    // Call Google Gemini API (Flash 1.5)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    }

    console.log('[KoniAI] Sending request to Gemini...')

    const aiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text()
      console.error('[KoniAI Gemini] API Error:', errorBody)
      throw new Error('AI service temporarily unavailable')
    }

    const aiResult = await aiResponse.json()
    const aiContent = aiResult.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiContent) {
      throw new Error('No response content from Gemini')
    }

    let chatResponse
    try {
      chatResponse = JSON.parse(aiContent)
    } catch (parseError) {
      console.warn('[KoniAI] JSON Parse failed, wrapping raw text')
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
        response: "I apologize, but I'm having trouble connecting to my new brain (Gemini). Please check the API key configuration or try again.",
        actions: [
          {
            type: 'contact_support',
            label: 'Contact Support',
            data: {}
          }
        ],
        suggestions: ['Try asking again'],
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

