import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * KoniAI Fraud Evaluation v1.0
 * Specialized Edge Function for automated risk assessment.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function evaluateFraud(data: any) {
    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const systemInstruction = `You are the sovereign Risk Evaluator for Afrikoni. 
    Analyze the provided data (Audit Logs, Company Profile, Trade History) to identify fraud indicators.
    
    CHECK FOR:
    - Synthetic identity patterns (generic emails, missing physical presence).
    - Shell company markers (no trading history but high-value RFQs).
    - Velocity anomalies (unusually high action count in short timeframes).
    - Document inconsistencies (mismatches between profile and DNA extraction).
    
    OUTPUT SCHEMA:
    {
      "fraud_score": number (0-100, where 100 is critical risk),
      "risk_level": "low" | "medium" | "high" | "critical",
      "risk_factors": string[],
      "summary": string,
      "ai_confidence": number (0-1)
    }
    
    Return ONLY valid JSON.`;

        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `DATASET TO ANALYZE:\n${JSON.stringify(data, null, 2)}` }]
                }
            ],
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.1,
                response_mime_type: "application/json"
            }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini Fraud Eval Error: ${response.status} ${errorBody}`);
        }

        const result = await response.json();
        return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    } catch (error) {
        console.error('Fraud Evaluation error:', error);
        throw error;
    }
}

async function main(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Authorization required");

        const { company_id } = await req.json();
        if (!company_id) throw new Error("company_id required");

        console.log(`[FraudEval] Analyzing company: ${company_id}`);

        // 1. Fetch Company Profile
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', company_id)
            .single();

        if (companyError) throw new Error(`Company not found: ${companyError.message}`);

        // 2. Fetch Recent Audit Logs (Velocity check)
        const { data: logs } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('actor_company_id', company_id)
            .order('created_at', { ascending: false })
            .limit(50);

        // 3. Fetch Trade History
        const { data: trades } = await supabase
            .from('trades')
            .select('id, status, total_value')
            .or(`buyer_id.eq.${company_id},seller_id.eq.${company_id}`)
            .limit(10);

        // 4. Run AI Evaluation
        const evaluation = await evaluateFraud({
            company,
            recent_logs: logs || [],
            trade_history: trades || [],
            timestamp: new Date().toISOString()
        });

        console.log(`[FraudEval] Result for ${company_id}: Score=${evaluation.fraud_score}, Confidence=${evaluation.ai_confidence}`);

        // 5. AUTO-VERIFY LOGIC (The Chief Trust Officer Automation)
        // If risk is extremely low AND AI confidence is high, auto-promote to 'verified'
        let finalStatus = company.verification_status;
        let autoPromoted = false;

        if (
            evaluation.fraud_score < 20 &&
            evaluation.ai_confidence > 0.9 &&
            company.verification_status === 'pending'
        ) {
            finalStatus = 'verified';
            autoPromoted = true;
            console.log(`[FraudEval] AUTO-PROMOTING company ${company_id} to VERIFIED status.`);
        }

        // 6. Update Company Risk Profile & Status
        const { error: updateError } = await supabase.from('companies').update({
            ai_fraud_score: evaluation.fraud_score,
            last_fraud_check_at: new Date().toISOString(),
            risk_level: evaluation.risk_level,
            verification_status: finalStatus,
            verification_notes: `AI Evaluation: ${evaluation.summary}${autoPromoted ? ' [AUTO-PROMOTED]' : ''}`
        }).eq('id', company_id);

        if (updateError) throw updateError;

        // 7. Log the automation event
        await supabase.from('trade_events').insert({
            event_type: autoPromoted ? 'ai_auto_verification_success' : 'ai_fraud_evaluation_complete',
            payload: {
                company_id,
                evaluation,
                auto_promoted: autoPromoted
            }
        });

        return new Response(
            JSON.stringify({ ...evaluation, auto_promoted: autoPromoted, new_status: finalStatus }),
            {
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
                status: 200
            }
        );

    } catch (error) {
        console.error('Fraud Eval Error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            }
        );
    }
}

Deno.serve(main);
