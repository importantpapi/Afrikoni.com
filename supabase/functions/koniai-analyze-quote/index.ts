// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/**
 * KoniAI Quote Analyzer v2.0 (Gemini 3 Upgrade) 
 * Provides autonomous comparisons and recommendations.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function analyzeWithGemini3(prompt: string, systemInstruction: string) {
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
      throw new Error(`Gemini 3 Analysis Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No response content from Gemini 3');
    }

    return aiContent;
  } catch (error) {
    console.error('Gemini 3 Analysis error:', error);
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

    const { quotes, rfq, preferences = {} } = await req.json();

    if (!quotes || quotes.length === 0) {
      throw new Error('No quotes provided');
    }

    const systemPrompt = `You are the KoniAI Trade Auditor. Using Gemini 3's deep reasoning, you must compare multiple supplier quotes against an RFQ for African trade.
    
    CRITERIA:
    1. Compliance with specs and quality requirements.
    2. Price competitiveness (Total Landed Cost if CIF/DDP).
    3. Delivery timeline and logistics feasibility.
    4. Supplier trustworthiness (if mentioned).
    
    Output ONLY a valid JSON object with the following schema:
    {
      "analysis": [
        { "quote_id": "...", "pros": [], "cons": [], "score": 0-100 }
      ],
      "recommendation": {
        "best_quote_id": "...",
        "reasoning": "detailed reasoning",
        "negotiation_tips": ["tip 1", "tip 2"]
      },
      "market_insights": ["insight 1", "insight 2"]
    }`;

    const userPrompt = `RFQ: ${JSON.stringify(rfq)}
    QUOTES: ${JSON.stringify(quotes)}
    PREFERENCES: ${JSON.stringify(preferences)}`;

    const analysisJSON = await analyzeWithGemini3(userPrompt, systemPrompt);

    let parsedResult;
    try {
      parsedResult = JSON.parse(analysisJSON);
    } catch (e) {
      console.error('Failed to parse Gemini 3 output:', analysisJSON);
      throw new Error('AI generated invalid analysis data');
    }

    return new Response(
      JSON.stringify({
        ...parsedResult,
        model: 'gemini-3-flash',
        source: 'koniai_plus_gemini_3',
        analyzed_at: new Date().toISOString()
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
    console.error('Quote Analysis Error:', error);
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
