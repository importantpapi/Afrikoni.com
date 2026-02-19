import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Create Admin Client for writes
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get User from Auth Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const { data: { user }, error: userError } = await adminClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user) throw new Error('Unauthorized');

        const { company_id, confirmed_fields } = await req.json();

        // Verify ownership
        const { data: company, error: companyError } = await adminClient
            .from('companies')
            .select('id')
            .eq('id', company_id)
            .eq('user_id', user.id)
            .single();

        if (companyError || !company) throw new Error('Unauthorized: Company mismatch');

        // Update Company Status
        const { error: companyUpdateError } = await adminClient
            .from('companies')
            .update({
                verification_status: 'basic',
                verified_at: new Date().toISOString()
            })
            .eq('id', company_id);

        if (companyUpdateError) throw companyUpdateError;

        // Update Verification Record
        const { error: verificationUpdateError } = await adminClient
            .from('business_verifications')
            .update({
                status: 'basic',
                progress: 100,
                ai_fields: confirmed_fields, // Overwrite with what user confirmed
                updated_at: new Date().toISOString()
            })
            .eq('company_id', company_id);

        if (verificationUpdateError) throw verificationUpdateError;

        // Log Event
        await adminClient.from('verification_events').insert({
            company_id,
            type: 'basic_granted',
            payload: {
                fields: confirmed_fields,
                granted_at: new Date().toISOString()
            }
        });

        // Optional: Trigger Async Background Check for Trade Verification here
        // e.g., await adminClient.functions.invoke('verify-background-check', { body: { company_id } })

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
