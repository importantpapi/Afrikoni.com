import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * KoniAI Chat v2.1 (Gemini 3 Upgrade) 
 * High-performance trade assistant with Multimodal Vision & DNA Extractor Protocol.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function chatWithGemini3(message: string, history: any[], context: any, image?: string) {
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;

    let systemInstruction = `You are KoniAI, the sovereign trade advisor for the Afrikoni B2B marketplace. 
    Using Gemini 3's expanded reasoning, you provide high-grade infrastructure support for African trade.
    
    EXPERTISE:
    - Intra-African trade (AfCFTA standards).
    - Logistics corridors and port sequencing.
    - Commodity pricing and quality standards.
    - Trade documentation and compliance.
    
    TONE: Infrastructure-grade, clinical, proactive.`;

    // DNA Extractor Mode
    if (context.isDNAExtraction) {
      systemInstruction += `\n\nDNA EXTRACTOR PROTOCOL:
      You are currently in DNA Extraction mode. Use your vision capabilities to parse the provided image or text.
      Focus on extracting: exporter, consignee, origin, incoterms, items (array with desc, qty, price, total).
      Output ONLY valid JSON matching this schema. If information is missing, use null.`;
    }

    systemInstruction += `\n\nCONTEXT: ${JSON.stringify(context)}`;

    const contents: any[] = [
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || m.text || "" }]
      }))
    ];

    const userParts: any[] = [{ text: message }];

    // Add multimodal part if image is provided
    if (image) {
      // Assuming image is base64 string
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = image.split(',')[1] || image;

      userParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    contents.push({
      role: 'user',
      parts: userParts
    });

    const body: any = {
      contents,
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: context.isDNAExtraction ? 0.1 : 0.7,
        maxOutputTokens: 2000,
        response_mime_type: context.isDNAExtraction ? "application/json" : "text/plain"
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
      throw new Error(`Gemini 3 Chat Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No response content from Gemini 3');
    }

    return aiContent;
  } catch (error) {
    console.error('Gemini 3 Chat error:', error);
    throw error;
  }
}

async function main(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ✅ JWT VERIFICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authorization");

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const { message, history = [], context = {}, image } = await req.json();

    if (!message) {
      throw new Error('No message provided');
    }

    const responseText = await chatWithGemini3(message, history, context, image);

    return new Response(
      JSON.stringify({
        response: responseText,
        model: 'gemini-3-flash',
        source: 'koniai_plus_gemini_3',
        is_multimodal: !!image
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
    console.error('Chat Error:', error);
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
