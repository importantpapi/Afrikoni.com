import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * AFRIKONI DISPUTE RESOLUTION AI (The Judge)
 * 
 * Policy-First Architecture:
 * 1. Policy determines the verdict (deterministic).
 * 2. AI provides context, reasoning, and narrative.
 * 3. Enforced Authorization & Idempotency.
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIVerdict {
    verdict: 'REFUND_BUYER' | 'WAIT_FOR_SELLER' | 'MANUAL_REVIEW';
    confidence: number;
    reasoning: string;
    recommended_action: string;
    missing_evidence?: string[];
}

function cleanGeminiOutput(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

async function getAIReasoning(caseDetails: any): Promise<AIVerdict> {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are the KoniAI Dispute Advisor. 
    Analyze this trade dispute and provide a narrative reasoning.
    
    POLICY RULE: If shipment is > 14 days overdue AND no tracking updates for > 7 days, it is a REFUND.
    
    Case Details:
    - Overdue: ${caseDetails.days_overdue} days
    - Last Update: ${caseDetails.has_recent_movement ? 'Recent' : 'None in 7 days'}
    - Trade: ${caseDetails.currency} ${caseDetails.amount}
    - Parties: ${caseDetails.buyer_name} (Buyer) vs ${caseDetails.seller_name} (Seller)
    
    Output JSON ONLY:
    {
        "verdict": "REFUND_BUYER" | "WAIT_FOR_SELLER" | "MANUAL_REVIEW",
        "confidence": number,
        "reasoning": "Legal-style narrative explanation",
        "recommended_action": "Specific next steps",
        "missing_evidence": ["what information would help?"]
    }`;

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json", temperature: 0.0 }
            })
        });

        const data = await response.json();
        const textResponse = cleanGeminiOutput(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
        const aiJson = JSON.parse(textResponse);

        // Basic validation
        if (!['REFUND_BUYER', 'WAIT_FOR_SELLER', 'MANUAL_REVIEW'].includes(aiJson.verdict)) {
            aiJson.verdict = 'MANUAL_REVIEW';
        }
        return aiJson;
    } catch (e) {
        console.error("Gemini Parsing Error:", e);
        return {
            verdict: 'MANUAL_REVIEW',
            confidence: 0,
            reasoning: "AI analysis unavailable. Policy engine fallback used.",
            recommended_action: "Escalate to human support for manual verification."
        };
    }
}

// @ts-ignore: Deno.serve is globally available in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization');

    try {
        // 1. JWT & Authorization Check
        if (!authHeader) throw new Error("Missing Authorization header");
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

        const { dispute_id } = await req.json();
        if (!dispute_id) throw new Error("Missing dispute_id");

        // 2. Fetch Comprehensive Dispute Data
        const { data: dispute, error: disputeError } = await supabase
            .from('disputes')
            .select(`
                *,
                trade:trades (
                    id, total_value, currency, seller_id, buyer_id,
                    buyer_comp:companies!buyer_id(id, company_name),
                    seller_comp:companies!seller_id(id, company_name),
                    shipments (
                        id, status, estimated_delivery_date, updated_at, is_active
                    )
                )
            `)
            .eq('id', dispute_id)
            .single();

        if (disputeError || !dispute) throw new Error("Dispute not found");

        // 3. Authorization Logic (Parties or Admin)
        const { data: profile } = await supabase.from('profiles').select('company_id, is_admin').eq('id', user.id).single();
        const isAuthorized = profile?.is_admin ||
            profile?.company_id === dispute.trade.buyer_id ||
            profile?.company_id === dispute.trade.seller_id;

        if (!isAuthorized) return new Response('Forbidden: You are not a party to this dispute', { status: 403, headers: corsHeaders });

        // 4. State Gating & Idempotency
        const judgeableStatuses = ['open', 'pending_info', 'in_review'];
        if (!judgeableStatuses.includes(dispute.status)) {
            return new Response(JSON.stringify({
                success: true,
                message: "Dispute already resolved or in final state",
                verdict: dispute.ai_verdict
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Hardened Shipment Selection
        const shipment = dispute.trade.shipments?.find((s: any) => s.is_active) ||
            dispute.trade.shipments?.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        if (!shipment) throw new Error("No shipment payload available for analysis");

        // 6. Precise Movement Check (Last 7 Days)
        const now = new Date(); // Define now here for use in this section
        const { data: movementEvents } = await supabase
            .from('shipment_tracking_events')
            .select('id')
            .eq('shipment_id', shipment.id)
            .gte('event_timestamp', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .in('event_type', ['picked_up', 'in_transit', 'arrived_at_facility', 'departed_facility'])
            .limit(1);

        const hasRecentMovement = (movementEvents?.length || 0) > 0;

        // 7. Deterministic Policy Engine (Source of Truth)
        const estimatedDelivery = shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date) : null;

        // Normalize to UTC for reliable math
        const daysOverdue = estimatedDelivery
            ? Math.max(0, Math.floor((now.getTime() - estimatedDelivery.getTime()) / (1000 * 3600 * 24)))
            : 0;

        const isPolicyRefund = daysOverdue > 14 && !hasRecentMovement;

        // 8. Get AI Context (Explanation Layer)
        const aiVerdict = await getAIReasoning({
            ...dispute,
            days_overdue: daysOverdue,
            has_recent_movement: hasRecentMovement,
            seller_name: dispute.trade.seller_comp.company_name,
            buyer_name: dispute.trade.buyer_comp.company_name,
            amount: dispute.trade.total_value,
            currency: dispute.trade.currency
        });

        // Override AI verdict with deterministic Policy Engine if rule triggers
        const finalVerdict: AIVerdict = {
            ...aiVerdict,
            verdict: isPolicyRefund ? 'REFUND_BUYER' : aiVerdict.verdict,
            reasoning: isPolicyRefund
                ? `[POLICY TRIGGERED] ${aiVerdict.reasoning}`
                : aiVerdict.reasoning
        };

        // 9. Update Record with Audit Trail
        const { error: updateError } = await supabase
            .from('disputes')
            .update({
                ai_verdict: finalVerdict,
                ai_judged_at: now.toISOString(),
                status: finalVerdict.verdict === 'REFUND_BUYER' ? 'resolved_refund_pending' : 'escalated_to_admin',
                updated_at: now.toISOString()
            })
            .eq('id', dispute_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
            success: true,
            policy_triggered: isPolicyRefund,
            verdict: finalVerdict
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Judge Forensic Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
