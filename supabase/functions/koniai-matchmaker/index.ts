import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWhatsApp(to: string, body: string) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.error("[Matchmaker] Twilio credentials missing");
        return;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            From: TWILIO_WHATSAPP_NUMBER,
            To: `whatsapp:${to}`,
            Body: body
        })
    });

    return response.json();
}

async function matchWithGemini(rfq: any, suppliers: any[]) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are the KoniAI Trade Matchmaker for Afrikoni.
  Your task is to match a buyer's Request for Quote (RFQ) with the most relevant suppliers from a provided list.
  
  RFQ Details:
  - Title: ${rfq.title}
  - Description: ${rfq.description}
  - Category: ${rfq.category?.name || 'Unknown'}
  
  Suppliers List:
  ${suppliers.map(s => `- ID: ${s.id}, Name: ${s.company_name}, Desc: ${s.description}, Country: ${s.country}`).join('\n')}
  
  Select the TOP 5 most relevant suppliers. 
  Consider: product relevance, geographic proximity (if specified), and company capabilities.
  
  Output ONLY a JSON array of objects:
  [
    {"supplier_id": "UUID", "reason": "Short explanation of why this is a good match", "relevance_score": 0.0-1.0}
  ]`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: "Perform the matching logic." }] }],
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return JSON.parse(textResponse);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { rfq_id } = await req.json();

        if (!rfq_id) {
            return new Response(JSON.stringify({ error: "Missing rfq_id" }), { status: 400 });
        }

        // 1. Fetch RFQ details (from the unified trades table)
        const { data: rfq, error: rfqError } = await supabase
            .from('trades')
            .select('*, category:categories(name)')
            .eq('id', rfq_id)
            .eq('trade_type', 'rfq')
            .single();

        if (rfqError || !rfq) throw new Error(`RFQ not found in kernel: ${rfqError?.message}`);

        // 2. Fetch potential suppliers (Approved Sellers)
        const { data: suppliers, error: suppliersError } = await supabase
            .from('companies')
            .select('id, company_name, description, country, city, company_capabilities!inner(can_sell, sell_status)')
            .eq('company_capabilities.can_sell', true)
            .eq('company_capabilities.sell_status', 'approved')
            .limit(50);

        if (suppliersError) throw new Error(`Failed to fetch suppliers: ${suppliersError.message}`);

        // 3. AI Matching with Gemini
        const matches = await matchWithGemini(rfq, suppliers);

        // 4. Record matches and notify
        const results = [];
        for (const match of matches) {
            // Find supplier phone
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone, full_name')
                .eq('company_id', match.supplier_id)
                .eq('role', 'seller')
                .maybeSingle();

            if (profile?.phone) {
                const body = `📦 *New Trade Opportunity!*
        
An RFQ matching your products was just posted on Afrikoni.
        
*Product:* ${rfq.title}
*Relevance:* ${Math.round(match.relevance_score * 100)}%
*Reason:* ${match.reason}
        
Reply "Quote" to see more details and submit your offer.`;

                await sendWhatsApp(profile.phone, body);
                results.push({ supplier_id: match.supplier_id, notified: true });

                // Log in trade_events
                await supabase.from('trade_events').insert({
                    trade_id: rfq_id,
                    event_type: 'supplier_notified',
                    actor_id: (profile as any).id,
                    payload: {
                        match_score: match.relevance_score,
                        reason: match.reason,
                        notification_channel: 'whatsapp'
                    }
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            matches_found: matches.length,
            notified: results.length
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('[Matchmaker] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
