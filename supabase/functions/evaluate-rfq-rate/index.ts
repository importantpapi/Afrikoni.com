import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // Check count of RFQs in the last hour
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

        const { count, error: countError } = await supabaseClient
            .from('trades')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .eq('trade_type', 'rfq')
            .gt('created_at', oneHourAgo)

        if (countError) throw countError

        const LIMIT = 5
        const isOverLimit = count !== null && count >= LIMIT

        return new Response(JSON.stringify({
            allowed: !isOverLimit,
            count,
            limit: LIMIT,
            remaining: Math.max(0, LIMIT - (count || 0)),
            message: isOverLimit
                ? `Rate limit exceeded. Manual limit is ${LIMIT} per hour for security.`
                : 'Under capacity limits.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
