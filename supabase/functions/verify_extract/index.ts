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

        const { company_id, file, url } = await req.json();

        // Verify ownership
        const { data: company, error: companyError } = await adminClient
            .from('companies')
            .select('id')
            .eq('id', company_id)
            .eq('user_id', user.id)
            .single();

        if (companyError || !company) throw new Error('Unauthorized: Company mismatch');

        // MOCK AI EXTRACTION
        // In a real scenario, we would call OpenAI or a vision API here.
        // For now, we return mock data based on input type.

        const mockFields = {
            business_name: "Mock Enterprise Ltd.",
            country: "Nigeria",
            city: "Lagos",
            category: "Agriculture & Food",
            registration_number: "RC123456",
            email: user.email, // fallback to user email
            website: url || "https://mock-enterprise.com",
            phone: "+234 800 123 4567"
        };

        const ai_summary = file
            ? "Extracted from uploaded document with high confidence."
            : "Extracted from provided URL metadata.";

        // Update Verification Record
        const { error: updateError } = await adminClient
            .from('business_verifications')
            .update({
                ai_fields: mockFields,
                ai_summary: ai_summary,
                progress: 70,
                review_state: 'auto_pass',
                method: file ? 'upload' : 'link',
                updated_at: new Date().toISOString()
            })
            .eq('company_id', company_id);

        if (updateError) throw updateError;

        // Log Event
        await adminClient.from('verification_events').insert({
            company_id,
            type: 'extract_done',
            payload: {
                method: file ? 'upload' : 'link',
                confidence: 0.95
            }
        });

        return new Response(JSON.stringify({
            success: true,
            ai_fields: mockFields,
            confidence: 0.95
        }), {
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
