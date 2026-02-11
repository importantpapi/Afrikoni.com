/**
 * Supabase Edge Function: KoniAI+ Chat Assistant
 *
 * Provides conversational AI assistance for African B2B trade.
 *
 * Endpoint: POST /functions/v1/koniai-chat
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

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

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
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

    // 2. Verify Authentication & Initialize User-Scoped Client
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

    // 3. 🔒 SECURITY PATCH: Fetch trusted context from Database
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
    }

    // Build personalized system prompt with TRUSTED DB DATA ONLY
    const userName = dbProfile?.full_name || 'Trader'
    // @ts-ignore
    const companyName = dbProfile?.company?.company_name
    // @ts-ignore
    const companyCountry = dbProfile?.company?.country

    // STRICT SERVER-SIDE VERIFICATION CHECK
    // @ts-ignore
    const dbStatus = dbProfile?.company?.verification_status?.toLowerCase() || 'pending'
    const isVerified = dbStatus === 'verified'

    // 4. Define Structured System Prompt
    const systemPrompt = `You are KoniAI+, the intelligent trade assistant for Afrikoni.

YOUR GOAL: Provide structured, actionable, and executive-level trade advice.

RESPONSE STYLE GUIDELINES:
1. **Structure is Key**: Use bold headers and distinct sections (e.g., ### **Strategy**, ### **Requirements**).
2. **Be Specific**: When listing requirements, use bullet points with bold keys (e.g., • **Grade:** Grade 1).
3. **Professional Tone**: Confident, concise, and expert.
4. **Formatting**: Always use Markdown headers (###), bold text (**text**), and bullet points (•).

EXAMPLE FORMAT:
"Hello ${userName}. Here is the draft RFQ.

### **Product Specifications**
• **Grade:** Grade 1 (Main Crop)
• **Bean Count:** 100 per 100g
• **Moisture:** < 7.5%

### **Shipping Terms**
• **Incoterms:** FOB Abidjan
• **Packaging:** 65kg Jute Bags

[Closing Advice]"

AFRIKONI PLATFORM CONTEXT:
- Verified suppliers have passed KYC/KYB checks via Smile ID
- Escrow payments protect both buyers and sellers
- Platform fee is 8% on successful transactions
- Supports cross-border African trade

SECURE USER CONTEXT (Verified by System):
- User: ${userName}
${companyName ? `- Company: ${companyName}` : ''}
${companyCountry ? `- Region: ${companyCountry}` : ''}
- Status: ${isVerified ? '✅ VERIFIED TRUSTED ENTITY' : '⚠️ Unverified / Pending Verification'}
${isVerified ? '(Treat this user as a trusted partner)' : '(Encourage verification for full access)'}

${context.currentPage ? `Current Context: User is viewing ${context.currentPage}` : ''}
${context.activeRFQ ? `Active RFQ Context: ${JSON.stringify(context.activeRFQ).slice(0, 500)}` : ''}

RESPONSE FORMAT:
Always respond in JSON format:
{
  "response": "Your structured markdown response here",
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
`

    // 5. Call Gemini API
    const geminiHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const contents = [
      ...geminiHistory,
      { role: 'user', parts: [{ text: message }] }
    ]

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`

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
    let aiContent = aiResult.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiContent) {
      throw new Error('No response content from Gemini')
    }

    // CLEANUP: Remove Markdown code fences if present
    aiContent = aiContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '')

    let chatResponse
    try {
      chatResponse = JSON.parse(aiContent)
    } catch (parseError) {
      console.warn('[KoniAI] JSON Parse failed, attempting manual recovery', parseError)

      // Fallback: Manual string extraction
      // This is more robust than Regex for handling newlines and nested structure anomalies
      try {
        // Find the start of the "response" field
        const responseKeyIndex = aiContent.indexOf('"response"')
        if (responseKeyIndex !== -1) {
          // Find the colon after "response"
          const colonIndex = aiContent.indexOf(':', responseKeyIndex)
          if (colonIndex !== -1) {
            // Find the first quote of the value
            const firstQuoteIndex = aiContent.indexOf('"', colonIndex)
            if (firstQuoteIndex !== -1) {
              // Iterate to find the closing quote, ignoring escaped quotes
              let lastQuoteIndex = -1
              for (let i = firstQuoteIndex + 1; i < aiContent.length; i++) {
                if (aiContent[i] === '"' && aiContent[i - 1] !== '\\') {
                  lastQuoteIndex = i
                  break
                }
              }

              if (lastQuoteIndex !== -1) {
                // Extract the raw string content
                const rawResponseString = aiContent.substring(firstQuoteIndex + 1, lastQuoteIndex)

                // Sanitize: Replace literal newlines with \n to ensure JSON.parse works
                // This fixes the "Bad control character" error from LLM outputs
                const validJsonString = rawResponseString
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');

                chatResponse = {
                  response: JSON.parse(`"${validJsonString}"`), // Decode escapes
                  actions: [],
                  suggestions: [],
                  confidence: 0.5
                }
              }
            }
          }
        }
      } catch (recoveryError) {
        console.error('[KoniAI] Manual recovery failed', recoveryError)
      }

      // If manual recovery also failed, check if it looks like JSON but wasn't parsed
      if (!chatResponse) {
        if (aiContent.trim().startsWith('{')) {
          // It's JSON but we couldn't parse it. Return a user-friendly error instead of raw JSON.
          chatResponse = {
            response: "I generated a response but there was a formatting error. Here is the raw text:\n\n" + aiContent.substring(0, 500) + "...",
            actions: [],
            suggestions: [],
            confidence: 0.1
          }
        } else {
          // It's just plain text (the LLM forgot JSON entirely)
          chatResponse = {
            response: aiContent,
            actions: [],
            suggestions: [],
            confidence: 0.8
          }
        }
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

  } catch (error: any) {
    console.error('[KoniAI Chat] Error:', error)

    return new Response(
      JSON.stringify({
        response: "I apologize, but I'm having trouble connecting to the network. Please check your connection or contact support.",
        actions: [
          {
            type: 'contact_support',
            label: 'Contact Support',
            data: {}
          }
        ],
        suggestions: ['Try asking again'],
        error: error.message || 'Unknown error'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
