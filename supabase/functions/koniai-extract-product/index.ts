import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imageUrl, company_id } = await req.json();

        if (!imageUrl) throw new Error('imageUrl is required');

        // 1. Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

        // 2. Call Gemini Vision
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const prompt = `You are a commodity expert at Afrikoni. Look at this photo from a supplier and extract the product details.
        Identify:
        - Product Name (e.g., Raw Cashew Nuts, Shea Butter)
        - Category (e.g., Agriculture, Minerals)
        - Key Specifications (Grade, Color, Moisture, etc)
        - Estimated Price (if visible)
        - Unit (MT, KG, etc)
        
        Return ONLY a JSON object:
        {
            "name": "Product Name",
            "category": "Category",
            "description": "Short description",
            "specifications": {"key": "value"},
            "unit": "KG",
            "confidence": 0.0-1.0
        }`;

        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: { response_mime_type: "application/json" }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
