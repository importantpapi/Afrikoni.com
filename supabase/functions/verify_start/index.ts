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

        const { company_id, business_name, country } = await req.json();

        // Verify ownership
        const { data: company, error: companyError } = await adminClient
            .from('companies')
            .select('id')
            .eq('id', company_id)
            .eq('user_id', user.id)
            .single();

        if (companyError || !company) throw new Error('Unauthorized: Company mismatch');

        // Upsert Verification Record
        const { error: upsertError } = await adminClient
            .from('business_verifications')
            .upsert({
                company_id,
                status: 'unverified',
                progress: 20,
                risk_score: 0,
                method: 'manual', // default
                updated_at: new Date().toISOString()
            });

        if (upsertError) throw upsertError;

        // Log Event
        await adminClient.from('verification_events').insert({
            company_id,
            type: 'started',
            payload: { business_name, country }
        });

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
