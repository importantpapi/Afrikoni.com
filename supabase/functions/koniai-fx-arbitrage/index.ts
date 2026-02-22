import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * AFRIKONI FX ARBITRAGE ENGINE
 * 
 * Purpose: Route payments through the most cost-effective channel.
 * Compares: Stripe (Global), Flutterwave (Pan-African), PAPSS (Settlement Layer).
 * 
 * Logic:
 * - If Intra-Africa Trade -> Prioritize PAPSS (Lowest Fee).
 * - If International -> Compare Stripe vs Flutterwave based on corridors.
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArbitrageRequest {
    amount: number;
    currency: string;
    origin_country: string;
    destination_country: string;
}

const AFRICAN_COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Tanzania', 'Uganda', 'Rwanda', 'Egypt', 'Ivory Coast', 'Senegal'];

function isIntraAfrica(origin: string, dest: string) {
    return AFRICAN_COUNTRIES.includes(origin) && AFRICAN_COUNTRIES.includes(dest);
}

function calculateStripeFee(amount: number, _currency: string, _isInternational: boolean) {
    // Standard Pricing: 2.9% + 30c
    const fixedFee = 0.30;
    const variableRate = 0.029;
    return (amount * variableRate) + fixedFee;
}

function calculateFlutterwaveFee(amount: number, _currency: string, isIntraAfrica: boolean) {
    // Intra-Africa: ~1.4% | International: ~3.8%
    const rate = isIntraAfrica ? 0.014 : 0.038;
    return amount * rate;
}

function calculatePAPSSFee(amount: number, _currency: string) {
    // PAPSS: Extremely low cost settlement (approx 0.2% - 0.5%)
    // Mocked for simulation as it's B2B bank rail
    return amount * 0.005; // 0.5% flat
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization required' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !serviceRoleKey) {
            return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authData?.user) {
            return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { amount, currency, origin_country, destination_country }: ArbitrageRequest = await req.json();

        if (!amount || amount <= 0 || !currency || !origin_country || !destination_country) {
            throw new Error("Missing or invalid fields: amount, currency, origin_country, destination_country");
        }

        const isAfricanTrade = isIntraAfrica(origin_country, destination_country);
        const isInternational = !isAfricanTrade; // Simplified logic

        // 1. Calculate Fees
        const stripeFee = calculateStripeFee(amount, currency, isInternational);
        const flutterwaveFee = calculateFlutterwaveFee(amount, currency, isAfricanTrade);

        // PAPSS is only available for Intra-African trade
        const papssFee = isAfricanTrade ? calculatePAPSSFee(amount, currency) : null;

        // 2. Build Comparison Table
        const options = [
            {
                provider: 'Stripe',
                type: 'Card / Global',
                fee: stripeFee,
                total_cost: amount + stripeFee,
                delivery_time: 'Instant'
            },
            {
                provider: 'Flutterwave',
                type: 'Mobile Money / Local Card',
                fee: flutterwaveFee,
                total_cost: amount + flutterwaveFee,
                delivery_time: 'Instant'
            }
        ];

        if (papssFee !== null) {
            options.push({
                provider: 'PAPSS',
                type: 'Bank Settlement (Direct)',
                fee: papssFee,
                total_cost: amount + papssFee,
                delivery_time: '24 Hours' // Settlement delay
            });
        }

        // 3. Recommend Best Option
        // Sort by Fee (Lowest first)
        options.sort((a, b) => a.fee - b.fee);

        const recommendation = options[0];
        const savings = options[1].fee - recommendation.fee;

        return new Response(JSON.stringify({
            recommendation: {
                provider: recommendation.provider,
                saving_amount: savings > 0 ? parseFloat(savings.toFixed(2)) : 0,
                reason: `Lowest fee option via ${recommendation.type}`
            },
            analysis: {
                trade_type: isAfricanTrade ? 'Intra-African' : 'Global',
                currency,
                amount
            },
            options: options.map(o => ({
                ...o,
                fee: parseFloat(o.fee.toFixed(2)),
                total_cost: parseFloat(o.total_cost.toFixed(2))
            }))
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
