import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AFRIKONI RECOMMENDATION ENGINE (Collaborative Filtering)
 * 
 * Logic: "Users who bought X also bought Y"
 * Method: Item-based Collaborative Filtering (Co-occurrence Matrix)
 * Fallback: Trending Products (Most Traded)
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { buyer_id } = await req.json();

        // 1. Fetch Completed Trade History (All Users)
        const { data: trades, error } = await supabase
            .from('trades')
            .select('*')
            .eq('status', 'completed');

        if (error) throw error;

        // Ensure trades is an array for type safety
        const typedTrades: { buyer_id: string; title?: string; category?: string; total_value?: number; product_name?: string }[] = trades || [];

        // 2. Build User-Product Map
        // userPurchases: { 'user1': ['Cocoa', 'Coffee'], 'user2': ['Cocoa', 'Jute Bags'] }
        const userPurchases: Record<string, Set<string>> = {};
        const productPopularity: Record<string, number> = {};

        // process typedTrades
        typedTrades.forEach((trade) => {
            const userId = trade.buyer_id;
            const product = trade.product_name || trade.title || trade.category || 'Unknown';

            if (!userPurchases[userId]) {
                userPurchases[userId] = new Set();
            }
            userPurchases[userId].add(product);

            productPopularity[product] = (productPopularity[product] || 0) + 1;
        });

        // 3. Identify Current User's Purchases
        const myPurchases = userPurchases[buyer_id] ? Array.from(userPurchases[buyer_id]) : [];

        // 4. Generate Recommendations
        const recommendations: Record<string, number> = {};

        if (myPurchases.length > 0) {
            // Collaborative Filtering
            Object.values(userPurchases).forEach(otherUserProducts => {
                const otherUserArray = Array.from(otherUserProducts);

                // Find intersection (similarity)
                const common = myPurchases.filter(p => otherUserProducts.has(p));

                if (common.length > 0) {
                    // This user is similar!
                    // Recommend products they bought that I haven't
                    otherUserArray.forEach(p => {
                        if (!myPurchases.includes(p)) {
                            recommendations[p] = (recommendations[p] || 0) + (common.length); // Weight by similarity
                        }
                    });
                }
            });
        }

        // 5. Sort & Format Recommendations
        let recommendedProducts = Object.entries(recommendations)
            .sort((a, b) => b[1] - a[1])
            .map(([product, score]) => ({ product, score, reason: 'Based on your trade history' }))
            .slice(0, 5);

        // Fallback: If no recommendations (e.g., new user or no patterns found), use Trending
        if (recommendedProducts.length === 0) {
            recommendedProducts = Object.entries(productPopularity)
                .sort((a, b) => b[1] - a[1])
                .map(([product, score]) => ({ product, score, reason: 'Trending on Afrikoni' }))
                .slice(0, 5);
        }

        return new Response(JSON.stringify({
            buyer_id,
            recommendations: recommendedProducts,
            history_count: myPurchases.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Recommendation Engine Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
