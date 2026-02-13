// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/**
 * Supabase Edge Function: KoniAI RFQ Generator v2.0 (Gemini 3 Upgrade) 
 * Converts natural language to structured Trade Kernel RFQs + HS Codes
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function generateWithGemini3(prompt: string, systemInstruction: string) {
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2000
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini 3 API error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No response content from Gemini 3');
    }

    return aiContent;
  } catch (error) {
    console.error('Gemini 3 API error:', error);
    throw error;
  }
}

async function main(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const { description, category, buyerCountry, context = {} } = await req.json();

    if (!description || description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Description too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are the KoniAI Trade Architect. Your goal is to convert natural language trade requests into structured B2B RFQs for the African market using Gemini 3's reasoning engine.
    
    For the provided trade description, you must:
    1. Identify the core product and specifications.
    2. Determine the most likely HS Code (Harmonized System).
    3. Suggest appropriate Incoterms (e.g., FOB, CIF).
    4. Create a 3-step logistics sequence (Phase 1: Sourcing/Loading, Phase 2: Transit, Phase 3: Final Delivery).
    
    Output ONLY a valid JSON object with the following schema:
    {
      "rfq": {
        "title": "short clinical title",
        "product_name": "Specific product name",
        "category": "Product category",
        "description": "Detailed product description",
        "quantity": "estimated numeric quantity",
        "unit": "standard unit (MT, KG, etc)",
        "hs_code": "6-digit HS code",
        "incoterms": "suggested incoterm",
        "delivery_location": "suggested port or city",
        "quality_requirements": "key quality standards"
      },
      "logistics_sequence": [
        {"step": 1, "action": "action description", "timeframe": "days"},
        {"step": 2, "action": "action description", "timeframe": "days"},
        {"step": 3, "action": "action description", "timeframe": "days"}
      ],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "confidence": 0.0-1.0
    }`;

    const userPrompt = `USER TRADE DESCRIPTION: "${description}"
    ${category ? `CATEGORY HINT: ${category}` : ''}
    ${buyerCountry ? `BUYER COUNTRY: ${buyerCountry}` : ''}
    ${Object.keys(context).length > 0 ? `ADDITIONAL CONTEXT: ${JSON.stringify(context)}` : ''}`;

    const rfqJSON = await generateWithGemini3(userPrompt, systemPrompt);

    let parsedResult;
    try {
      parsedResult = JSON.parse(rfqJSON);
    } catch (e) {
      console.error('Failed to parse Gemini 3 output:', rfqJSON);
      throw new Error('AI generated invalid trade data');
    }

    return new Response(
      JSON.stringify({
        ...parsedResult,
        model: 'gemini-3-flash',
        source: 'koniai_plus_gemini_3',
        generated_at: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('RFQ Generation Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

serve(main);
