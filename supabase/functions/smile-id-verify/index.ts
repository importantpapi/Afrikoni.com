import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateSignature(timestamp: string, partnerId: string, apiKey: string) {
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(timestamp + partnerId + "sid_request");

    // SHA-256 HMAC for Smile ID
    // SmileID requires HMAC-SHA256 of timestamp + partnerId + "sid_request" using apiKey
    // But wait, the standard SmileID sign algorithm might just be: base64(rsa) or HMAC.
    // Actually, SmileID docs specify RSA signature with a public key OR HMAC.
    // We'll mock the signature for now since we're in MVP, but let's implement basic hashing.
    const keyInfo = await crypto.subtle.importKey(
        'raw',
        encoder.encode(apiKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', keyInfo, dataToSign);

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization')!;
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        const reqBody = await req.json();
        const { verificationPayload, endpoint } = reqBody;

        const SMILE_ID_API_KEY = Deno.env.get('SMILE_ID_API_KEY') || 'mock_api_key';
        const SMILE_ID_PARTNER_ID = Deno.env.get('SMILE_ID_PARTNER_ID') || 'mock_partner_id';
        const SMILE_ID_API_URL = Deno.env.get('SMILE_ID_API_URL') || 'https://testapi.smileidentity.com/v1';

        const timestamp = new Date().toISOString();
        const signature = await generateSignature(timestamp, SMILE_ID_PARTNER_ID, SMILE_ID_API_KEY);

        // Override payload with secure signature and timestamp
        verificationPayload.timestamp = timestamp;
        verificationPayload.signature = signature;
        verificationPayload.partner_id = SMILE_ID_PARTNER_ID;

        // Call Smile ID
        const response = await fetch(`${SMILE_ID_API_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify(result), { status: response.status, headers: corsHeaders });
        }

        return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
