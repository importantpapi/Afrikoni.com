// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/**
 * KoniAI Contract Generator v2.0 (Gemini 3 Upgrade) 
 * Drafts professional purchase agreements for African B2B trade.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function generateContractWithGemini3(prompt: string, systemInstruction: string) {
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
        maxOutputTokens: 3000
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
      throw new Error(`Gemini 3 Contract Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No response content from Gemini 3');
    }

    return aiContent;
  } catch (error) {
    console.error('Gemini 3 Contract error:', error);
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

    const { trade, quote, buyer, supplier } = await req.json();

    const systemPrompt = `You are a high-level B2B Legal Intelligence engine specialized in African trade law and AfCFTA standards.
    Your goal is to draft a professional purchase contract based on a trade blueprint and quote.
    
    Output ONLY a valid JSON object with the following schema:
    {
      "contract": {
        "contract_id": "clinical id",
        "title": "Purchase Agreement",
        "parties": { "buyer": "...", "supplier": "..." },
        "clauses": [
          { "id": "SEC1", "title": "Subject Matter", "content": "..." },
          { "id": "SEC2", "title": "Pricing & Terms", "content": "..." },
          { "id": "SEC3", "title": "Logistics & Delivery", "content": "..." },
          { "id": "SEC4", "title": "Dispute Resolution", "content": "..." }
        ],
        "compliance_notes": "Key legal compliance flags"
      }
    }`;

    const userPrompt = `TRADE BLUEPRINT: ${JSON.stringify(trade)}
    QUOTE DATA: ${JSON.stringify(quote)}
    BUYER PROFILE: ${JSON.stringify(buyer)}
    SUPPLIER PROFILE: ${JSON.stringify(supplier)}`;

    const contractJSON = await generateContractWithGemini3(userPrompt, systemPrompt);

    let parsedResult;
    try {
      parsedResult = JSON.parse(contractJSON);
    } catch (e) {
      console.error('Failed to parse Gemini 3 output:', contractJSON);
      throw new Error('AI generated invalid contract data');
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
    console.error('Contract Generation Error:', error);
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
